"use client";

import { Check, ChevronDown, Eye, Kanban, Layers, List, Search, TriangleAlert, User } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { OrderStatusBar } from "@/components/order-status-bar";
import { OrdersKanban } from "@/components/orders-kanban";
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
  formatShortDate,
  isOverdue,
  timeInCurrentStage,
  withinDateRange,
  withinLastDays,
} from "@/lib/reporting";
import { dedupeStagesByName } from "@/lib/stage-colors";
import type { Order } from "@/lib/types";
import { cn } from "@/lib/utils";

const ALL = "__all__";
const CUSTOM = "__custom__";
const DATE_PRESETS = [
  { value: ALL, label: "Tüm tarihler" },
  { value: "7", label: "Son 7 gün" },
  { value: "30", label: "Son 30 gün" },
  { value: "90", label: "Son 90 gün" },
];
type SortKey = "order_no" | "created_at" | "title";
type View = "table" | "kanban";

function dateFilterLabel(dateFilter: string, customStart: string, customEnd: string) {
  const preset = DATE_PRESETS.find((option) => option.value === dateFilter);
  if (preset) return preset.label;
  // Date inputs give a bare yyyy-mm-dd — parse as local midnight, not UTC,
  // so the label doesn't roll back a day west of UTC.
  const short = (date: string) => formatShortDate(`${date}T00:00:00`);
  if (customStart && customEnd) return `${short(customStart)} – ${short(customEnd)}`;
  if (customStart) return `${short(customStart)}’den beri`;
  if (customEnd) return `${short(customEnd)}’e kadar`;
  return "Özel aralık";
}

export default function OrdersPage() {
  const { loaded, orders, stages: rawStages, fields, companies, company, history, settings, can } =
    useData();
  const [view, setView] = useState<View>("table");
  const [stageTab, setStageTab] = useState<string>(ALL);
  const [clientFilter, setClientFilter] = useState<string>(ALL);
  const [dateFilter, setDateFilter] = useState<string>(ALL);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortAsc, setSortAsc] = useState(false);

  // A matched müşteri also sees the üretici's stages (needed elsewhere to
  // build the create-order form); collapse same-named rows so the tabs,
  // kanban columns, and status bar don't show every stage twice.
  const stages = useMemo(() => dedupeStagesByName(rawStages), [rawStages]);
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
        dateFilter === ALL ||
        (dateFilter === CUSTOM
          ? withinDateRange(order.created_at, customStart, customEnd)
          : withinLastDays(order.created_at, Number(dateFilter)));
      const matchesSearch =
        !term ||
        order.order_no.toLowerCase().includes(term) ||
        searchableText(order).includes(term);
      return matchesClient && matchesDate && matchesSearch;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientFilter, dateFilter, customStart, customEnd, fields, orders, search]);

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
        {can("create_order") && company?.company_type === "musteri" && (
          <Button asChild>
            <Link href="/orders/new">Yeni sipariş</Link>
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Toplam sipariş" value={orders.length} caption="Tüm zamanlar" />
        <StatCard
          label="Aktif sipariş"
          value={activeCount}
          caption={lastStage ? `Henüz “${lastStage}” değil` : "—"}
        />
        <StatCard
          label="Geciken"
          value={overdueCount}
          caption={`Bir aşamada ${settings.overdue_threshold_days} günden fazla`}
        />
      </div>

      <SectionCard
        title="Sipariş durumları"
        className="bg-background p-1.5"
        titleClassName="text-[13px] font-normal text-muted-foreground"
        contentFramed={false}
      >
        <OrderStatusBar orders={orders} stages={stages} />
      </SectionCard>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-64 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Sipariş no veya herhangi bir alan…"
              className="pl-9"
              aria-label="Siparişlerde ara"
            />
          </div>

          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger
              className="w-auto min-w-40"
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-auto min-w-36 justify-between border-input bg-background font-normal"
                aria-label="Tarihe göre filtrele"
              >
                <span className="flex items-center gap-1.5">
                  <Layers className="size-4 text-muted-foreground" />
                  {dateFilterLabel(dateFilter, customStart, customEnd)}
                </span>
                <ChevronDown className="size-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
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

          <div className="flex items-center rounded-md bg-secondary p-0.5">
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
        </div>

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
      </section>

      {view === "kanban" && (
        <OrdersKanban orders={matchingOrders} extraColumns={extraColumns} hasItems={hasItems} />
      )}

      {view === "table" && (
      <div className="rounded-xl border border-border bg-background">
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
                      <Button asChild variant="outline" size="icon-sm" className="rounded-full">
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
        "flex items-center gap-1.5 rounded-[7px] px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border border-border bg-background text-foreground"
          : "border border-transparent text-muted-foreground hover:bg-white/70 hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
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
