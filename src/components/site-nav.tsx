"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IdentitySwitcher } from "@/components/identity";
import { useData } from "@/lib/data";
import type { Permission } from "@/lib/types";
import { cn } from "@/lib/utils";

const LINKS: { href: string; label: string; permission?: Permission }[] = [
  { href: "/", label: "Siparişler" },
  { href: "/reporting", label: "Raporlar", permission: "view_reporting" },
  { href: "/fields", label: "Sipariş alanları", permission: "manage_fields" },
  { href: "/stages", label: "Aşama ayarları", permission: "manage_stages" },
  { href: "/roles", label: "Roller", permission: "manage_roles" },
  { href: "/users", label: "Kullanıcılar", permission: "manage_roles" },
];

export function SiteNav() {
  const pathname = usePathname();
  const { loaded, can } = useData();
  // Nothing gated is visible until an identity resolves — same rule the
  // gated screens themselves enforce, just applied to the nav up front.
  const links = LINKS.filter((link) => !link.permission || (loaded && can(link.permission)));

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-8 px-6 py-4">
        <Link href="/" className="text-base font-semibold tracking-tight">
          FactoryPilot
        </Link>
        <nav className="flex flex-1 items-center gap-1">
          {links.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" || pathname.startsWith("/orders") : pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        {loaded && <IdentitySwitcher />}
      </div>
    </header>
  );
}
