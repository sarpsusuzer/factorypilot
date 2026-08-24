"use client";

import { ChevronLeft, ChevronRight, Eye, GripVertical, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useData } from "@/lib/data";
import { formatFieldValue, orderTitle, summariseItemField } from "@/lib/fields";
import { formatDuration, isOverdue, timeInCurrentStage } from "@/lib/reporting";
import { dedupeStagesByName, stageColorDot } from "@/lib/stage-colors";
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
  const { fields, stages: rawStages, companies, company, history, settings, moveOrderToStage } =
    useData();
  // A matched müşteri also sees the üretici's stages — collapse same-named
  // rows so a shared stage name doesn't get its own duplicate column.
  const stages = useMemo(() => dedupeStagesByName(rawStages), [rawStages]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);
  const [collapsedStages, setCollapsedStages] = useState<Set<string>>(new Set());

  function toggleCollapsed(stageId: string) {
    setCollapsedStages((current) => {
      const next = new Set(current);
      if (next.has(stageId)) next.delete(stageId);
      else next.add(stageId);
      return next;
    });
  }

  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollShadow, setScrollShadow] = useState({ left: false, right: false });

  const updateScrollShadow = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setScrollShadow({
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
  }, []);

  // Column count changes as orders move between stages, and columns
  // collapse/expand, both of which can add or remove overflow without the
  // window ever resizing.
  useEffect(() => {
    updateScrollShadow();
    window.addEventListener("resize", updateScrollShadow);
    return () => window.removeEventListener("resize", updateScrollShadow);
  }, [updateScrollShadow, stages.length, orders.length, collapsedStages]);

  const fieldsForOrder = (order: Order) => fields.filter((field) => field.company_id === order.company_id);
  // A müşteri only ever moves their own company's orders — never one they're
  // just viewing as the customer of a matched üretici. Ownership alone is
  // the gate: everyone who can see an order already belongs to the company
  // that owns it, so no separate permission is needed on top.
  const canMoveOrder = (order: Order) => order.company_id === company?.id;

  async function handleDrop(stageName: string) {
    setOverStage(null);
    const order = orders.find((o) => o.id === draggingId);
    setDraggingId(null);
    if (!order || order.current_stage === stageName || !canMoveOrder(order)) return;

    const result = await moveOrderToStage(order.id, stageName);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`${order.order_no} → “${stageName}”.`);
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={updateScrollShadow}
          className="no-scrollbar flex gap-4 overflow-x-auto pb-2"
        >
          {stages.map((stage) => {
            const stageOrders = orders.filter((order) => order.current_stage === stage.name);
            const isOver = overStage === stage.name;
            const isCollapsed = collapsedStages.has(stage.id);

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
                className={`flex shrink-0 flex-col overflow-hidden rounded-lg bg-muted transition-[width,background-color] duration-200 ${
                  isCollapsed ? "w-12" : "w-72"
                } ${isOver ? "bg-secondary shadow-[inset_0_0_0_1px_var(--primary)]" : ""}`}
              >
                {isCollapsed ? (
                  <button
                    type="button"
                    onClick={() => toggleCollapsed(stage.id)}
                    className="flex flex-1 flex-col items-center gap-2 py-3 text-muted-foreground hover:text-foreground"
                    aria-label={`${stage.name} sütununu genişlet`}
                    title={`${stage.name} (${stageOrders.length})`}
                  >
                    <ChevronRight className="size-3.5 shrink-0" />
                    <span className={`size-2.5 shrink-0 rounded-full ${stageColorDot(stage.color)}`} />
                    <span className="text-xs font-medium">{stageOrders.length}</span>
                    <span className="[writing-mode:vertical-rl] rotate-180 text-sm font-medium whitespace-nowrap text-foreground">
                      {stage.name}
                    </span>
                  </button>
                ) : (
                  <>
                    <div className="flex items-center gap-2 px-3 py-2.5 shadow-[inset_0_-1px_0_var(--border)]">
                      <span className={`size-2.5 shrink-0 rounded-full ${stageColorDot(stage.color)}`} />
                      <span className="truncate text-sm font-medium">{stage.name}</span>
                      <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                        {stageOrders.length}
                        <button
                          type="button"
                          onClick={() => toggleCollapsed(stage.id)}
                          className="rounded p-0.5 hover:bg-muted hover:text-foreground"
                          aria-label={`${stage.name} sütununu daralt`}
                        >
                          <ChevronLeft className="size-3.5" />
                        </button>
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col gap-2 p-2">
                      {stageOrders.length === 0 ? (
                        <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                          Sipariş yok
                        </p>
                      ) : (
                        stageOrders.map((order) => {
                          const overdue = isOverdue(order, history, settings.overdue_threshold_days);
                          const cardCanMove = canMoveOrder(order);
                          const customerName = order.customer_company_id
                            ? companies.find((c) => c.id === order.customer_company_id)?.name
                            : undefined;

                          return (
                            <div
                              key={order.id}
                              draggable={cardCanMove}
                              onDragStart={(event) => {
                                if (!cardCanMove) return;
                                setDraggingId(order.id);
                                event.dataTransfer.effectAllowed = "move";
                              }}
                              onDragEnd={() => {
                                setDraggingId(null);
                                setOverStage(null);
                              }}
                              title={cardCanMove ? undefined : "Başka bir şirketin siparişi — taşınamaz"}
                              className={`space-y-1.5 rounded-md border border-border bg-card p-2.5 transition-colors select-none hover:border-ring/40 ${
                                cardCanMove ? "cursor-grab active:cursor-grabbing" : ""
                              } ${draggingId === order.id ? "opacity-40" : ""}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="flex items-center gap-1 text-xs font-semibold">
                                  {cardCanMove && (
                                    <GripVertical
                                      className="-ml-1 size-3.5 shrink-0 text-muted-foreground"
                                      aria-hidden
                                    />
                                  )}
                                  {order.order_no}
                                  {overdue && (
                                    <TriangleAlert className="size-3 text-destructive" aria-label="Gecikmiş" />
                                  )}
                                </span>
                                <Button asChild variant="ghost" size="icon-sm" className="-mt-1 -mr-1">
                                  <Link
                                    href={`/orders/view?id=${order.id}`}
                                    draggable={false}
                                    aria-label={`${order.order_no} siparişini aç`}
                                  >
                                    <Eye className="size-3.5" />
                                  </Link>
                                </Button>
                              </div>
                              <p className="line-clamp-1 text-sm font-medium">
                                {orderTitle(order, fieldsForOrder(order))}
                              </p>
                              {customerName && (
                                <p className="line-clamp-1 text-xs text-muted-foreground">
                                  Müşteri: {customerName}
                                </p>
                              )}
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
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div
          aria-hidden
          className={`pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent transition-opacity duration-200 ${
            scrollShadow.left ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent transition-opacity duration-200 ${
            scrollShadow.right ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>
    </div>
  );
}
