"use client";

import { Check, File as FileIcon, UploadCloud, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatFileSize } from "@/lib/fields";
import { cn } from "@/lib/utils";
import type { FieldDefinition, FieldValue, StoredFile } from "@/lib/types";

// localStorage has only a few MB to work with in total, so files above this
// size keep just their name — small enough that a handful still fit easily.
const MAX_INLINE_BYTES = 3 * 1024 * 1024;

const QUANTITY_PRESETS = [1, 10, 50, 100];

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function toStoredFiles(fileList: FileList | File[]): Promise<StoredFile[]> {
  const files = Array.from(fileList);
  const oversized = files.filter((file) => file.size > MAX_INLINE_BYTES);
  if (oversized.length > 0) {
    toast.error(
      `${oversized.map((file) => file.name).join(", ")} 3 MB'tan büyük — yalnızca adı kaydedildi, açılamaz.`,
    );
  }

  return Promise.all(
    files.map(async (file) => {
      const base: StoredFile = { name: file.name, size: file.size, type: file.type };
      if (file.size > MAX_INLINE_BYTES) return base;
      try {
        return { ...base, dataUrl: await readAsDataUrl(file) };
      } catch {
        return base;
      }
    }),
  );
}

// Option cards show a colour swatch when the option text names a colour —
// covers both a "Renk" field and any other select/multiselect whose options
// happen to be colour names, without a separate field-level setting for it.
const COLOR_SWATCHES: Record<string, string> = {
  siyah: "#18181b",
  beyaz: "#ffffff",
  kırmızı: "#ef4444",
  kirmizi: "#ef4444",
  mavi: "#3b82f6",
  lacivert: "#1e3a8a",
  "açık mavi": "#38bdf8",
  yeşil: "#22c55e",
  yesil: "#22c55e",
  "koyu yeşil": "#15803d",
  sarı: "#eab308",
  sari: "#eab308",
  turuncu: "#f97316",
  mor: "#a855f7",
  pembe: "#ec4899",
  gri: "#9ca3af",
  "koyu gri": "#4b5563",
  "açık gri": "#d1d5db",
  kahverengi: "#92400e",
  bej: "#d6c7a1",
  krem: "#f2ead9",
  bordo: "#7f1d1d",
  turkuaz: "#06b6d4",
  gümüş: "#c0c0c0",
  gumus: "#c0c0c0",
  altın: "#d4af37",
  altin: "#d4af37",
};

function colorSwatchFor(option: string): string | null {
  return COLOR_SWATCHES[option.trim().toLocaleLowerCase("tr")] ?? null;
}

const optionCardClass = (selected: boolean, invalid: boolean) =>
  cn(
    "flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
    selected
      ? "border-primary bg-primary text-primary-foreground"
      : "border-input bg-background text-foreground hover:bg-accent",
    !selected && invalid && "border-destructive",
  );

/**
 * Renders the right control for a field definition's type. This is the only
 * place that maps a field type to a component — the form itself just loops.
 */
export function FieldInput({
  field,
  value,
  onChange,
  error,
}: {
  field: FieldDefinition;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
  error?: string;
}) {
  const inputId = `field-${field.key}`;
  const describedBy = error ? `${inputId}-error` : undefined;

  // Quantity presets need to know, on first render only, whether the current
  // value already matches a preset — re-deriving this on every keystroke
  // would fight the user while they type a custom amount.
  const [customQuantity, setCustomQuantity] = useState(() => {
    const n = typeof value === "string" || typeof value === "number" ? Number(value) : NaN;
    return !QUANTITY_PRESETS.includes(n);
  });

  return (
    <div className="grid gap-2">
      <Label htmlFor={inputId}>
        {field.label}
        {field.required && <span className="text-destructive">*</span>}
      </Label>

      {renderControl()}

      {error && (
        <p id={describedBy} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );

  function renderControl() {
    switch (field.type) {
      case "textarea":
        return (
          <Textarea
            id={inputId}
            rows={3}
            value={typeof value === "string" ? value : ""}
            onChange={(event) => onChange(event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
          />
        );

      case "number": {
        const stringValue = typeof value === "string" || typeof value === "number" ? String(value) : "";
        return (
          <div className="flex flex-wrap items-center gap-2" role="radiogroup" id={inputId}>
            {QUANTITY_PRESETS.map((preset) => {
              const selected = !customQuantity && stringValue === String(preset);
              return (
                <button
                  key={preset}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    setCustomQuantity(false);
                    onChange(String(preset));
                  }}
                  className={optionCardClass(selected, Boolean(error))}
                >
                  {preset}
                </button>
              );
            })}
            <button
              type="button"
              role="radio"
              aria-checked={customQuantity}
              onClick={() => setCustomQuantity(true)}
              className={optionCardClass(customQuantity, Boolean(error))}
            >
              Özel
            </button>
            {customQuantity && (
              <Input
                type="number"
                value={stringValue}
                onChange={(event) => onChange(event.target.value)}
                placeholder="Miktar girin"
                aria-invalid={Boolean(error)}
                aria-describedby={describedBy}
                autoFocus
                className="w-32"
              />
            )}
          </div>
        );
      }

      case "select":
        return (
          <div
            id={inputId}
            role="radiogroup"
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className="flex flex-wrap gap-2"
          >
            {field.options.map((option) => {
              const selected = value === option;
              const swatch = colorSwatchFor(option);
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChange(option)}
                  className={optionCardClass(selected, Boolean(error))}
                >
                  {swatch && (
                    <span
                      className="size-4 shrink-0 rounded-full border border-black/10"
                      style={{ backgroundColor: swatch }}
                    />
                  )}
                  {option}
                </button>
              );
            })}
          </div>
        );

      case "multiselect": {
        const selectedOptions = Array.isArray(value) ? (value as string[]) : [];
        return (
          <div
            id={inputId}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className="flex flex-wrap gap-2"
          >
            {field.options.map((option) => {
              const selected = selectedOptions.includes(option);
              const swatch = colorSwatchFor(option);
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={selected}
                  onClick={() =>
                    onChange(
                      selected
                        ? selectedOptions.filter((entry) => entry !== option)
                        : [...selectedOptions, option],
                    )
                  }
                  className={optionCardClass(selected, Boolean(error))}
                >
                  {swatch && (
                    <span
                      className="size-4 shrink-0 rounded-full border border-black/10"
                      style={{ backgroundColor: swatch }}
                    />
                  )}
                  {option}
                  {selected && <Check className="size-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>
        );
      }

      case "file": {
        const files = Array.isArray(value) ? (value as StoredFile[]) : [];
        return (
          <FileDropzone
            inputId={inputId}
            describedBy={describedBy}
            error={error}
            files={files}
            onAdd={(fileList) => toStoredFiles(fileList).then((added) => onChange([...files, ...added]))}
            onRemove={(index) => onChange(files.filter((_, i) => i !== index))}
          />
        );
      }

      default:
        return (
          <Input
            id={inputId}
            value={typeof value === "string" ? value : ""}
            onChange={(event) => onChange(event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
          />
        );
    }
  }
}

/** A styled drag-and-drop-capable replacement for the bare native file input. */
function FileDropzone({
  inputId,
  describedBy,
  error,
  files,
  onAdd,
  onRemove,
}: {
  inputId: string;
  describedBy?: string;
  error?: string;
  files: StoredFile[];
  onAdd: (files: FileList | File[]) => void;
  onRemove: (index: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div className="grid gap-2">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        multiple
        className="sr-only"
        onChange={(event) => {
          if (event.target.files && event.target.files.length > 0) onAdd(event.target.files);
          event.target.value = "";
        }}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (event.dataTransfer.files.length > 0) onAdd(event.dataTransfer.files);
        }}
        className={cn(
          "flex w-full flex-col items-center gap-1.5 rounded-md border border-dashed px-4 py-6 text-center transition-colors",
          dragging ? "border-ring bg-accent" : "border-input bg-background hover:bg-accent/50",
          error && "border-destructive",
        )}
      >
        <UploadCloud className="size-5 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Dosya yükle</span>
        <span className="text-xs text-muted-foreground">veya sürükleyip bırakın</span>
      </button>

      {files.length > 0 && (
        <ul className="grid gap-1.5">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-sm"
            >
              <FileIcon className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate" title={file.name}>
                {file.name}
              </span>
              <span className="shrink-0 text-xs whitespace-nowrap text-muted-foreground">
                {formatFileSize(file.size)}
              </span>
              {file.dataUrl && <Check className="size-3.5 shrink-0 text-muted-foreground" aria-label="Kaydedildi" />}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onRemove(index)}
                aria-label={`${file.name} dosyasını kaldır`}
              >
                <X className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
