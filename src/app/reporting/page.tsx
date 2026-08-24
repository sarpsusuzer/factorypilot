"use client";

import { BarChart3, Calendar, Check, ChevronDown, Clock, LayoutGrid, PieChart, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { ListRow } from "@/components/list-row";
import { OrderStatusBar } from "@/components/order-status-bar";
import { SectionCard } from "@/components/section-card";
import { StageBadge } from "@/components/stage-badge";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useData } from "@/lib/data";
import { itemFields, orderFields } from "@/lib/fields";
import {
  averageCycleTime,
  averageTimePerStage,
  breakdownByField,
  formatDuration,
  formatShortDate,
  ordersCreatedByDayRange,
  overdueOrders,
  rankByAverageTime,
  slowestStage,
  stageReachCounts,
  withinDateRange,
  withinLastDays,
} from "@/lib/reporting";
import { dedupeStagesByName, stageColorDot, stageColorText } from "@/lib/stage-colors";
import { cn } from "@/lib/utils";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_RANGE_DAYS = 366;

const ALL = "__all__";
const CUSTOM = "__custom__";
const DATE_PRESETS = [
  { value: ALL, label: "Tüm tarihler" },
  { value: "7", label: "Son 7 gün" },
  { value: "30", label: "Son 30 gün" },
  { value: "90", label: "Son 90 gün" },
];

function dateFilterLabel(dateFilter: string, customStart: string, customEnd: string) {
  const preset = DATE_PRESETS.find((option) => option.value === dateFilter);
  if (preset) return preset.label;
  const short = (date: string) => formatShortDate(`${date}T00:00:00`);
  if (customStart && customEnd) return `${short(customStart)} – ${short(customEnd)}`;
  if (customStart) return `${short(customStart)}’den beri`;
  if (customEnd) return `${short(customEnd)}’e kadar`;
  return "Özel aralık";
}

export default function ReportingPage() {
  const { loaded, orders, stages: rawStages, fields, company, history, settings, can } = useData();
  const [dateFilter, setDateFilter] = useState<string>(ALL);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // A matched müşteri also sees the üretici's stages — collapse same-named
  // rows so a shared stage name doesn't get counted/ranked twice.
  const stages = useMemo(() => dedupeStagesByName(rawStages), [rawStages]);
  const lastStage = stages[stages.length - 1]?.name;
  // A müşteri's own field list is empty — fall back to whichever schema is
  // in view, same rule the order list and new-order form use.
  const ownFields = fields.filter((field) => field.company_id === company?.id);
  const scopedFields = ownFields.length > 0 ? ownFields : fields;
  const breakdownFields = [...orderFields(scopedFields), ...itemFields(scopedFields)].filter(
    (field) => field.type === "select" || field.type === "multiselect",
  );

  // Every metric below scopes to the selected period, by order creation date.
  const periodOrders = useMemo(
    () =>
      orders.filter((order) => {
        if (dateFilter === ALL) return true;
        if (dateFilter === CUSTOM) return withinDateRange(order.created_at, customStart, customEnd);
        return withinLastDays(order.created_at, Number(dateFilter));
      }),
    [orders, dateFilter, customStart, customEnd],
  );
  const periodOrderIds = useMemo(() => new Set(periodOrders.map((order) => order.id)), [periodOrders]);
  const periodHistory = useMemo(
    () => history.filter((entry) => periodOrderIds.has(entry.order_id)),
    [history, periodOrderIds],
  );
  const periodLabel = dateFilterLabel(dateFilter, customStart, customEnd);

  const rangeEnd = useMemo(() => {
    if (dateFilter === CUSTOM && customEnd) return new Date(`${customEnd}T23:59:59`);
    return new Date();
  }, [dateFilter, customEnd]);
  const rangeStart = useMemo(() => {
    if (dateFilter === CUSTOM) {
      if (customStart) return new Date(`${customStart}T00:00:00`);
    } else if (dateFilter !== ALL) {
      return new Date(rangeEnd.getTime() - (Number(dateFilter) - 1) * DAY_MS);
    }
    const earliest = periodOrders.reduce(
      (min, order) => Math.min(min, Date.parse(order.created_at)),
      rangeEnd.getTime(),
    );
    const capped = Math.max(earliest, rangeEnd.getTime() - (MAX_RANGE_DAYS - 1) * DAY_MS);
    return new Date(periodOrders.length > 0 ? capped : rangeEnd.getTime() - 29 * DAY_MS);
  }, [dateFilter, customStart, rangeEnd, periodOrders]);

  const averages = useMemo(
    () => averageTimePerStage(stages, periodHistory),
    [periodHistory, stages],
  );
  const dailyVolume = useMemo(
    () => ordersCreatedByDayRange(periodOrders, rangeStart, rangeEnd),
    [periodOrders, rangeStart, rangeEnd],
  );
  const ranked = useMemo(() => rankByAverageTime(averages), [averages]);

  const slowest = useMemo(() => slowestStage(averages), [averages]);

  const reach = useMemo(
    () => stageReachCounts(periodOrders, stages, periodHistory),
    [periodOrders, stages, periodHistory],
  );

  const activeCount = useMemo(
    () => periodOrders.filter((order) => order.current_stage !== lastStage).length,
    [periodOrders, lastStage],
  );
  // Overdue-ness is a present-moment status, not scoped to the selected
  // period — a stalled order from last month is still overdue today.
  const overdue = useMemo(
    () => overdueOrders(orders, history, settings.overdue_threshold_days),
    [orders, history, settings.overdue_threshold_days],
  );
  const cycleTime = useMemo(
    () => averageCycleTime(periodOrders, periodHistory, lastStage),
    [periodOrders, periodHistory, lastStage],
  );
  const breakdowns = useMemo(
    () => breakdownFields.map((field) => ({ field, entries: breakdownByField(periodOrders, field) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [periodOrders, fields],
  );

  if (loaded && !can("view_reporting")) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Raporlar</h1>
        <p className="text-muted-foreground">Bu ekrana erişim yetkiniz yok.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Raporlar</h1>
          <p className="text-sm text-muted-foreground">
            {loaded ? "Siparişlerinizden ve aşama geçmişinden canlı veriler." : "Yükleniyor…"}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-auto min-w-40 justify-between border-input bg-background font-normal"
              aria-label="Döneme göre filtrele"
            >
              <span className="flex items-center gap-1.5">
                <Calendar className="size-4 text-muted-foreground" />
                {periodLabel}
              </span>
              <ChevronDown className="size-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            {DATE_PRESETS.map((preset) => (
              <DropdownMenuItem
                key={preset.value}
                onSelect={() => {
                  setDateFilter(preset.value);
                  setCustomStart("");
                  setCustomEnd("");
                }}
              >
                {preset.label}
                {dateFilter === preset.value && <Check className="ml-auto size-3.5" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <div className="space-y-2 px-1.5 py-1">
              <p className="text-xs font-medium text-muted-foreground">Özel aralık</p>
              <div className="flex items-center gap-1.5">
                <Input
                  type="date"
                  value={customStart}
                  onChange={(event) => {
                    setCustomStart(event.target.value);
                    setDateFilter(CUSTOM);
                  }}
                  max={customEnd || undefined}
                  aria-label="Başlangıç tarihi"
                  size="md"
                  className="text-xs"
                />
                <span className="text-xs text-muted-foreground">–</span>
                <Input
                  type="date"
                  value={customEnd}
                  onChange={(event) => {
                    setCustomEnd(event.target.value);
                    setDateFilter(CUSTOM);
                  }}
                  min={customStart || undefined}
                  aria-label="Bitiş tarihi"
                  size="md"
                  className="text-xs"
                />
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Toplam sipariş" value={periodOrders.length} caption={periodLabel} />
        <StatCard
          label="Aktif sipariş"
          value={activeCount}
          caption={lastStage ? `Henüz “${lastStage}” değil` : "—"}
        />
        <StatCard
          label="Geciken"
          value={overdue.length}
          caption={`Bir aşamada ${settings.overdue_threshold_days} günden fazla (şimdi)`}
        />
        <StatCard
          label="Ort. tamamlanma"
          value={cycleTime.averageMs !== null ? formatDuration(cycleTime.averageMs) : "—"}
          caption={
            lastStage
              ? `Oluşturmadan “${lastStage}”a kadar (${cycleTime.sampleSize} sipariş)`
              : "Aşama tanımlı değil"
          }
        />
      </div>

      <SectionCard
        icon={<PieChart className="size-4" />}
        title="Sipariş durumları"
        description={`${periodLabel} — aşamalara göre dağılım.`}
        contentFramed={false}
      >
        <OrderStatusBar orders={periodOrders} stages={stages} />
      </SectionCard>

      <div className="grid gap-3 lg:grid-cols-2">
        <SectionCard
          icon={<TrendingUp className="size-4" />}
          title="Sipariş yoğunluğu tarihçesi"
          description={`${periodLabel} — oluşturulan sipariş sayısı, güne göre.`}
        >
          {periodOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Bu dönemde sipariş yok.</p>
          ) : (
            <OrderVolumeChart series={dailyVolume} />
          )}
        </SectionCard>

        <SectionCard
          icon={<Clock className="size-4" />}
          title="Aşama başına ortalama süre"
          description={
            <>
              Siparişlerin çıkmış olduğu aşamalara göre hesaplanır. Siparişin hâlâ beklediği aşama
              henüz sayılmaz.
              {slowest && slowest.averageMs !== null
                ? ` En yavaş aşama: ${slowest.stage.name} (${formatDuration(slowest.averageMs)}).`
                : ""}
            </>
          }
        >
          {ranked.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Henüz tamamlanmış bir aşama geçişi yok.
            </p>
          ) : (
            <StageDurationChart entries={ranked} />
          )}
        </SectionCard>
      </div>

      <SectionCard
        icon={<LayoutGrid className="size-4" />}
        title="Aşama dağılımı"
        description="Her aşamaya bugüne kadar uğramış sipariş sayısının payı. Sipariş geri adım atabildiği için bir siparişin birden fazla aşamaya katkısı olabilir."
      >
        {periodOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">Bu dönemde sipariş yok.</p>
        ) : (
          <StagePie entries={reach} />
        )}
      </SectionCard>

      {breakdowns.length > 0 && (
        <div className="grid gap-3 lg:grid-cols-2">
          {breakdowns.map(({ field, entries }) => (
            <SectionCard
              key={field.id}
              icon={<BarChart3 className="size-4" />}
              title={field.label}
              description={field.scope === "item" ? "Kalemlere göre dağılım." : "Siparişlere göre dağılım."}
            >
              {entries.length === 0 ? (
                <p className="text-sm text-muted-foreground">Henüz bu alan için veri yok.</p>
              ) : (
                <FieldDistributionBar entries={entries} />
              )}
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Ranking by magnitude — a real bar chart, not a progress bar: bars share one
 * baseline (the left border), have no background track, and only the data
 * end is rounded. Each stage keeps the color it wears everywhere else
 * (badges, kanban, the status bar).
 */
function StageDurationChart({ entries }: { entries: ReturnType<typeof rankByAverageTime> }) {
  const max = entries[0]?.averageMs || 1;
  return (
    <ol className="space-y-4 border-l border-border pl-4">
      {entries.map((entry, index) => (
        <li key={entry.stage.id} className="flex items-center gap-3">
          <span className="w-4 shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-sm">
              <StageBadge stage={entry.stage.name} />
              <span className="text-xs text-muted-foreground">{entry.sampleSize} geçiş</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={cn("h-2.5 rounded-r-full", stageColorDot(entry.stage.color))}
                style={{ width: `${Math.max(3, (entry.averageMs / max) * 100)}%` }}
              />
              <span className="shrink-0 text-xs font-medium tabular-nums">
                {formatDuration(entry.averageMs)}
              </span>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

const PIE_SIZE = 176;
const PIE_RADIUS = 80;

function polarPoint(angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [PIE_SIZE / 2 + PIE_RADIUS * Math.cos(rad), PIE_SIZE / 2 + PIE_RADIUS * Math.sin(rad)] as const;
}

/** Each stage's share of total reach across the pipeline, as pie wedges in the stage's own color. */
function StagePie({ entries }: { entries: ReturnType<typeof stageReachCounts> }) {
  const nonEmpty = entries.filter((entry) => entry.count > 0);
  const total = nonEmpty.reduce((sum, entry) => sum + entry.count, 0) || 1;

  // Cumulative start angle per wedge, computed without mutating a shared
  // variable across the render — each entry's start is the running sum of
  // every sweep before it.
  const startAngles = nonEmpty.reduce<number[]>((acc, entry, index) => {
    const previous = index > 0 ? acc[index - 1] : 0;
    const previousSweep = index > 0 ? (nonEmpty[index - 1].count / total) * 360 : 0;
    acc.push(previous + previousSweep);
    return acc;
  }, []);

  const wedges = nonEmpty.map((entry, index) => {
    const sweep = (entry.count / total) * 360;
    const startAngle = startAngles[index];
    const endAngle = startAngle + sweep;
    const [x1, y1] = polarPoint(startAngle);
    const [x2, y2] = polarPoint(endAngle);
    const largeArc = sweep > 180 ? 1 : 0;
    const cx = PIE_SIZE / 2;
    const isFullCircle = sweep >= 359.99;
    const path = isFullCircle
      ? `M ${cx - PIE_RADIUS},${PIE_SIZE / 2} A ${PIE_RADIUS},${PIE_RADIUS} 0 1 1 ${cx + PIE_RADIUS},${PIE_SIZE / 2} A ${PIE_RADIUS},${PIE_RADIUS} 0 1 1 ${cx - PIE_RADIUS},${PIE_SIZE / 2} Z`
      : `M ${cx},${PIE_SIZE / 2} L ${x1},${y1} A ${PIE_RADIUS},${PIE_RADIUS} 0 ${largeArc} 1 ${x2},${y2} Z`;
    return { entry, path };
  });

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      <svg
        viewBox={`0 0 ${PIE_SIZE} ${PIE_SIZE}`}
        className="size-44 shrink-0"
        role="img"
        aria-label="Aşamalara göre sipariş dağılımı"
      >
        {wedges.map(({ entry, path }) => (
          <path
            key={entry.stage.id}
            d={path}
            className={stageColorText(entry.stage.color)}
            fill="currentColor"
            stroke="var(--card)"
            strokeWidth={2}
          />
        ))}
      </svg>
      <div className="w-full flex-1 space-y-0.5">
        {entries.map((entry) => (
          <ListRow
            key={entry.stage.id}
            label={<StageBadge stage={entry.stage.name} />}
            value={`${entry.count} sipariş`}
            meta={`%${Math.round(entry.share * 100)}`}
          />
        ))}
      </div>
    </div>
  );
}

// Validated categorical set (dataviz skill reference palette) — passes lightness
// band, chroma floor, and CVD separation; the app's own --chart-* tokens don't
// (chart-2 reads gray, chart-1/5 fall outside the lightness band).
const FIELD_CHART_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100"];
const FIELD_OTHER_COLOR = "#9a9890";
const FIELD_BREAKDOWN_LIMIT = 4;

/** Part-to-whole across a field's option values — one segmented bar + legend, not a list of bars. */
function FieldDistributionBar({
  entries,
}: {
  entries: { value: string; count: number; share: number }[];
}) {
  const top = entries.slice(0, FIELD_BREAKDOWN_LIMIT);
  const rest = entries.slice(FIELD_BREAKDOWN_LIMIT);
  const otherCount = rest.reduce((sum, entry) => sum + entry.count, 0);
  const otherShare = rest.reduce((sum, entry) => sum + entry.share, 0);
  const segments = [
    ...top.map((entry, index) => ({ ...entry, color: FIELD_CHART_COLORS[index] })),
    ...(rest.length > 0 ? [{ value: "Diğer", count: otherCount, share: otherShare, color: FIELD_OTHER_COLOR }] : []),
  ];

  return (
    <div className="space-y-3">
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-muted">
        {segments.map((segment, index) => (
          <div
            key={segment.value}
            title={`${segment.value}: ${segment.count}`}
            style={{ width: `${segment.share * 100}%`, backgroundColor: segment.color }}
            className={index < segments.length - 1 ? "border-r-2 border-background" : undefined}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {segments.map((segment) => (
          <div key={segment.value} className="flex items-center gap-1.5">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            <span className="truncate text-muted-foreground">{segment.value}</span>
            <span className="font-medium tabular-nums">{segment.count}</span>
            <span className="text-muted-foreground">(%{Math.round(segment.share * 100)})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const CHART_WIDTH = 640;
const CHART_HEIGHT = 200;
const CHART_PAD = { left: 8, right: 40, top: 16, bottom: 28 };

function OrderVolumeChart({ series }: { series: { date: string; count: number }[] }) {
  const plotWidth = CHART_WIDTH - CHART_PAD.left - CHART_PAD.right;
  const plotHeight = CHART_HEIGHT - CHART_PAD.top - CHART_PAD.bottom;
  const baseY = CHART_PAD.top + plotHeight;
  const maxCount = Math.max(1, ...series.map(({ count }) => count));

  const points = series.map(({ date, count }, index) => ({
    date,
    count,
    x:
      CHART_PAD.left +
      (series.length > 1 ? (index / (series.length - 1)) * plotWidth : plotWidth / 2),
    y: CHART_PAD.top + (1 - count / maxCount) * plotHeight,
  }));

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)},${point.y.toFixed(1)}`)
    .join(" ");
  const first = points[0];
  const last = points[points.length - 1];
  const mid = points[Math.floor((points.length - 1) / 2)];
  const areaPath = `${linePath} L ${last.x.toFixed(1)},${baseY} L ${first.x.toFixed(1)},${baseY} Z`;

  return (
    <svg
      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      preserveAspectRatio="none"
      className="h-48 w-full text-foreground"
      role="img"
      aria-label={`Son ${series.length} günde günlük yeni sipariş sayısı, en son gün ${last.count}`}
    >
      <line
        x1={CHART_PAD.left}
        y1={baseY}
        x2={CHART_WIDTH - CHART_PAD.right}
        y2={baseY}
        className="stroke-border"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
      <path d={areaPath} fill="currentColor" opacity={0.1} />
      <path
        d={linePath}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={last.x} cy={last.y} r={6} className="fill-background" />
      <circle cx={last.x} cy={last.y} r={4} fill="currentColor" />
      <text x={last.x + 10} y={last.y + 4} className="fill-foreground text-[11px] font-medium">
        {last.count}
      </text>
      <text x={first.x} y={CHART_HEIGHT - 8} textAnchor="start" className="fill-muted-foreground text-[10px]">
        {formatShortDate(first.date)}
      </text>
      <text x={mid.x} y={CHART_HEIGHT - 8} textAnchor="middle" className="fill-muted-foreground text-[10px]">
        {formatShortDate(mid.date)}
      </text>
      <text x={last.x} y={CHART_HEIGHT - 8} textAnchor="end" className="fill-muted-foreground text-[10px]">
        {formatShortDate(last.date)}
      </text>
    </svg>
  );
}
