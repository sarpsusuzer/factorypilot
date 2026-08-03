"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FieldFileList } from "@/components/field-file-list";
import { StageBadge } from "@/components/stage-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const {
    loaded,
    stages,
    fields,
    history,
    settings,
    users,
    can,
    getOrder,
    historyForOrder,
    moveOrderToStage,
    deleteOrder,
  } = useData();

  const order = getOrder(params.id);
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

  const title = orderTitle(order, fields);
  const perOrder = orderFields(fields);
  const perItem = itemFields(fields);
  const items = order.items ?? [];
  const entries = historyForOrder(order.id);
  // Values kept from a previous field configuration, so nothing silently vanishes.
  const orphanValues = Object.entries(order.field_values ?? {}).filter(
    ([key, value]) => !perOrder.some((field) => field.key === key) && !isEmptyValue(value),
  );
  const overdue = isOverdue(order, history, settings.overdue_threshold_days);

  function handleMove() {
    if (!order) return;
    if (!targetStage) {
      toast.error("Siparişin taşınacağı aşamayı seçin.");
      return;
    }

    const result = moveOrderToStage(order.id, targetStage);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(`“${targetStage}” aşamasına taşındı.`);
    setTargetStage("");
  }

  function handleDelete() {
    if (!order) return;
    deleteOrder(order.id);
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
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sipariş bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {/* One row per order-level field, in the configured order. */}
              {perOrder.map((field) => (
                <div key={field.id} className="space-y-4">
                  <Field label={field.label}>
                    {field.type === "file" ? (
                      <FieldFileList files={asStoredFiles(order.field_values?.[field.key] ?? null)} />
                    ) : (
                      <span className="whitespace-pre-wrap">
                        {formatFieldValue(field, order.field_values?.[field.key] ?? null)}
                      </span>
                    )}
                  </Field>
                  <Separator />
                </div>
              ))}
              {orphanValues.map(([key, value]) => (
                <div key={key} className="space-y-4">
                  <Field label={`${key} (artık tanımlı değil)`}>
                    <span className="whitespace-pre-wrap">
                      {formatFieldValue(undefined, value)}
                    </span>
                  </Field>
                  <Separator />
                </div>
              ))}
              <Field label="Mevcut aşama">{order.current_stage}</Field>
              <Separator />
              <Field label="Bu aşamaya giriş">
                {formatDateTime(stageEnteredAt(order, history))}
              </Field>
              <Separator />
              <Field label="Oluşturulma">{formatDateTime(order.created_at)}</Field>
              <Separator />
              <Field label="Oluşturan">{order.created_by ? userName(users, order.created_by) : "—"}</Field>
            </CardContent>
          </Card>

          {perItem.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Kalemler</CardTitle>
                <CardDescription>
                  Bu siparişte {items.length} kalem var.
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                          className="rounded-md border px-3 last:border-b"
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
                          <AccordionContent className="space-y-3 pb-4 text-sm">
                            {perItem.map((field) => (
                              <div key={field.id} className="grid gap-1">
                                <span className="text-xs tracking-wide text-muted-foreground uppercase">
                                  {field.label}
                                </span>
                                {field.type === "file" ? (
                                  <FieldFileList
                                    files={asStoredFiles(item.field_values?.[field.key] ?? null)}
                                  />
                                ) : (
                                  <span className="whitespace-pre-wrap">
                                    {formatFieldValue(field, item.field_values?.[field.key] ?? null)}
                                  </span>
                                )}
                              </div>
                            ))}
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          )}

          {can("move_stage") && (
            <Card>
              <CardHeader>
                <CardTitle>Aşama değiştir</CardTitle>
                <CardDescription>
                  Her aşamaya geçilebilir — önceki bir aşamaya geri almak dahil.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="target-stage">Şu aşamaya taşı</Label>
                  <Select value={targetStage} onValueChange={setTargetStage}>
                    <SelectTrigger id="target-stage" className="w-full">
                      <SelectValue placeholder="Bir aşama seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((stage) => (
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
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Aşama geçmişi</CardTitle>
            <CardDescription>Her aşama değişikliğinde otomatik kaydedilir.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {entries.map((entry) => (
                <li key={entry.id} className="border-l-2 pl-4 text-sm">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span>{children}</span>
    </div>
  );
}
