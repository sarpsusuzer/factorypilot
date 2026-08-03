"use client";

import { Copy, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { FieldInput } from "@/components/field-input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useData } from "@/lib/data";
import { blankValues, itemFields, orderFields, validateValues } from "@/lib/fields";
import { newId } from "@/lib/storage";
import type { FieldValue } from "@/lib/types";

type ItemDraft = {
  id: string;
  values: Record<string, FieldValue>;
};

export default function NewOrderPage() {
  const router = useRouter();
  const { loaded, fields, stages, actingUser, can, createOrder } = useData();

  const perOrder = orderFields(fields);
  const perItem = itemFields(fields);
  const firstStage = stages[0]?.name;

  const [orderValues, setOrderValues] = useState<Record<string, FieldValue>>({});
  const [items, setItems] = useState<ItemDraft[]>([]);
  const [orderErrors, setOrderErrors] = useState<Record<string, string>>({});
  const [itemErrors, setItemErrors] = useState<Record<string, Record<string, string>>>({});

  // Values start blank; `??` keeps this working while the fields load in.
  const valueFor = (key: string) => orderValues[key] ?? null;
  // The form always offers one item to fill in, even before anything is added.
  const drafts = items.length > 0 || perItem.length === 0 ? items : [{ id: "first", values: {} }];

  function setOrderValue(key: string, value: FieldValue) {
    setOrderValues((current) => ({ ...current, [key]: value }));
    setOrderErrors((current) => withoutKey(current, key));
  }

  function setItemValue(itemId: string, key: string, value: FieldValue) {
    setItems(
      drafts.map((item) =>
        item.id === itemId ? { ...item, values: { ...item.values, [key]: value } } : item,
      ),
    );
    setItemErrors((current) => ({ ...current, [itemId]: withoutKey(current[itemId] ?? {}, key) }));
  }

  function addItem(copyFrom?: ItemDraft) {
    setItems([
      ...drafts,
      { id: newId(), values: copyFrom ? { ...copyFrom.values } : blankValues(perItem) },
    ]);
  }

  function removeItem(itemId: string) {
    setItems(drafts.filter((item) => item.id !== itemId));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const foundOrder = validateValues(perOrder, orderValues);
    const foundItems: Record<string, Record<string, string>> = {};
    for (const item of drafts) {
      const errors = validateValues(perItem, item.values);
      if (Object.keys(errors).length > 0) foundItems[item.id] = errors;
    }

    setOrderErrors(foundOrder);
    setItemErrors(foundItems);

    if (Object.keys(foundOrder).length || Object.keys(foundItems).length) {
      toast.error("Zorunlu alanları doldurun.");
      return;
    }

    const result = createOrder({
      field_values: orderValues,
      items: drafts.map((item) => ({ field_values: item.values })),
    });

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(`Sipariş “${firstStage}” aşamasında oluşturuldu.`);
    router.push("/");
  }

  if (loaded && !can("create_order")) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Yeni sipariş</h1>
        <p className="text-muted-foreground">Bu ekrana erişim yetkiniz yok.</p>
        <Button asChild variant="outline">
          <Link href="/">Siparişlere dön</Link>
        </Button>
      </div>
    );
  }

  if (loaded && fields.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Yeni sipariş</h1>
        <p className="text-muted-foreground">
          Henüz hiç sipariş alanı tanımlı değil — siparişin içi boş olurdu.
        </p>
        <Button asChild>
          <Link href="/fields">Sipariş alanlarını ayarla</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <Link href="/" className="text-sm text-muted-foreground hover:underline">
            ← Tüm siparişler
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Yeni sipariş</h1>
          <p className="text-sm text-muted-foreground">
            {firstStage
              ? `Listenizdeki ilk aşama olan “${firstStage}” ile başlar. Oluşturan: ${actingUser?.name ?? "—"}.`
              : "Önce bir aşama ekleyin — siparişin başlayacağı bir yer gerekli."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.push("/")}>
            Vazgeç
          </Button>
          <Button type="submit" disabled={!firstStage}>
            Siparişi oluştur
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {perOrder.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Sipariş bilgileri</CardTitle>
              <CardDescription>Sipariş için bir kez doldurulur.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {perOrder.map((field) => (
                <div
                  key={field.id}
                  className={field.type === "textarea" ? "sm:col-span-2" : undefined}
                >
                  <FieldInput
                    field={field}
                    value={valueFor(field.key)}
                    onChange={(value) => setOrderValue(field.key, value)}
                    error={orderErrors[field.key]}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {perItem.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Kalemler</h2>
                <p className="text-sm text-muted-foreground">
                  Bu siparişte {drafts.length} kalem var.
                </p>
              </div>
              <Button type="button" variant="outline" onClick={() => addItem()}>
                <Plus className="size-4" />
                Kalem ekle
              </Button>
            </div>

            {drafts.map((item, index) => (
              <Card key={item.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Kalem {index + 1}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addItem(item)}
                      title="Bu kalemi kopyala"
                    >
                      <Copy className="size-4" />
                      Kopyala
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      disabled={drafts.length === 1}
                      title="Bu kalemi sil"
                    >
                      <Trash2 className="size-4" />
                      Sil
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  {perItem.map((field) => (
                    <div
                      key={field.id}
                      className={field.type === "textarea" ? "sm:col-span-2" : undefined}
                    >
                      <FieldInput
                        field={field}
                        value={item.values[field.key] ?? null}
                        onChange={(value) => setItemValue(item.id, field.key, value)}
                        error={itemErrors[item.id]?.[field.key]}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}

            <Button type="button" variant="outline" className="w-full" onClick={() => addItem()}>
              <Plus className="size-4" />
              Başka kalem ekle
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Bu siparişte kalem yok. Bir siparişe birden fazla kalem koymak için{" "}
            <Link href="/fields" className="underline">
              Sipariş alanları
            </Link>{" "}
            ekranından bir alanın kapsamını <span className="font-medium">Kalem</span> yapın.
          </p>
        )}
      </div>
    </form>
  );
}

/** Drops one message from an error map, leaving it alone if it isn't there. */
function withoutKey(errors: Record<string, string>, key: string) {
  if (!errors[key]) return errors;
  const next = { ...errors };
  delete next[key];
  return next;
}
