// Pure calculations derived from orders + stage history.
// No storage access here — feed it whatever the data layer returns.

import type { Order, Stage, StageHistoryEntry } from "./types";

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
