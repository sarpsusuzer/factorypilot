"use client";

import { LogOut, UserRound } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useData } from "@/lib/data";

/** Header control — shows who's logged in and their role, with a way to log out. */
export function IdentitySwitcher() {
  const router = useRouter();
  const { actingUser, roles, logout } = useData();

  if (!actingUser) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm hover:bg-muted"
        >
          <UserRound className="size-4 text-muted-foreground" />
          {actingUser.name}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          Rol:{" "}
          {actingUser.is_platform_admin
            ? "Platform yöneticisi"
            : (roles.find((role) => role.id === actingUser.role_id)?.name ?? "Rolsüz")}
        </div>
        <DropdownMenuItem
          onSelect={() => {
            logout();
            router.push("/login");
          }}
        >
          <LogOut className="size-4" />
          Çıkış yap
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const DEACTIVATED_FLAG = "factorypilot.deactivated";

/**
 * Blocks the rest of the app until someone logs in — redirects to /login on
 * first load, and again if the acting user was removed from under them.
 * /login itself is exempt, and logged-in visitors are bounced away from it.
 *
 * Also the single place that reacts to a deactivated user or company: auth
 * itself has no notion of "deactivated" (they authenticate fine), so this
 * checks the same profiles/companies snapshot every other screen reads and
 * signs them back out. Doing that check as a one-off query inside login()
 * instead raced the auth-state listener that drives this same redirect —
 * it fires the instant sign-in resolves, before a second query could run.
 */
export function IdentityGate({ children }: { children: React.ReactNode }) {
  const { loaded, actingUser, company, logout } = useData();
  const pathname = usePathname();
  const router = useRouter();
  const onLoginPage = pathname === "/login";
  const deactivated =
    !!actingUser &&
    (!actingUser.is_active || (!actingUser.is_platform_admin && company?.is_active === false));

  useEffect(() => {
    if (!loaded) return;
    if (deactivated) {
      sessionStorage.setItem(DEACTIVATED_FLAG, "1");
      logout();
      return;
    }
    if (!actingUser && !onLoginPage) router.replace("/login");
    if (actingUser && onLoginPage) router.replace(actingUser.is_platform_admin ? "/admin" : "/");
  }, [loaded, actingUser, deactivated, onLoginPage, router, logout]);

  if (!loaded || deactivated) return null;
  if (onLoginPage) return <>{children}</>;
  if (!actingUser) return null;
  return <>{children}</>;
}
