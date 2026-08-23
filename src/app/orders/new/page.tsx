"use client";

import { ClipboardList, Copy, Factory, Package, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { FieldInput } from "@/components/field-input";
import { SectionCard } from "@/components/section-card";
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
import { blankValues, itemFields, orderFields, validateValues } from "@/lib/fields";
import { newId } from "@/lib/storage";
import type { FieldValue } from "@/lib/types";

type ItemDraft = {
  id: string;
  values: Record<string, FieldValue>;
};

export default function NewOrderPage() {
  const router = useRouter();
  const {
    loaded,
    fields,
    stages,
    companies,
    companyMatches,
    company,
    actingUser,
    can,
    createOrder,
  } = useData();

  const isMusteri = company?.company_type === "musteri";
  const matchedUreticiler = companies.filter((c) =>
    companyMatches.some((m) => m.musteri_company_id === company?.id && m.uretici_company_id === c.id),
  );

  const [ureticiId, setUreticiId] = useState<string>("");
  const activeUreticiId = isMusteri ? ureticiId : company?.id;

  // For an üretici this is just their own schema; for a müşteri it's the
  // schema belonging to whichever üretici they picked above.
  const effectiveFields = fields.filter((field) => field.company_id === activeUreticiId);
  const effectiveStages = stages
    .filter((stage) => stage.company_id === activeUreticiId)
    .sort((a, b) => a.position - b.position);

  const perOrder = orderFields(effectiveFields);
  const perItem = itemFields(effectiveFields);
  const firstStage = effectiveStages[0]?.name;

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

  function handleUreticiChange(id: string) {
    setUreticiId(id);
    // Field keys differ between üretici, so stale values/errors don't carry over.
    setOrderValues({});
    setOrderErrors({});
    setItems([]);
    setItemErrors({});
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (isMusteri && !ureticiId) {
      toast.error("Sipariş oluşturmak için bir üretici seçin.");
      return;
    }

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

    const result = await createOrder(
      {
        field_values: orderValues,
        items: drafts.map((item) => ({ field_values: item.values })),
      },
      isMusteri ? ureticiId : undefined,
    );

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

  if (loaded && isMusteri && matchedUreticiler.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Yeni sipariş</h1>
        <p className="text-muted-foreground">
          Henüz eşleştirilmiş bir üretici yok — sipariş oluşturmak için platform yöneticisinin
          şirketinizi bir üreticiyle eşleştirmesi gerekir.
        </p>
        <Button asChild variant="outline">
          <Link href="/">Siparişlere dön</Link>
        </Button>
      </div>
    );
  }

  if (loaded && !isMusteri && fields.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Yeni sipariş</h1>
        <p className="text-muted-foreground">
          Henüz hiç sipariş alanı tanımlı değil — siparişin içi boş olurdu.
        </p>
        <Button asChild>
          <Link href="/company?tab=fields">Sipariş alanlarını ayarla</Link>
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
        {isMusteri && (
          <SectionCard
            icon={<Factory className="size-4" />}
            title="Üretici"
            description="Bu sipariş hangi üretici için oluşturuluyor?"
          >
            <div className="grid gap-2 sm:max-w-sm">
              <Label htmlFor="uretici-select">Üretici</Label>
              <Select value={ureticiId} onValueChange={handleUreticiChange}>
                <SelectTrigger id="uretici-select" className="w-full">
                  <SelectValue placeholder="Bir üretici seçin" />
                </SelectTrigger>
                <SelectContent>
                  {matchedUreticiler.map((uretici) => (
                    <SelectItem key={uretici.id} value={uretici.id}>
                      {uretici.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </SectionCard>
        )}

        {perOrder.length > 0 && (
          <SectionCard
            icon={<ClipboardList className="size-4" />}
            title="Sipariş bilgileri"
            description="Sipariş için bir kez doldurulur."
          >
            <div className="grid gap-4 sm:grid-cols-2">
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
            </div>
          </SectionCard>
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
              <SectionCard
                key={item.id}
                icon={<Package className="size-4" />}
                title={`Kalem ${index + 1}`}
                action={
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
                }
              >
                <div className="grid gap-4 sm:grid-cols-2">
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
                </div>
              </SectionCard>
            ))}

            <Button type="button" variant="outline" className="w-full" onClick={() => addItem()}>
              <Plus className="size-4" />
              Başka kalem ekle
            </Button>
          </div>
        ) : (
          !isMusteri && (
            <p className="text-sm text-muted-foreground">
              Bu siparişte kalem yok. Bir siparişe birden fazla kalem koymak için{" "}
              <Link href="/company?tab=fields" className="underline">
                Sipariş alanları
              </Link>{" "}
              ekranından bir alanın kapsamını <span className="font-medium">Kalem</span> yapın.
            </p>
          )
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
