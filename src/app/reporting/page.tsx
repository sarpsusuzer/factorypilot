"use client";

import { useMemo } from "react";
import { OrderStatusBar } from "@/components/order-status-bar";
import { StageBadge } from "@/components/stage-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useData } from "@/lib/data";
import {
  averageTimePerStage,
  formatDuration,
  formatShortDate,
  ordersCreatedByDay,
  rankByAverageTime,
  slowestStage,
} from "@/lib/reporting";

const HISTORY_WINDOW_DAYS = 30;

export default function ReportingPage() {
  const { loaded, orders, stages, history, can } = useData();

  const averages = useMemo(() => averageTimePerStage(stages, history), [history, stages]);
  const dailyVolume = useMemo(
    () => ordersCreatedByDay(orders, HISTORY_WINDOW_DAYS),
    [orders],
  );
  const ranked = useMemo(() => rankByAverageTime(averages), [averages]);

  const slowest = useMemo(() => slowestStage(averages), [averages]);

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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Raporlar</h1>
        <p className="text-sm text-muted-foreground">
          {loaded ? "Siparişlerinizden ve aşama geçmişinden canlı veriler." : "Yükleniyor…"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sipariş durumları</CardTitle>
          <CardDescription>Tüm siparişlerin aşamalara göre dağılımı.</CardDescription>
        </CardHeader>
        <CardContent>
          <OrderStatusBar orders={orders} stages={stages} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sipariş yoğunluğu tarihçesi</CardTitle>
            <CardDescription>
              Son {HISTORY_WINDOW_DAYS} günde oluşturulan sipariş sayısı, güne göre.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz sipariş yok.</p>
            ) : (
              <OrderVolumeChart series={dailyVolume} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aşama başına ortalama süre</CardTitle>
            <CardDescription>
              Siparişlerin çıkmış olduğu aşamalara göre hesaplanır. Siparişin hâlâ beklediği aşama
              henüz sayılmaz.
              {slowest && slowest.averageMs !== null
                ? ` En yavaş aşama: ${slowest.stage.name} (${formatDuration(slowest.averageMs)}).`
                : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ranked.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Henüz tamamlanmış bir aşama geçişi yok.
              </p>
            ) : (
              <ol className="space-y-3">
                {ranked.map((entry, index) => (
                  <li key={entry.stage.id} className="flex items-center gap-3">
                    <span className="w-4 text-sm font-semibold tabular-nums text-muted-foreground">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <StageBadge stage={entry.stage.name} />
                        <span className="font-medium tabular-nums">
                          {formatDuration(entry.averageMs)}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-foreground/70"
                          style={{ width: `${(entry.averageMs / ranked[0].averageMs) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
                      {entry.sampleSize} geçiş
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
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
