"use client";

import { Eye, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useData } from "@/lib/data";
import { formatFieldValue, orderTitle, summariseItemField } from "@/lib/fields";
import { formatDuration, isOverdue, timeInCurrentStage } from "@/lib/reporting";
import { stageColorDot } from "@/lib/stage-colors";
import type { FieldDefinition, Order } from "@/lib/types";

/**
 * One column per stage, cards dragged between them to move an order. Filters
 * (search / client / date) are applied by the caller — this only splits by
 * stage, which the tabs in table view otherwise do.
 */
export function OrdersKanban({
  orders,
  extraColumns,
  hasItems,
}: {
  orders: Order[];
  extraColumns: FieldDefinition[];
  hasItems: boolean;
}) {
  const { fields, stages, history, settings, can, moveOrderToStage } = useData();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);
  const canMove = can("move_stage");

  async function handleDrop(stageName: string) {
    setOverStage(null);
    const order = orders.find((o) => o.id === draggingId);
    setDraggingId(null);
    if (!order || order.current_stage === stageName || !canMove) return;

    const result = await moveOrderToStage(order.id, stageName);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`${order.order_no} → “${stageName}”.`);
  }

  return (
    <div className="space-y-4">
      {canMove && (
        <p className="text-xs text-muted-foreground">
          Bir kartı sürükleyip başka bir sütuna bırakarak siparişi taşıyın.
        </p>
      )}

      <div className="flex gap-4 overflow-x-auto pb-2">
        {stages.map((stage) => {
          const stageOrders = orders.filter((order) => order.current_stage === stage.name);
          const isOver = overStage === stage.name;

          return (
            <div
              key={stage.id}
              onDragOver={(event) => {
                event.preventDefault();
                if (overStage !== stage.name) setOverStage(stage.name);
              }}
              onDragLeave={() =>
                setOverStage((current) => (current === stage.name ? null : current))
              }
              onDrop={(event) => {
                event.preventDefault();
                handleDrop(stage.name);
              }}
              className={`flex w-72 shrink-0 flex-col rounded-lg border bg-muted/30 transition-colors ${
                isOver ? "border-primary bg-primary/5" : ""
              }`}
            >
              <div className="flex items-center gap-2 border-b px-3 py-2.5">
                <span className={`size-2.5 rounded-full ${stageColorDot(stage.color)}`} />
                <span className="text-sm font-medium">{stage.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{stageOrders.length}</span>
              </div>

              <div className="flex flex-1 flex-col gap-2 p-2">
                {stageOrders.length === 0 ? (
                  <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                    Sipariş yok
                  </p>
                ) : (
                  stageOrders.map((order) => {
                    const overdue = isOverdue(order, history, settings.overdue_threshold_days);

                    return (
                      <div
                        key={order.id}
                        draggable={canMove}
                        onDragStart={() => canMove && setDraggingId(order.id)}
                        onDragEnd={() => {
                          setDraggingId(null);
                          setOverStage(null);
                        }}
                        className={`space-y-1.5 rounded-md border bg-background p-2.5 shadow-sm transition-opacity ${
                          canMove ? "cursor-grab active:cursor-grabbing" : ""
                        } ${draggingId === order.id ? "opacity-40" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="flex items-center gap-1 text-xs font-semibold">
                            {order.order_no}
                            {overdue && (
                              <TriangleAlert className="size-3 text-destructive" aria-label="Gecikmiş" />
                            )}
                          </span>
                          <Button asChild variant="ghost" size="icon" className="-mt-1 -mr-1 size-6">
                            <Link
                              href={`/orders/view?id=${order.id}`}
                              draggable={false}
                              aria-label={`${order.order_no} siparişini aç`}
                            >
                              <Eye className="size-3.5" />
                            </Link>
                          </Button>
                        </div>
                        <p className="line-clamp-1 text-sm font-medium">{orderTitle(order, fields)}</p>
                        {extraColumns.map((field) => {
                          const value =
                            field.scope === "item"
                              ? summariseItemField(order, field)
                              : formatFieldValue(field, order.field_values?.[field.key] ?? null);
                          if (!value || value === "—") return null;
                          return (
                            <p key={field.id} className="line-clamp-1 text-xs text-muted-foreground">
                              {field.label}: {value}
                            </p>
                          );
                        })}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{formatDuration(timeInCurrentStage(order, history))}</span>
                          {hasItems && <span>{order.items?.length ?? 0} kalem</span>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
