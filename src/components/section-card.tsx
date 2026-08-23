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
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  /** Custom control shown next to the title, e.g. a dropdown — replaces the default "See all" link. */
  action?: ReactNode;
  seeAllHref?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-3", className)}>
      <div className="flex items-center justify-between gap-2 px-1 pb-2">
        <div className="min-w-0">
          <span className="flex items-center gap-1.5 text-[15px] font-semibold text-foreground">
            {icon && <span className="flex size-4 items-center justify-center text-muted-foreground">{icon}</span>}
            {title}
          </span>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
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
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}
