"use client";

import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import type { FieldDefinition, FieldValue, StoredFile } from "@/lib/types";

// localStorage has only a few MB to work with in total, so files above this
// size keep just their name — small enough that a handful still fit easily.
const MAX_INLINE_BYTES = 3 * 1024 * 1024;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function toStoredFiles(fileList: FileList): Promise<StoredFile[]> {
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

      case "number":
        return (
          <Input
            id={inputId}
            type="number"
            value={typeof value === "string" || typeof value === "number" ? String(value) : ""}
            onChange={(event) => onChange(event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
          />
        );

      case "select":
        return (
          <Select
            value={typeof value === "string" && value ? value : undefined}
            onValueChange={onChange}
          >
            <SelectTrigger id={inputId} className="w-full" aria-invalid={Boolean(error)}>
              <SelectValue placeholder="Seçin…" />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "multiselect": {
        const selected = Array.isArray(value) ? (value as string[]) : [];
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                id={inputId}
                type="button"
                variant="outline"
                className="w-full justify-between font-normal"
                aria-invalid={Boolean(error)}
              >
                <span className={selected.length ? "" : "text-muted-foreground"}>
                  {selected.length ? selected.join(", ") : "Seçin…"}
                </span>
                <ChevronDown className="size-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-(--radix-dropdown-menu-trigger-width)">
              {field.options.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option}
                  checked={selected.includes(option)}
                  // Keep the menu open so several options can be picked in one go.
                  onSelect={(event) => event.preventDefault()}
                  onCheckedChange={(checked) =>
                    onChange(
                      checked
                        ? [...selected, option]
                        : selected.filter((entry) => entry !== option),
                    )
                  }
                >
                  {option}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }

      case "file": {
        const files = Array.isArray(value) ? (value as StoredFile[]) : [];
        return (
          <div className="grid gap-1.5">
            <Input
              id={inputId}
              type="file"
              multiple
              onChange={(event) => {
                const fileList = event.target.files;
                if (!fileList || fileList.length === 0) return;
                toStoredFiles(fileList).then(onChange);
              }}
              aria-invalid={Boolean(error)}
              aria-describedby={describedBy}
            />
            {files.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {files.map((file) => file.name).join(", ")} — sipariş kaydedildiğinde açılıp
                indirilebilir olacak (3 MB üstü dosyalarda yalnızca adı tutulur).
              </p>
            )}
          </div>
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
