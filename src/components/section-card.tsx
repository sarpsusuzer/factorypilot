import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionCard({
  icon,
  title,
  description,
  action,
  seeAllHref,
  children,
  className,
  titleClassName,
  contentFramed = true,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  /** Custom control shown next to the title, e.g. a dropdown — replaces the default "See all" link. */
  action?: ReactNode;
  seeAllHref?: string;
  children: ReactNode;
  className?: string;
  /** Overrides the title's default 15px/semibold/foreground styling. */
  titleClassName?: string;
  /**
   * Puts the description and children inside one bordered bg-card frame
   * (same treatment as StatCard's value block) and switches the outer card
   * to a white background — leaving only the title outside the frame. On by
   * default; set to `false` when children already carry their own frame
   * (e.g. a lone `<OrderStatusBar>`), to avoid a border inside a border.
   */
  contentFramed?: boolean;
}) {
  const body = (
    <>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      <div className="space-y-0.5">{children}</div>
    </>
  );

  return (
    <div
      className={cn(
        "rounded-xl border border-border p-3",
        contentFramed ? "bg-background" : "bg-card",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 p-2">
        <div className="min-w-0">
          <span
            className={cn(
              "flex items-center gap-1.5 text-[15px] font-semibold text-foreground",
              titleClassName,
            )}
          >
            {icon && <span className="flex size-4 items-center justify-center text-muted-foreground">{icon}</span>}
            {title}
          </span>
          {!contentFramed && description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action ??
          (seeAllHref && (
            <a
              href={seeAllHref}
              className="flex shrink-0 items-center gap-0.5 text-[13px] font-normal text-muted-foreground transition-colors hover:text-foreground"
            >
              See all
              <ChevronRight className="size-3.5" />
            </a>
          ))}
      </div>
      {contentFramed ? (
        <div className="space-y-3 rounded-lg border border-border bg-card p-4">{body}</div>
      ) : (
        <div className="space-y-0.5">{children}</div>
      )}
    </div>
  );
}
