// Pure calculations derived from orders + stage history.
// No storage access here — feed it whatever the data layer returns.

import { isEmptyValue } from "./fields";
import type { FieldDefinition, FieldValue, Order, Stage, StageHistoryEntry } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

const LOCALE = "tr-TR";

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** "17 Tem 2026 · 11:40" */
export function formatDateTime(iso: string) {
  const date = new Date(iso);
  const time = date.toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit" });
  return `${formatDate(iso)} · ${time}`;
}

export function formatDuration(ms: number) {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes} dk`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours} saat`;
  const days = ms / DAY_MS;
  return `${days.toFixed(1)} gün`;
}

/** When the order entered the stage it is in right now. */
export function stageEnteredAt(order: Order, history: StageHistoryEntry[]) {
  const latest = history
    .filter((entry) => entry.order_id === order.id)
    .sort((a, b) => Date.parse(b.changed_at) - Date.parse(a.changed_at))[0];
  return latest ? latest.changed_at : order.created_at;
}

export function timeInCurrentStage(order: Order, history: StageHistoryEntry[], now = Date.now()) {
  return now - Date.parse(stageEnteredAt(order, history));
}

/** Was this timestamp within the last N days? */
export function withinLastDays(iso: string, days: number, now = Date.now()) {
  return Date.parse(iso) >= now - days * DAY_MS;
}

/** Was this timestamp within [startDate, endDate] (yyyy-mm-dd, either end optional, inclusive)? */
export function withinDateRange(iso: string, startDate: string, endDate: string) {
  const time = Date.parse(iso);
  if (startDate && time < Date.parse(`${startDate}T00:00:00`)) return false;
  if (endDate && time > Date.parse(`${endDate}T23:59:59.999`)) return false;
  return true;
}

export function countByStage(orders: Order[], stages: Stage[]) {
  return stages.map((stage) => ({
    stage,
    count: orders.filter((order) => order.current_stage === stage.name).length,
  }));
}

/**
 * Average time orders have spent in each stage, using completed spans only —
 * i.e. a stage an order has since moved out of. Stages with no completed spans
 * return null.
 */
export function averageTimePerStage(stages: Stage[], history: StageHistoryEntry[]) {
  const totals = new Map<string, { total: number; count: number }>();

  const byOrder = new Map<string, StageHistoryEntry[]>();
  for (const entry of history) {
    const list = byOrder.get(entry.order_id) ?? [];
    list.push(entry);
    byOrder.set(entry.order_id, list);
  }

  for (const entries of byOrder.values()) {
    const sorted = entries.sort((a, b) => Date.parse(a.changed_at) - Date.parse(b.changed_at));
    for (let i = 0; i < sorted.length - 1; i++) {
      const span = Date.parse(sorted[i + 1].changed_at) - Date.parse(sorted[i].changed_at);
      const bucket = totals.get(sorted[i].to_stage) ?? { total: 0, count: 0 };
      bucket.total += span;
      bucket.count += 1;
      totals.set(sorted[i].to_stage, bucket);
    }
  }

  return stages.map((stage) => {
    const bucket = totals.get(stage.name);
    return {
      stage,
      averageMs: bucket && bucket.count > 0 ? bucket.total / bucket.count : null,
      sampleSize: bucket?.count ?? 0,
    };
  });
}

/** Orders sitting in their current stage longer than the threshold. */
export function overdueOrders(
  orders: Order[],
  history: StageHistoryEntry[],
  thresholdDays: number,
  now = Date.now(),
) {
  return orders
    .map((order) => ({ order, elapsedMs: timeInCurrentStage(order, history, now) }))
    .filter(({ elapsedMs }) => elapsedMs > thresholdDays * DAY_MS)
    .sort((a, b) => b.elapsedMs - a.elapsedMs);
}

export function isOverdue(
  order: Order,
  history: StageHistoryEntry[],
  thresholdDays: number,
  now = Date.now(),
) {
  return timeInCurrentStage(order, history, now) > thresholdDays * DAY_MS;
}

/** How far past the threshold an already-overdue order's wait has gone. */
export function exceededBy(elapsedMs: number, thresholdDays: number) {
  return elapsedMs - thresholdDays * DAY_MS;
}

/** The stage currently holding the most orders — null when there are none. */
export function busiestStage(counts: ReturnType<typeof countByStage>) {
  return counts.reduce<ReturnType<typeof countByStage>[number] | null>(
    (max, entry) => (entry.count > (max?.count ?? -1) ? entry : max),
    null,
  );
}

/** The stage with the highest average dwell time — the pipeline's bottleneck. */
export function slowestStage(averages: ReturnType<typeof averageTimePerStage>) {
  return averages.reduce<ReturnType<typeof averageTimePerStage>[number] | null>(
    (max, entry) =>
      entry.averageMs !== null && entry.averageMs > (max?.averageMs ?? -1) ? entry : max,
    null,
  );
}

/** "17 Tem" — no year, for dense axis labels. */
export function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString(LOCALE, { day: "2-digit", month: "short" });
}

const dayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** New orders per calendar day between two dates (inclusive), oldest first. */
export function ordersCreatedByDayRange(orders: Order[], start: Date, end: Date) {
  const startDay = new Date(start);
  startDay.setHours(0, 0, 0, 0);
  const endDay = new Date(end);
  endDay.setHours(0, 0, 0, 0);
  const days = Math.max(1, Math.round((endDay.getTime() - startDay.getTime()) / DAY_MS) + 1);

  const series = Array.from({ length: days }, (_, i) => {
    const date = new Date(startDay.getTime() + i * DAY_MS);
    return { key: dayKey(date), iso: date.toISOString(), count: 0 };
  });
  const byKey = new Map(series.map((point) => [point.key, point]));

  for (const order of orders) {
    const point = byKey.get(dayKey(new Date(order.created_at)));
    if (point) point.count += 1;
  }

  return series.map(({ iso, count }) => ({ date: iso, count }));
}

/** New orders per calendar day over the trailing window, oldest first. */
export function ordersCreatedByDay(orders: Order[], days: number, now = Date.now()) {
  return ordersCreatedByDayRange(orders, new Date(now - (days - 1) * DAY_MS), new Date(now));
}

/**
 * How many orders have ever reached each stage (currently sitting there, or
 * passed through it on their way elsewhere), in stage order. Since orders can
 * move backwards, this is a "reach" funnel, not a strict linear conversion.
 */
export function stageReachCounts(orders: Order[], stages: Stage[], history: StageHistoryEntry[]) {
  const reached = new Map<string, Set<string>>();
  for (const order of orders) {
    const set = reached.get(order.current_stage) ?? new Set<string>();
    set.add(order.id);
    reached.set(order.current_stage, set);
  }
  for (const entry of history) {
    const set = reached.get(entry.to_stage) ?? new Set<string>();
    set.add(entry.order_id);
    reached.set(entry.to_stage, set);
  }

  const total = orders.length;
  return stages.map((stage) => {
    const count = reached.get(stage.name)?.size ?? 0;
    return { stage, count, share: total > 0 ? count / total : 0 };
  });
}

/** Stages with a completed average, ranked slowest first. */
export function rankByAverageTime(averages: ReturnType<typeof averageTimePerStage>) {
  return averages
    .filter((entry): entry is typeof entry & { averageMs: number } => entry.averageMs !== null)
    .sort((a, b) => b.averageMs - a.averageMs);
}

/**
 * Average time from creation to the first time an order reached the given
 * stage — end-to-end cycle time. Orders that haven't reached it yet are
 * excluded, so this only reflects completed runs.
 */
export function averageCycleTime(
  orders: Order[],
  history: StageHistoryEntry[],
  finalStageName: string | undefined,
) {
  if (!finalStageName) return { averageMs: null as number | null, sampleSize: 0 };

  let total = 0;
  let count = 0;
  for (const order of orders) {
    const first = history
      .filter((entry) => entry.order_id === order.id && entry.to_stage === finalStageName)
      .sort((a, b) => Date.parse(a.changed_at) - Date.parse(b.changed_at))[0];
    if (!first) continue;
    total += Date.parse(first.changed_at) - Date.parse(order.created_at);
    count += 1;
  }
  return { averageMs: count > 0 ? total / count : null, sampleSize: count };
}

/**
 * How orders split across one select/multiselect field's option values —
 * counts every selection, so a multiselect's total can exceed the order
 * count. Item-scoped fields count every line item across every order.
 */
export function breakdownByField(orders: Order[], field: FieldDefinition) {
  const values: FieldValue[] =
    field.scope === "item"
      ? orders.flatMap((order) => (order.items ?? []).map((item) => item.field_values?.[field.key] ?? null))
      : orders.map((order) => order.field_values?.[field.key] ?? null);

  const counts = new Map<string, number>();
  for (const value of values) {
    if (isEmptyValue(value)) continue;
    const entries = Array.isArray(value) ? value.map(String) : [String(value)];
    for (const entry of entries) counts.set(entry, (counts.get(entry) ?? 0) + 1);
  }

  const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count, share: total > 0 ? count / total : 0 }))
    .sort((a, b) => b.count - a.count);
}
