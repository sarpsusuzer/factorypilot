"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useData, type FieldInput } from "@/lib/data";
import { FIELD_SCOPES, FIELD_TYPES, TYPES_WITH_OPTIONS, keyFromLabel } from "@/lib/fields";
import type { FieldDefinition, FieldScope, FieldType } from "@/lib/types";

const BLANK: FormState = {
  label: "",
  key: "",
  keyTouched: false,
  type: "text",
  optionsText: "",
  required: false,
  scope: "order",
  is_title_field: false,
};

type FormState = {
  label: string;
  key: string;
  keyTouched: boolean;
  type: FieldType;
  optionsText: string;
  required: boolean;
  scope: FieldScope;
  is_title_field: boolean;
};

export default function FieldsPage() {
  const { loaded, fields, can, addField, updateField, removeField, moveField, setTitleField } =
    useData();
  const [form, setForm] = useState<FormState>(BLANK);
  const [editing, setEditing] = useState<FieldDefinition | null>(null);

  if (loaded && !can("manage_fields")) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Sipariş alanları</h1>
        <p className="text-muted-foreground">Bu ekrana erişim yetkiniz yok.</p>
      </div>
    );
  }

  function toInput(state: FormState): FieldInput {
    return {
      label: state.label,
      key: state.key.trim() || keyFromLabel(state.label),
      type: state.type,
      options: state.optionsText
        .split("\n")
        .map((option) => option.trim())
        .filter(Boolean),
      required: state.required,
      scope: state.scope,
      is_title_field: state.is_title_field,
    };
  }

  function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    const result = addField(toInput(form));
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`“${form.label.trim()}” eklendi.`);
    setForm(BLANK);
  }

  function handleSaveEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;

    const result = updateField(editing.id, toInput(form));
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Alan güncellendi.");
    setEditing(null);
    setForm(BLANK);
  }

  function startEditing(field: FieldDefinition) {
    setEditing(field);
    setForm({
      label: field.label,
      key: field.key,
      keyTouched: true,
      type: field.type,
      optionsText: field.options.join("\n"),
      required: field.required,
      scope: field.scope,
      is_title_field: field.is_title_field,
    });
  }

  function handleRemove(field: FieldDefinition) {
    const result = removeField(field.id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`“${field.label}” silindi.`);
  }

  function handleSetTitle(field: FieldDefinition) {
    const result = setTitleField(field.id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`Siparişler artık “${field.label}” ile adlandırılıyor.`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sipariş alanları</h1>
        <p className="text-sm text-muted-foreground">
          Bu işletmede bir siparişin neye benzediğini tanımlar. Yeni sipariş formu bu listeden
          oluşturulur — hiçbiri kodda sabit değildir. Sipariş kapsamındaki alanlar bir kez
          doldurulur; kalem kapsamındaki alanlar her kalem için tekrarlanır.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alanlar</CardTitle>
          <CardDescription>
            {loaded ? `${fields.length} alan` : "Yükleniyor…"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Etiket</TableHead>
                <TableHead>Anahtar</TableHead>
                <TableHead>Kapsam</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>Seçenekler</TableHead>
                <TableHead className="w-24">Zorunlu</TableHead>
                <TableHead className="w-72 text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    Henüz alan yok — ilkini aşağıdan ekleyin.
                  </TableCell>
                </TableRow>
              ) : (
                fields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2 font-medium">
                        {field.label}
                        {field.is_title_field && (
                          <Badge variant="secondary" title="Siparişin görünen adı olarak kullanılır">
                            <Star className="size-3" />
                            Başlık
                          </Badge>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {field.key}
                    </TableCell>
                    <TableCell>
                      <Badge variant={field.scope === "item" ? "secondary" : "outline"}>
                        {field.scope === "item" ? "Kalem başına" : "Sipariş başına"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {FIELD_TYPES.find((type) => type.value === field.type)?.label ?? field.type}
                    </TableCell>
                    <TableCell className="max-w-56 text-muted-foreground">
                      <span className="line-clamp-1">{field.options.join(", ") || "—"}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {field.required ? "Evet" : "Hayır"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => moveField(field.id, "up")}
                          disabled={index === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => moveField(field.id, "down")}
                          disabled={index === fields.length - 1}
                        >
                          ↓
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSetTitle(field)}
                          disabled={field.is_title_field || field.scope === "item"}
                        >
                          Başlık
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => startEditing(field)}>
                          Düzenle
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleRemove(field)}>
                          Sil
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alan ekle</CardTitle>
          <CardDescription>
            Değerler bu anahtar altında saklanır. Etiketten otomatik doldurulur.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="grid gap-4">
            <FieldForm form={form} setForm={setForm} />
            <div>
              <Button type="submit">Alanı ekle</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
            setForm(BLANK);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSaveEdit}>
            <DialogHeader>
              <DialogTitle>Alanı düzenle</DialogTitle>
              <DialogDescription>
                Anahtarı değiştirmek, o alana kayıtlı değerleri de taşır.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6">
              <FieldForm form={form} setForm={setForm} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Vazgeç
              </Button>
              <Button type="submit">Değişiklikleri kaydet</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FieldForm({
  form,
  setForm,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  const needsOptions = TYPES_WITH_OPTIONS.includes(form.type);

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="field-label">Etiket</Label>
          <Input
            id="field-label"
            value={form.label}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                label: event.target.value,
                // Until the key is edited by hand, keep it in step with the label.
                key: current.keyTouched ? current.key : keyFromLabel(event.target.value),
              }))
            }
            placeholder="örn. Üretim tipi"
            autoComplete="off"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="field-key">Anahtar</Label>
          <Input
            id="field-key"
            value={form.key}
            onChange={(event) =>
              setForm((current) => ({ ...current, key: event.target.value, keyTouched: true }))
            }
            placeholder="uretim_tipi"
            className="font-mono text-sm"
            autoComplete="off"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="field-type">Tip</Label>
          <Select
            value={form.type}
            onValueChange={(type) => setForm((current) => ({ ...current, type: type as FieldType }))}
          >
            <SelectTrigger id="field-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIELD_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label} — {type.hint}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="field-scope">Kapsam</Label>
          <Select
            value={form.scope}
            onValueChange={(scope) =>
              setForm((current) => ({
                ...current,
                scope: scope as FieldScope,
                // Only an order-level field can name the order.
                is_title_field: scope === "item" ? false : current.is_title_field,
              }))
            }
          >
            <SelectTrigger id="field-scope" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIELD_SCOPES.map((scope) => (
                <SelectItem key={scope.value} value={scope.value}>
                  {scope.label} — {scope.hint}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {needsOptions && (
        <div className="grid gap-2">
          <Label htmlFor="field-options">Seçenekler</Label>
          <Textarea
            id="field-options"
            rows={4}
            value={form.optionsText}
            onChange={(event) =>
              setForm((current) => ({ ...current, optionsText: event.target.value }))
            }
            placeholder={"Her satıra bir seçenek\nEnjeksiyon Taban\nDiecut Taban"}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={form.required}
            onCheckedChange={(checked) =>
              setForm((current) => ({ ...current, required: checked === true }))
            }
          />
          Zorunlu
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={form.is_title_field}
            disabled={form.scope === "item"}
            onCheckedChange={(checked) =>
              setForm((current) => ({ ...current, is_title_field: checked === true }))
            }
          />
          Siparişin başlığı olarak kullan
        </label>
      </div>
    </div>
  );
}
