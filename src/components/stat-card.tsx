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
  /** Always-visible footnote under the value — for context worth showing outright. */
  caption?: ReactNode;
  trend?: { direction: "up" | "down"; label: string };
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-background p-3", className)}>
      <div className="flex items-center gap-1 px-1 pb-2 text-[13px] font-normal text-muted-foreground">
        <span className="truncate">{label}</span>
        {tooltip && (
          <span title={tooltip}>
            <Info className="size-3.5 shrink-0" aria-label={tooltip} />
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-2 rounded-md bg-card px-3 py-2.5">
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
      {caption && <p className="px-1 pt-1.5 text-[13px] text-muted-foreground">{caption}</p>}
    </div>
  );
}
