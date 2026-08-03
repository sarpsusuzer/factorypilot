// Helpers for roles, users and the acting identity. Pure functions — no
// storage access. See data.ts for the CRUD actions and the `can()` gate
// exposed to screens.

import type { Permission, Role, User } from "./types";

export const PERMISSIONS: { key: Permission; label: string; hint: string }[] = [
  { key: "manage_roles", label: "Rolleri yönet", hint: "Rol ve kullanıcı ekranlarına erişir" },
  { key: "manage_stages", label: "Aşamaları yönet", hint: "Aşama ayarları ekranına erişir" },
  { key: "manage_fields", label: "Sipariş alanlarını yönet", hint: "Sipariş alanları ekranına erişir" },
  { key: "create_order", label: "Sipariş oluştur", hint: "Yeni sipariş formunu kullanabilir" },
  { key: "move_stage", label: "Aşama değiştir", hint: "Bir siparişi başka aşamaya taşıyabilir" },
  { key: "view_reporting", label: "Raporları görüntüle", hint: "Raporlar ekranına erişir" },
];

export const ALL_PERMISSIONS: Permission[] = PERMISSIONS.map((permission) => permission.key);

export function roleForUser(users: User[], roles: Role[], userId: string | null) {
  const user = users.find((u) => u.id === userId);
  if (!user) return undefined;
  return roles.find((role) => role.id === user.role_id);
}

export function hasPermission(role: Role | undefined, permission: Permission) {
  return role?.permissions.includes(permission) ?? false;
}

/**
 * A display name for a `created_by` / `changed_by` value. New records store a
 * user id; records from before this feature existed stored a freely typed
 * name — shown as-is since there's no user to resolve it to.
 */
export function userName(users: User[], idOrName: string) {
  return users.find((user) => user.id === idOrName)?.name ?? idOrName;
}
