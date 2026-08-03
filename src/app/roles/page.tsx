"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useData } from "@/lib/data";
import { PERMISSIONS } from "@/lib/permissions";
import type { Permission } from "@/lib/types";

export default function RolesPage() {
  const { loaded, roles, users, can, addRole, updateRole, toggleRolePermission, removeRole } =
    useData();
  const [newRoleName, setNewRoleName] = useState("");
  const [newRolePermissions, setNewRolePermissions] = useState<Permission[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  if (loaded && !can("manage_roles")) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Roller</h1>
        <p className="text-muted-foreground">Bu ekrana erişim yetkiniz yok.</p>
      </div>
    );
  }

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    const result = await addRole({ name: newRoleName, permissions: newRolePermissions });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`“${newRoleName.trim()}” eklendi.`);
    setNewRoleName("");
    setNewRolePermissions([]);
  }

  async function handleRename(roleId: string, permissions: Permission[]) {
    const result = await updateRole(roleId, { name: editingName, permissions });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setEditingId(null);
    setEditingName("");
  }

  async function handleToggle(roleId: string, permission: Permission) {
    const result = await toggleRolePermission(roleId, permission);
    if (!result.ok) toast.error(result.error);
  }

  async function handleRemove(roleId: string, name: string) {
    const result = await removeRole(roleId);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`“${name}” silindi.`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Roller</h1>
        <p className="text-sm text-muted-foreground">
          Her rolün hangi yetkilere sahip olduğunu belirler. Yönetici rolü silinemez ve rol
          yönetimi yetkisi ondan alınamaz — aksi halde kimse rolleri yönetemeyecek bir duruma
          düşülebilirdi.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roller</CardTitle>
          <CardDescription>{loaded ? `${roles.length} rol` : "Yükleniyor…"}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-40">Ad</TableHead>
                  {PERMISSIONS.map((permission) => (
                    <TableHead key={permission.key} className="text-center" title={permission.hint}>
                      {permission.label}
                    </TableHead>
                  ))}
                  <TableHead className="text-center">Kullanıcı</TableHead>
                  <TableHead className="w-56 text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => {
                  const editing = editingId === role.id;
                  const userCount = users.filter((user) => user.role_id === role.id).length;

                  return (
                    <TableRow key={role.id}>
                      <TableCell>
                        {editing ? (
                          <Input
                            value={editingName}
                            onChange={(event) => setEditingName(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") handleRename(role.id, role.permissions);
                              if (event.key === "Escape") setEditingId(null);
                            }}
                            autoFocus
                          />
                        ) : (
                          <span className="font-medium">{role.name}</span>
                        )}
                      </TableCell>
                      {PERMISSIONS.map((permission) => (
                        <TableCell key={permission.key} className="text-center">
                          <Checkbox
                            checked={role.permissions.includes(permission.key)}
                            disabled={role.is_protected && permission.key === "manage_roles"}
                            onCheckedChange={() => handleToggle(role.id, permission.key)}
                          />
                        </TableCell>
                      ))}
                      <TableCell className="text-center text-muted-foreground">
                        {userCount}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap justify-end gap-2">
                          {editing ? (
                            <>
                              <Button size="sm" onClick={() => handleRename(role.id, role.permissions)}>
                                Kaydet
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                                Vazgeç
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingId(role.id);
                                  setEditingName(role.name);
                                }}
                              >
                                Yeniden adlandır
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRemove(role.id, role.name)}
                                disabled={role.is_protected}
                                title={role.is_protected ? "Bu rol silinemez" : undefined}
                              >
                                Sil
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <form onSubmit={handleAdd} className="mt-6 space-y-4 border-t pt-6">
            <div className="grid max-w-sm gap-2">
              <Label htmlFor="new-role">Rol ekle</Label>
              <Input
                id="new-role"
                value={newRoleName}
                onChange={(event) => setNewRoleName(event.target.value)}
                placeholder="örn. Montajcı"
                autoComplete="off"
              />
            </div>
            <div className="flex flex-wrap gap-4">
              {PERMISSIONS.map((permission) => (
                <label key={permission.key} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={newRolePermissions.includes(permission.key)}
                    onCheckedChange={(checked) =>
                      setNewRolePermissions((current) =>
                        checked
                          ? [...current, permission.key]
                          : current.filter((key) => key !== permission.key),
                      )
                    }
                  />
                  {permission.label}
                </label>
              ))}
            </div>
            <Button type="submit">Rolü ekle</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
