import { Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A single KPI, always its own bordered card — summary numbers never share
 * one outer Card with dividers between them (that reads as one metric with
 * footnotes, not several independent stats).
 */
export function StatCard({
  label,
  value,
  tooltip,
  caption,
  trend,
  className,
}: {
  label: string;
  value: ReactNode;
  /** Shown as a hover tooltip on a small info glyph next to the label. */
  tooltip?: string;
  /** Always-visible footnote — sits top-right, opposite the label. */
  caption?: ReactNode;
  trend?: { direction: "up" | "down"; label: string };
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-background p-1.5", className)}>
      <div className="flex items-center justify-between gap-2 p-2 text-[13px] font-normal text-muted-foreground">
        <span className="flex min-w-0 flex-1 items-center gap-1">
          <span className="truncate">{label}</span>
          {tooltip && (
            <span title={tooltip}>
              <Info className="size-3.5 shrink-0" aria-label={tooltip} />
            </span>
          )}
        </span>
        {caption && <span className="min-w-0 shrink truncate text-right">{caption}</span>}
      </div>
      <div className="flex items-end justify-between gap-2 rounded-lg border border-border bg-card p-4">
        <span className="text-[30px] font-semibold leading-none tracking-tight text-foreground">
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              "mb-0.5 text-[13px] font-medium",
              trend.direction === "up" ? "text-[#3B82F6]" : "text-muted-foreground",
            )}
          >
            {trend.direction === "up" ? "↑" : "↓"} {trend.label}
          </span>
        )}
      </div>
    </div>
  );
}
