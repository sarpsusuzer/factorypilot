"use client";

import { Building2, ClipboardList, LineChart, ShieldCheck, Users2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { IdentitySwitcher } from "@/components/identity";
import { useData } from "@/lib/data";
import type { Permission } from "@/lib/types";
import { cn } from "@/lib/utils";

const LINKS: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: Permission;
}[] = [
  { href: "/", label: "Siparişler", icon: ClipboardList },
  { href: "/reporting", label: "Raporlar", icon: LineChart, permission: "view_reporting" },
  { href: "/roles", label: "Roller", icon: ShieldCheck, permission: "manage_roles" },
  { href: "/users", label: "Kullanıcılar", icon: Users2, permission: "manage_roles" },
  { href: "/company", label: "Şirket", icon: Building2, permission: "manage_company" },
];

const ADMIN_LINKS = [
  { href: "/admin", label: "Şirketler", icon: Building2 },
  { href: "/admin/users", label: "Kullanıcılar", icon: Users2 },
  { href: "/admin/matches", label: "Üretici-Müşteri Eşleştirme", icon: LineChart },
];

export function SiteNav() {
  const pathname = usePathname();
  const { loaded, can, actingUser, company } = useData();
  const onLoginPage = pathname === "/login";
  // Nothing gated is visible until an identity resolves — same rule the
  // gated screens themselves enforce, just applied to the nav up front.
  const links = actingUser?.is_platform_admin
    ? ADMIN_LINKS
    : LINKS.filter((link) => !link.permission || (loaded && can(link.permission)));

  const brand = (
    <Link href="/" className="flex flex-none items-center gap-2.5 pr-1.5">
      {company?.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={company.logo_url} alt="" className="size-[26px] rounded-sm object-contain" />
      ) : (
        <BrandMark className="size-[22px] text-foreground" />
      )}
      <span className="text-[15px] font-semibold tracking-tight text-foreground">
        FactoryPilot
      </span>
    </Link>
  );

  if (onLoginPage) {
    return (
      <header className="h-14 flex-none bg-background">
        <div className="mx-auto flex h-full w-full max-w-6xl items-center px-4.5">{brand}</div>
      </header>
    );
  }

  return (
    <header className="h-14 flex-none border-b border-border bg-background">
      <div className="mx-auto flex h-full w-full max-w-6xl items-center gap-3.5 px-4.5">
        {brand}
        <nav className="flex h-full flex-1 items-center gap-1">
          {links.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" || pathname.startsWith("/orders") : pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative flex h-full items-center gap-1.5 px-3 text-sm font-medium whitespace-nowrap transition-colors after:absolute after:inset-x-3 after:bottom-0 after:h-[2px] after:rounded-full after:transition-colors",
                  active
                    ? "text-foreground after:bg-primary"
                    : "text-muted-foreground after:bg-transparent hover:text-foreground",
                )}
              >
                <Icon className="size-[15px]" />
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
