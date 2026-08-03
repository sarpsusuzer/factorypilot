"use client";

import { ChevronDown, ShieldAlert, UserRound } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useData } from "@/lib/data";
import type { Role, User } from "@/lib/types";

const DISCLAIMER =
  "Bu gerçek bir giriş değil — herhangi biri listeden istediği kimliği seçebilir. Ekranların role göre farklılaşması içindir, yetkilendirme değil.";

function roleName(roles: Role[], user: User) {
  return roles.find((role) => role.id === user.role_id)?.name ?? "Rolsüz";
}

function IdentityList({ onPick }: { onPick: (userId: string) => void }) {
  const { users, roles, actingUser } = useData();

  return (
    <div className="space-y-2">
      {users.map((user) => (
        <button
          key={user.id}
          type="button"
          onClick={() => onPick(user.id)}
          className="flex w-full items-center justify-between rounded-md border px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted"
        >
          <span className="flex items-center gap-2">
            <UserRound className="size-4 text-muted-foreground" />
            <span className="font-medium">{user.name}</span>
          </span>
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            {roleName(roles, user)}
            {actingUser?.id === user.id && <span className="text-foreground">· seçili</span>}
          </span>
        </button>
      ))}
    </div>
  );
}

/** Header control — shows who's acting, lets them switch to anyone else. */
export function IdentitySwitcher() {
  const { actingUser, roles, setActingUser } = useData();
  const [open, setOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm hover:bg-muted"
          >
            <UserRound className="size-4 text-muted-foreground" />
            {actingUser ? actingUser.name : "Kimlik seç"}
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setOpen(true)}>Kimlik değiştir…</DropdownMenuItem>
          {actingUser && (
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              Rol: {roles.find((role) => role.id === actingUser.role_id)?.name ?? "Rolsüz"}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kimlik seç</DialogTitle>
            <DialogDescription>{DISCLAIMER}</DialogDescription>
          </DialogHeader>
          <IdentityList
            onPick={(userId) => {
              setActingUser(userId);
              setOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Blocks the rest of the app until an identity is picked — shown on first
 * load, and again if the acting user was removed from under them.
 */
export function IdentityGate({ children }: { children: React.ReactNode }) {
  const { loaded, actingUser, setActingUser } = useData();

  if (!loaded) return null;
  if (actingUser) return <>{children}</>;

  return (
    <div className="mx-auto max-w-md space-y-6 py-12">
      <div className="space-y-2 text-center">
        <ShieldAlert className="mx-auto size-8 text-muted-foreground" />
        <h1 className="text-xl font-semibold tracking-tight">Devam etmek için kimlik seçin</h1>
        <p className="text-sm text-muted-foreground">{DISCLAIMER}</p>
      </div>
      <IdentityList onPick={(userId) => setActingUser(userId)} />
    </div>
  );
}
