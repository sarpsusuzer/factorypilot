import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ListRow({
  leading,
  label,
  value,
  meta,
  muted = false,
  href,
}: {
  /** A colored dot, brand glyph, or small icon shown before the label. */
  leading?: ReactNode;
  label: ReactNode;
  value?: ReactNode;
  /** Secondary trailing value, e.g. a share-of-total percentage. */
  meta?: ReactNode;
  /** Dims the row — used for the trailing "see more" affordance rows. */
  muted?: boolean;
  href?: string;
}) {
  const content = (
    <>
      <span className="flex min-w-0 flex-1 items-center gap-2.5">
        {leading && <span className="flex size-4 shrink-0 items-center justify-center">{leading}</span>}
        <span className={cn("truncate text-sm", muted ? "text-muted-foreground" : "text-foreground")}>
          {label}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-3">
        {meta && <span className="text-[13px] tabular-nums text-muted-foreground">{meta}</span>}
        {value !== undefined && (
          <span className="text-sm font-medium tabular-nums text-foreground">{value}</span>
        )}
      </span>
    </>
  );

  const rowClass = "flex items-center justify-between gap-3 rounded-md px-2 py-2 transition-colors";

  if (href) {
    return (
      <a href={href} className={cn(rowClass, "hover:bg-background")}>
        {content}
      </a>
    );
  }

  return <div className={rowClass}>{content}</div>;
}
