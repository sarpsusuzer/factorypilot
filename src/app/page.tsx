"use client";

import { Eye, Kanban, Layers, List, Search, TriangleAlert, User } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { OrderStatusBar } from "@/components/order-status-bar";
import { OrdersKanban } from "@/components/orders-kanban";
import { StageBadge } from "@/components/stage-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useData } from "@/lib/data";
import {
  formatFieldValue,
  itemFields,
  orderTitle,
  searchableText,
  summariseItemField,
  titleField,
} from "@/lib/fields";
import {
  formatDateTime,
  formatDuration,
  isOverdue,
  timeInCurrentStage,
  withinLastDays,
} from "@/lib/reporting";
import type { Order } from "@/lib/types";
import { cn } from "@/lib/utils";

const ALL = "__all__";
type SortKey = "order_no" | "created_at" | "title";
type View = "table" | "kanban";

export default function OrdersPage() {
  const { loaded, orders, stages, fields, companies, company, history, settings, can } = useData();
  const [view, setView] = useState<View>("table");
  const [stageTab, setStageTab] = useState<string>(ALL);
  const [clientFilter, setClientFilter] = useState<string>(ALL);
  const [dateFilter, setDateFilter] = useState<string>(ALL);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortAsc, setSortAsc] = useState(false);

  const lastStage = stages[stages.length - 1]?.name;
  // A müşteri's own field list is empty — their orders each belong to
  // whichever üretici they picked, so header columns fall back to the
  // acting company's own schema if any, else the first schema in view.
  const ownFields = fields.filter((field) => field.company_id === company?.id);
  const headerFields = ownFields.length > 0 ? ownFields : fields;
  const nameField = titleField(headerFields);
  // After the title, show the next two configured fields as their own columns.
  const extraColumns = headerFields.filter((field) => field.id !== nameField?.id).slice(0, 2);
  const hasItems = itemFields(headerFields).length > 0;
  const showCustomerColumn = orders.some((order) => order.customer_company_id);
  const fieldsForOrder = (order: Order) => fields.filter((field) => field.company_id === order.company_id);

  const titles = useMemo(
    () =>
      [...new Set(orders.map((order) => orderTitle(order, fieldsForOrder(order))))].sort((a, b) =>
        a.localeCompare(b, "tr"),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fields, orders],
  );

  const activeCount = orders.filter((order) => order.current_stage !== lastStage).length;
  const overdueCount = orders.filter((order) =>
    isOverdue(order, history, settings.overdue_threshold_days),
  ).length;

  // Everything except the stage tabs, so the tab counts reflect the other filters.
  const matchingOrders = useMemo(() => {
    const term = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesClient = clientFilter === ALL || orderTitle(order, fieldsForOrder(order)) === clientFilter;
      const matchesDate =
        dateFilter === ALL || withinLastDays(order.created_at, Number(dateFilter));
      const matchesSearch =
        !term ||
        order.order_no.toLowerCase().includes(term) ||
        searchableText(order).includes(term);
      return matchesClient && matchesDate && matchesSearch;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientFilter, dateFilter, fields, orders, search]);

  const visibleOrders = useMemo(() => {
    const filtered = matchingOrders.filter(
      (order) => stageTab === ALL || order.current_stage === stageTab,
    );

    return [...filtered].sort((a, b) => {
      const direction = sortAsc ? 1 : -1;
      if (sortKey === "created_at") {
        return (Date.parse(a.created_at) - Date.parse(b.created_at)) * direction;
      }
      const left = sortKey === "order_no" ? a.order_no : orderTitle(a, fieldsForOrder(a));
      const right = sortKey === "order_no" ? b.order_no : orderTitle(b, fieldsForOrder(b));
      return left.localeCompare(right, "tr", { numeric: true }) * direction;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields, matchingOrders, sortAsc, sortKey, stageTab]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortAsc((current) => !current);
    } else {
      setSortKey(key);
      setSortAsc(key !== "created_at");
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Siparişler</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-full border p-0.5">
            <ViewButton
              active={view === "table"}
              onClick={() => setView("table")}
              icon={<List className="size-4" />}
              label="Tablo"
            />
            <ViewButton
              active={view === "kanban"}
              onClick={() => setView("kanban")}
              icon={<Kanban className="size-4" />}
              label="Kanban"
            />
          </div>
          {can("create_order") && (
            <Button asChild>
              <Link href="/orders/new">Yeni sipariş</Link>
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatBlock label="Toplam sipariş" value={orders.length} caption="Tüm zamanlar" />
            <StatBlock
              label="Aktif sipariş"
              value={activeCount}
              caption={lastStage ? `Henüz “${lastStage}” değil` : "—"}
            />
            <StatBlock
              label="Geciken"
              value={overdueCount}
              caption={`Bir aşamada ${settings.overdue_threshold_days} günden fazla`}
            />
          </div>

          <div className="space-y-3 border-t pt-6">
            <div>
              <p className="text-sm font-medium">Sipariş durumları</p>
              <p className="text-sm text-muted-foreground">Tüm siparişlerin aşamalara göre dağılımı.</p>
            </div>
            <OrderStatusBar orders={orders} stages={stages} />
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        {/* The kanban columns already split by stage, so the tabs would be redundant. */}
        {view === "table" && (
          <Tabs value={stageTab} onValueChange={setStageTab}>
            <TabsList variant="line" className="h-auto w-full justify-start gap-4 overflow-x-auto border-b pb-2">
              <StageTab value={ALL} label="Tümü" count={matchingOrders.length} />
              {stages.map((stage) => (
                <StageTab
                  key={stage.id}
                  value={stage.name}
                  label={stage.name}
                  count={matchingOrders.filter((order) => order.current_stage === stage.name).length}
                />
              ))}
            </TabsList>
          </Tabs>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-64 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Sipariş no veya herhangi bir alan…"
              className="rounded-full pl-9"
              aria-label="Siparişlerde ara"
            />
          </div>

          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger
              className="w-auto min-w-40 rounded-full"
              aria-label={`${nameField?.label ?? "Sipariş"} ile filtrele`}
            >
              <User className="size-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tümü</SelectItem>
              {titles.map((title) => (
                <SelectItem key={title} value={title}>
                  {title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-auto min-w-36 rounded-full" aria-label="Tarihe göre filtrele">
              <Layers className="size-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tüm tarihler</SelectItem>
              <SelectItem value="7">Son 7 gün</SelectItem>
              <SelectItem value="30">Son 30 gün</SelectItem>
              <SelectItem value="90">Son 90 gün</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {view === "kanban" && (
        <OrdersKanban orders={matchingOrders} extraColumns={extraColumns} hasItems={hasItems} />
      )}

      {view === "table" && (
      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow className="text-xs tracking-wide text-muted-foreground uppercase">
              <SortableHead
                label="Sipariş no"
                active={sortKey === "order_no"}
                ascending={sortAsc}
                onClick={() => toggleSort("order_no")}
              />
              <SortableHead
                label="Tarih"
                active={sortKey === "created_at"}
                ascending={sortAsc}
                onClick={() => toggleSort("created_at")}
              />
              <SortableHead
                label={nameField?.label ?? "Sipariş"}
                active={sortKey === "title"}
                ascending={sortAsc}
                onClick={() => toggleSort("title")}
              />
              {extraColumns.map((field) => (
                <TableHead key={field.id} className="uppercase">
                  {field.label}
                </TableHead>
              ))}
              {showCustomerColumn && <TableHead className="uppercase">Müşteri</TableHead>}
              {hasItems && <TableHead className="uppercase">Kalem</TableHead>}
              <TableHead className="uppercase">Aşamada</TableHead>
              <TableHead className="uppercase">Durum</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loaded ? (
              <TableRow>
                <TableCell colSpan={5 + extraColumns.length + (hasItems ? 1 : 0) + (showCustomerColumn ? 1 : 0)} className="py-12 text-center text-muted-foreground">
                  Yükleniyor…
                </TableCell>
              </TableRow>
            ) : visibleOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5 + extraColumns.length + (hasItems ? 1 : 0) + (showCustomerColumn ? 1 : 0)} className="py-12 text-center text-muted-foreground">
                  {orders.length === 0
                    ? "Henüz sipariş yok — ilk siparişi oluşturun."
                    : "Bu filtrelere uyan sipariş yok."}
                </TableCell>
              </TableRow>
            ) : (
              visibleOrders.map((order) => {
                const overdue = isOverdue(order, history, settings.overdue_threshold_days);
                const orderScopedFields = fieldsForOrder(order);
                const customerName = order.customer_company_id
                  ? (companies.find((c) => c.id === order.customer_company_id)?.name ?? "—")
                  : "—";

                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-semibold">
                      <span className="flex items-center gap-1.5">
                        {order.order_no}
                        {overdue && (
                          <TriangleAlert
                            className="size-3.5 text-destructive"
                            aria-label={`Gecikmiş — ${order.current_stage} aşamasında ${settings.overdue_threshold_days} günden fazla`}
                          />
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDateTime(order.created_at)}
                    </TableCell>
                    <TableCell className="font-medium">{orderTitle(order, orderScopedFields)}</TableCell>
                    {extraColumns.map((field) => (
                      <TableCell key={field.id} className="max-w-64">
                        <span className="line-clamp-1 text-muted-foreground">
                          {field.scope === "item"
                            ? // Item fields show the distinct values across the order's items.
                              summariseItemField(order, field) || "—"
                            : formatFieldValue(field, order.field_values?.[field.key] ?? null)}
                        </span>
                      </TableCell>
                    ))}
                    {showCustomerColumn && (
                      <TableCell className="text-muted-foreground">{customerName}</TableCell>
                    )}
                    {hasItems && (
                      <TableCell className="text-muted-foreground">
                        {order.items?.length ?? 0}
                      </TableCell>
                    )}
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDuration(timeInCurrentStage(order, history))}
                    </TableCell>
                    <TableCell>
                      <StageBadge stage={order.current_stage} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="icon" className="rounded-full">
                        <Link href={`/orders/view?id=${order.id}`} aria-label={`${order.order_no} siparişini aç`}>
                          <Eye className="size-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      )}
    </div>
  );
}

function ViewButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors",
        active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function StatBlock({ label, value, caption }: { label: string; value: number; caption: string }) {
  return (
    <div className="space-y-1">
      <CardDescription className="text-xs tracking-widest uppercase">{label}</CardDescription>
      <CardTitle className="text-4xl font-semibold">{value}</CardTitle>
      <p className="text-sm text-muted-foreground">{caption}</p>
    </div>
  );
}

function StageTab({ value, label, count }: { value: string; label: string; count: number }) {
  return (
    <TabsTrigger value={value} className="flex-none gap-2 px-1 text-sm">
      {label}
      <span className="text-muted-foreground">{count}</span>
    </TabsTrigger>
  );
}

function SortableHead({
  label,
  active,
  ascending,
  onClick,
}: {
  label: string;
  active: boolean;
  ascending: boolean;
  onClick: () => void;
}) {
  return (
    <TableHead className="uppercase">
      <button type="button" onClick={onClick} className="uppercase">
        {label}
        {active && <span className="ml-1">{ascending ? "↑" : "↓"}</span>}
      </button>
    </TableHead>
  );
}
