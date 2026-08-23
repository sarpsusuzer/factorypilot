"use client";

import { ArrowRightLeft, ClipboardList, History, Package } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FieldFileList } from "@/components/field-file-list";
import { SectionCard } from "@/components/section-card";
import { StageBadge } from "@/components/stage-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useData } from "@/lib/data";
import {
  asStoredFiles,
  formatFieldValue,
  isEmptyValue,
  itemFields,
  itemTitle,
  orderFields,
  orderTitle,
} from "@/lib/fields";
import { userName } from "@/lib/permissions";
import {
  formatDateTime,
  formatDuration,
  isOverdue,
  stageEnteredAt,
  timeInCurrentStage,
} from "@/lib/reporting";

// A dynamic [id] route can't be statically exported (order ids don't exist
// until someone creates them in the browser) — so this reads the id from a
// query param instead, which keeps routing entirely client-side.
export default function OrderDetailPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Yükleniyor…</p>}>
      <OrderDetail />
    </Suspense>
  );
}

function OrderDetail() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const router = useRouter();
  const {
    loaded,
    stages,
    fields,
    companies,
    company,
    history,
    settings,
    users,
    getOrder,
    historyForOrder,
    moveOrderToStage,
    deleteOrder,
  } = useData();

  const order = getOrder(id);
  const [targetStage, setTargetStage] = useState<string>("");

  if (!loaded) {
    return <p className="text-muted-foreground">Yükleniyor…</p>;
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Sipariş bulunamadı</h1>
        <p className="text-muted-foreground">Bu sipariş silinmiş olabilir.</p>
        <Button asChild variant="outline">
          <Link href="/">Siparişlere dön</Link>
        </Button>
      </div>
    );
  }

  // A müşteri's own field/stage list is empty — orders they submitted belong
  // to whichever üretici they picked, so always look fields/stages up by the
  // order's own company_id rather than assuming it matches the viewer's.
  const orderFieldsList = fields.filter((field) => field.company_id === order.company_id);
  const orderStages = stages
    .filter((stage) => stage.company_id === order.company_id)
    .sort((a, b) => a.position - b.position);
  const customerCompany = order.customer_company_id
    ? companies.find((c) => c.id === order.customer_company_id)
    : undefined;
  const canMoveStage = order.company_id === company?.id;

  const title = orderTitle(order, orderFieldsList);
  const perOrder = orderFields(orderFieldsList);
  const perItem = itemFields(orderFieldsList);
  const items = order.items ?? [];
  const entries = historyForOrder(order.id);
  // Values kept from a previous field configuration, so nothing silently vanishes.
  const orphanValues = Object.entries(order.field_values ?? {}).filter(
    ([key, value]) => !perOrder.some((field) => field.key === key) && !isEmptyValue(value),
  );
  const overdue = isOverdue(order, history, settings.overdue_threshold_days);

  async function handleMove() {
    if (!order) return;
    if (!targetStage) {
      toast.error("Siparişin taşınacağı aşamayı seçin.");
      return;
    }

    const result = await moveOrderToStage(order.id, targetStage);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(`“${targetStage}” aşamasına taşındı.`);
    setTargetStage("");
  }

  async function handleDelete() {
    if (!order) return;
    const result = await deleteOrder(order.id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Sipariş silindi.");
    router.push("/");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <Link href="/" className="text-sm text-muted-foreground hover:underline">
            ← Tüm siparişler
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            <span className="text-muted-foreground">{order.order_no}</span>
            {/* The title falls back to the order number, so don't print it twice. */}
            {title !== order.order_no && ` ${title}`}
          </h1>
          <div className="flex items-center gap-2">
            <StageBadge stage={order.current_stage} />
            {overdue && <Badge variant="destructive">Gecikmiş</Badge>}
            <span className="text-sm text-muted-foreground">
              bu aşamada {formatDuration(timeInCurrentStage(order, history))}
            </span>
          </div>
        </div>
        <Button variant="outline" onClick={handleDelete}>
          Siparişi sil
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-3">
          <SectionCard icon={<ClipboardList className="size-4" />} title="Sipariş bilgileri">
            <div className="space-y-2 text-sm">
              {/* One row per order-level field, in the configured order. */}
              {perOrder.map((field) => (
                <Field key={field.id} label={field.label}>
                  {field.type === "file" ? (
                    <FieldFileList files={asStoredFiles(order.field_values?.[field.key] ?? null)} />
                  ) : (
                    <span className="whitespace-pre-wrap">
                      {formatFieldValue(field, order.field_values?.[field.key] ?? null)}
                    </span>
                  )}
                </Field>
              ))}
              {orphanValues.map(([key, value]) => (
                <Field key={key} label={`${key} (artık tanımlı değil)`}>
                  <span className="whitespace-pre-wrap">{formatFieldValue(undefined, value)}</span>
                </Field>
              ))}
              <Field label="Mevcut aşama">{order.current_stage}</Field>
              <Field label="Bu aşamaya giriş">
                {formatDateTime(stageEnteredAt(order, history))}
              </Field>
              <Field label="Oluşturulma">{formatDateTime(order.created_at)}</Field>
              <Field label="Oluşturan">{order.created_by ? userName(users, order.created_by) : "—"}</Field>
              {customerCompany && <Field label="Müşteri">{customerCompany.name}</Field>}
            </div>
          </SectionCard>

          {perItem.length > 0 && (
            <SectionCard
              icon={<Package className="size-4" />}
              title="Kalemler"
              description={`Bu siparişte ${items.length} kalem var.`}
            >
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Bu sipariş, kalem özelliği eklenmeden önce oluşturulmuş.
                </p>
              ) : (
                <Accordion type="multiple" className="space-y-2">
                  {items.map((item, index) => {
                    const fileCount = perItem
                      .filter((field) => field.type === "file")
                      .reduce(
                        (sum, field) => sum + asStoredFiles(item.field_values?.[field.key] ?? null).length,
                        0,
                      );

                    return (
                      <AccordionItem
                        key={item.id}
                        value={item.id}
                        className="rounded-md border border-border bg-background px-3 last:border-b"
                      >
                        <AccordionTrigger className="py-3 hover:no-underline">
                          <span className="flex flex-1 items-center gap-2 text-left text-sm">
                            <span className="text-muted-foreground">#{index + 1}</span>
                            <span className="font-medium">{itemTitle(item, perItem, index)}</span>
                            {fileCount > 0 && (
                              <span className="ml-auto mr-2 text-xs text-muted-foreground">
                                {fileCount} dosya
                              </span>
                            )}
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2 pb-3 text-sm">
                          {perItem.map((field) => (
                            <Field key={field.id} label={field.label}>
                              {field.type === "file" ? (
                                <FieldFileList
                                  files={asStoredFiles(item.field_values?.[field.key] ?? null)}
                                />
                              ) : (
                                <span className="whitespace-pre-wrap">
                                  {formatFieldValue(field, item.field_values?.[field.key] ?? null)}
                                </span>
                              )}
                            </Field>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              )}
            </SectionCard>
          )}

          {canMoveStage && (
            <SectionCard
              icon={<ArrowRightLeft className="size-4" />}
              title="Aşama değiştir"
              description="Her aşamaya geçilebilir — önceki bir aşamaya geri almak dahil."
            >
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="target-stage">Şu aşamaya taşı</Label>
                  <Select value={targetStage} onValueChange={setTargetStage}>
                    <SelectTrigger id="target-stage" className="w-full">
                      <SelectValue placeholder="Bir aşama seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {orderStages.map((stage) => (
                        <SelectItem
                          key={stage.id}
                          value={stage.name}
                          disabled={stage.name === order.current_stage}
                        >
                          {stage.name}
                          {stage.name === order.current_stage ? " (mevcut)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleMove}>Siparişi taşı</Button>
              </div>
            </SectionCard>
          )}
        </div>

        <SectionCard
          icon={<History className="size-4" />}
          title="Aşama geçmişi"
          description="Her aşama değişikliğinde otomatik kaydedilir."
        >
          <ol className="space-y-4">
            {entries.map((entry) => (
              <li key={entry.id} className="border-l-2 border-border pl-4 text-sm">
                <p className="font-medium">
                  {entry.from_stage
                    ? `${entry.from_stage} → ${entry.to_stage}`
                    : `${entry.to_stage} aşamasında oluşturuldu`}
                </p>
                <p className="text-muted-foreground">
                  {entry.changed_by ? userName(users, entry.changed_by) : "Bilinmiyor"} ·{" "}
                  {formatDateTime(entry.changed_at)}
                </p>
              </li>
            ))}
          </ol>
        </SectionCard>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md bg-background px-3 py-2">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="mt-0.5 text-foreground">{children}</div>
    </div>
  );
}
