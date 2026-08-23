"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipContentProps } from "recharts";

export type ChartSeries = {
  key: string;
  label: string;
  color: string;
  strokeWidth?: number;
};

export type ChartPoint = { time: string } & Record<string, number | string>;

const DOT_GRID_STYLE = {
  backgroundImage: "radial-gradient(circle, #E4E4E7 1px, transparent 1px)",
  backgroundSize: "16px 16px",
};

function CustomTick({
  x,
  y,
  payload,
  activeLabel,
}: {
  x?: number;
  y?: number;
  payload?: { value: string };
  activeLabel: string | null;
}) {
  if (x === undefined || y === undefined || !payload) return null;
  const active = payload.value === activeLabel;

  if (active) {
    return (
      <g transform={`translate(${x},${y})`}>
        <rect x={-24} y={8} width={48} height={22} rx={11} fill="#18181B" />
        <text x={0} y={23} textAnchor="middle" fontSize={12} fontWeight={600} fill="#FFFFFF">
          {payload.value}
        </text>
      </g>
    );
  }

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={22} textAnchor="middle" fontSize={12} fill="#8B8B93">
        {payload.value}
      </text>
    </g>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  series,
  dayLabel,
}: TooltipContentProps & { series: ChartSeries[]; dayLabel: string }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-[168px] rounded-[10px] bg-[#1F1F23] px-3.5 py-3">
      <p className="pb-2 text-[13px] font-semibold text-white">
        {dayLabel}, {label}
      </p>
      <div className="space-y-1.5">
        {series.map((s) => {
          const point = payload.find((p) => p.dataKey === s.key);
          if (!point) return null;
          return (
            <div key={s.key} className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-1.5 text-[13px] text-[#B4B4BC]">
                <span className="size-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                {s.label}
              </span>
              <span className="text-[13px] font-semibold tabular-nums text-white">{point.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function OverviewLineChart({
  data,
  series,
  dayLabel = "Today",
  height = 320,
}: {
  data: ChartPoint[];
  series: ChartSeries[];
  dayLabel?: string;
  height?: number;
}) {
  const [activeLabel, setActiveLabel] = useState<string | null>(null);

  return (
    <div
      className="rounded-[16px] border border-[#EAEAEC] bg-[#F7F7F8] p-2"
      style={{ height }}
    >
      <div className="size-full rounded-[10px]" style={DOT_GRID_STYLE}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart
            data={data}
            margin={{ top: 24, right: 16, bottom: 8, left: 16 }}
            onMouseMove={(state) => {
              const label = state?.activeLabel;
              setActiveLabel(typeof label === "string" ? label : null);
            }}
            onMouseLeave={() => setActiveLabel(null)}
          >
            <CartesianGrid stroke="transparent" />
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              interval={2}
              tick={<CustomTick activeLabel={activeLabel} />}
              padding={{ left: 8, right: 8 }}
            />
            <YAxis hide domain={["dataMin - 8", "dataMax + 8"]} />
            <Tooltip
              cursor={{ stroke: "#3B82F6", strokeWidth: 1 }}
              content={(props) => <ChartTooltip {...props} series={series} dayLabel={dayLabel} />}
            />
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={s.strokeWidth ?? 2}
                dot={false}
                activeDot={{ r: 4, fill: s.color, stroke: "#FFFFFF", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
