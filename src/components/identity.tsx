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
          Rol: {roles.find((role) => role.id === actingUser.role_id)?.name ?? "Rolsüz"}
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

/**
 * Blocks the rest of the app until someone logs in — redirects to /login on
 * first load, and again if the acting user was removed from under them.
 * /login itself is exempt, and logged-in visitors are bounced away from it.
 */
export function IdentityGate({ children }: { children: React.ReactNode }) {
  const { loaded, actingUser } = useData();
  const pathname = usePathname();
  const router = useRouter();
  const onLoginPage = pathname === "/login";

  useEffect(() => {
    if (!loaded) return;
    if (!actingUser && !onLoginPage) router.replace("/login");
    if (actingUser && onLoginPage) router.replace("/");
  }, [loaded, actingUser, onLoginPage, router]);

  if (!loaded) return null;
  if (onLoginPage) return <>{children}</>;
  if (!actingUser) return null;
  return <>{children}</>;
}
