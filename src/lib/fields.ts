// Helpers for working with configurable fields and the values orders store
// against them. Pure functions — no storage access.

import type {
  FieldDefinition,
  FieldScope,
  FieldType,
  FieldValue,
  Order,
  OrderItem,
  StoredFile,
} from "./types";

export const FIELD_TYPES: { value: FieldType; label: string; hint: string }[] = [
  { value: "text", label: "Metin", hint: "Tek satır" },
  { value: "textarea", label: "Uzun metin", hint: "Birden fazla satır" },
  { value: "number", label: "Sayı", hint: "Adet, miktar" },
  { value: "select", label: "Seçim", hint: "Tek seçenek" },
  { value: "multiselect", label: "Çoklu seçim", hint: "Birden fazla seçenek" },
  { value: "file", label: "Dosya", hint: "Teknik çizim veya fotoğraf" },
];

export const TYPES_WITH_OPTIONS: FieldType[] = ["select", "multiselect"];

export const FIELD_SCOPES: { value: FieldScope; label: string; hint: string }[] = [
  { value: "order", label: "Sipariş", hint: "Sipariş başına bir kez doldurulur" },
  { value: "item", label: "Kalem", hint: "Her kalem için tekrarlanır" },
];

/** Fields filled in once for the whole order. */
export function orderFields(fields: FieldDefinition[]) {
  return fields.filter((field) => field.scope !== "item");
}

/** Fields that repeat per line item. */
export function itemFields(fields: FieldDefinition[]) {
  return fields.filter((field) => field.scope === "item");
}

/** Turns a label into a usable key: "Production type" -> "production_type". */
export function keyFromLabel(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function emptyValueFor(field: FieldDefinition): FieldValue {
  if (field.type === "multiselect" || field.type === "file") return [];
  return "";
}

/** A blank set of values for every configured field. */
export function blankValues(fields: FieldDefinition[]) {
  const values: Record<string, FieldValue> = {};
  for (const field of fields) values[field.key] = emptyValueFor(field);
  return values;
}

export function isEmptyValue(value: FieldValue) {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "string") return value.trim() === "";
  return false;
}

function isStoredFileList(value: FieldValue): value is StoredFile[] {
  return Array.isArray(value) && value.every((item) => typeof item === "object" && item !== null);
}

/** The files on a file-field value, or an empty list for anything else. */
export function asStoredFiles(value: FieldValue): StoredFile[] {
  return isStoredFileList(value) ? value : [];
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Human-readable version of a stored value, for tables and detail views. */
export function formatFieldValue(field: FieldDefinition | undefined, value: FieldValue): string {
  if (isEmptyValue(value)) return "—";
  if (field?.type === "file" && isStoredFileList(value)) {
    return value.map((file) => file.name).join(", ");
  }
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

/** The field that gives an order its display name — always order-level. */
export function titleField(fields: FieldDefinition[]) {
  const candidates = orderFields(fields);
  return candidates.find((field) => field.is_title_field) ?? candidates[0];
}

/** What to call this order in lists and headings. */
export function orderTitle(order: Order, fields: FieldDefinition[]) {
  const field = titleField(fields);
  if (!field) return order.order_no;
  const value = order.field_values?.[field.key];
  return isEmptyValue(value) ? order.order_no : formatFieldValue(field, value);
}

/** Every value on an order and its items, as searchable text. */
export function searchableText(order: Order) {
  const values = [
    ...Object.values(order.field_values ?? {}),
    ...(order.items ?? []).flatMap((item) => Object.values(item.field_values ?? {})),
  ];
  return values
    .map((value) => formatFieldValue(undefined, value))
    .join(" ")
    .toLowerCase();
}

/** What to call one line item — its first filled-in field, or a plain fallback. */
export function itemTitle(item: OrderItem, perItemFields: FieldDefinition[], index: number) {
  const first = perItemFields.find((field) => !isEmptyValue(item.field_values?.[field.key]));
  if (!first) return `Kalem ${index + 1}`;
  return formatFieldValue(first, item.field_values?.[first.key] ?? null);
}

/**
 * Distinct values of one item field across an order — "Diecut, Çelikli" for an
 * order whose items use both.
 */
export function summariseItemField(order: Order, field: FieldDefinition) {
  const values = (order.items ?? []).flatMap((item) => {
    const value = item.field_values?.[field.key];
    if (isEmptyValue(value)) return [];
    return Array.isArray(value) ? value.map((entry) => String(entry)) : [String(value)];
  });
  return [...new Set(values)].join(", ");
}

/**
 * Checks required fields and number formats.
 * Returns a message per field key; an empty object means the form is valid.
 */
export function validateValues(
  fields: FieldDefinition[],
  values: Record<string, FieldValue>,
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const value = values[field.key];

    if (field.required && isEmptyValue(value)) {
      errors[field.key] = `${field.label} zorunludur.`;
      continue;
    }
    if (field.type === "number" && !isEmptyValue(value) && Number.isNaN(Number(value))) {
      errors[field.key] = `${field.label} sayı olmalıdır.`;
    }
  }

  return errors;
}
