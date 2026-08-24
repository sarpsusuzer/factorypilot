"use client";

import { Download, ExternalLink, FileWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/fields";
import type { StoredFile } from "@/lib/types";

/**
 * Renders a file-field value with open/download actions. Files under the size
 * cap (see field-input.tsx) carry their own data, so they can be reopened;
 * larger ones only kept their name and show as such, not as a broken link.
 */
export function FieldFileList({ files }: { files: StoredFile[] }) {
  if (files.length === 0) return <span className="text-muted-foreground">—</span>;

  return (
    <ul className="space-y-1.5">
      {files.map((file, index) => (
        <li key={`${file.name}-${index}`} className="flex items-center gap-2 text-sm">
          <span className="min-w-0 flex-1 truncate" title={file.name}>
            {file.name}
          </span>
          <span className="shrink-0 text-xs whitespace-nowrap text-muted-foreground">
            {formatFileSize(file.size)}
          </span>
          {file.dataUrl ? (
            <span className="flex shrink-0 gap-1">
              <Button asChild variant="ghost" size="icon-sm" title="Yeni sekmede aç">
                <a href={file.dataUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-3.5" />
                </a>
              </Button>
              <Button asChild variant="ghost" size="icon-sm" title="İndir">
                <a href={file.dataUrl} download={file.name}>
                  <Download className="size-3.5" />
                </a>
              </Button>
            </span>
          ) : (
            <span
              className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground"
              title="Dosya 3 MB'tan büyüktü, yalnızca adı kaydedildi"
            >
              <FileWarning className="size-3.5" />
              Kaydedilmedi
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
