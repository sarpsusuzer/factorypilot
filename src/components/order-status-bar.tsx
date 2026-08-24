import type { Order, Stage } from "@/lib/types";
import { countByStage } from "@/lib/reporting";
import { stageColorDot } from "@/lib/stage-colors";
import { cn } from "@/lib/utils";

/** Single segmented bar + legend showing how orders split across stages. */
export function OrderStatusBar({ orders, stages }: { orders: Order[]; stages: Stage[] }) {
  const counts = countByStage(orders, stages);

  if (orders.length === 0) {
    return <p className="text-sm text-muted-foreground">Henüz sipariş yok.</p>;
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex h-11 w-full gap-1.5">
        {counts
          .filter(({ count }) => count > 0)
          .map(({ stage, count }) => (
            <div
              key={stage.id}
              title={`${stage.name}: ${count}`}
              className={cn("rounded-lg", stageColorDot(stage.color))}
              style={{ flex: `${count} ${count} 0%` }}
            />
          ))}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {counts.map(({ stage, count }) => (
          <div key={stage.id} className="flex items-center gap-1.5">
            <span className={cn("size-2.5 shrink-0 rounded-full", stageColorDot(stage.color))} />
            <span className="text-muted-foreground">{stage.name}</span>
            <span className="font-medium tabular-nums">{count}</span>
            <span className="text-muted-foreground">
              (%{Math.round((count / orders.length) * 100)})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
