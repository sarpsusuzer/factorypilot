"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type { Permission, Role } from "@/lib/types";

export default function RolesPage() {
  const { loaded, roles, users, can, addRole, updateRole, removeRole } = useData();
  const [addOpen, setAddOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRolePermissions, setNewRolePermissions] = useState<Permission[]>([]);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editName, setEditName] = useState("");
  const [editPermissions, setEditPermissions] = useState<Permission[]>([]);

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
    setAddOpen(false);
  }

  function startEditing(role: Role) {
    setEditingRole(role);
    setEditName(role.name);
    setEditPermissions(role.permissions);
  }

  async function handleSaveEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!editingRole) return;

    const result = await updateRole(editingRole.id, { name: editName, permissions: editPermissions });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Rol güncellendi.");
    setEditingRole(null);
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
          <CardAction>
            <Button onClick={() => setAddOpen(true)}>Rol ekle</Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-3">
          {roles.map((role) => {
            const roleUsers = users.filter((user) => user.role_id === role.id);

            return (
              <Card key={role.id} size="sm">
                <Accordion type="single" collapsible>
                  <AccordionItem value={role.id} className="border-b-0 px-(--card-spacing)">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <AccordionTrigger hideIcon className="w-full py-1 hover:no-underline">
                          <span className="flex flex-wrap items-center gap-2 text-left">
                            <span className="font-medium">{role.name}</span>
                            <Badge variant="secondary">
                              {role.permissions.length} / {PERMISSIONS.length} yetki
                            </Badge>
                            <Badge variant="secondary">{roleUsers.length} kullanıcı</Badge>
                          </span>
                        </AccordionTrigger>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button size="sm" variant="outline" onClick={() => startEditing(role)}>
                          Düzenle
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
                      </div>
                      <AccordionTrigger className="flex-none justify-center px-1 py-1 hover:no-underline" />
                    </div>
                    <AccordionContent>
                      {roleUsers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Bu role sahip kullanıcı yok.</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Ad</TableHead>
                              <TableHead>E-posta</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {roleUsers.map((user) => (
                              <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </Card>
            );
          })}
        </CardContent>
      </Card>

      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) {
            setNewRoleName("");
            setNewRolePermissions([]);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleAdd}>
            <DialogHeader>
              <DialogTitle>Yeni rol ekle</DialogTitle>
              <DialogDescription>
                Bu role sahip kullanıcıların hangi yetkilere sahip olacağını seçin.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-6">
              <div className="grid gap-2">
                <Label htmlFor="new-role">Ad</Label>
                <Input
                  id="new-role"
                  value={newRoleName}
                  onChange={(event) => setNewRoleName(event.target.value)}
                  placeholder="örn. Montajcı"
                  autoComplete="off"
                  autoFocus
                />
              </div>
              <PermissionPicker selected={newRolePermissions} onChange={setNewRolePermissions} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                Vazgeç
              </Button>
              <Button type="submit">Rolü ekle</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editingRole !== null} onOpenChange={(open) => !open && setEditingRole(null)}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSaveEdit}>
            <DialogHeader>
              <DialogTitle>Rolü düzenle</DialogTitle>
              <DialogDescription>
                Bu role sahip kullanıcıların hangi yetkilere sahip olacağını seçin.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-6">
              <div className="grid gap-2">
                <Label htmlFor="edit-role">Ad</Label>
                <Input
                  id="edit-role"
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  autoComplete="off"
                  autoFocus
                />
              </div>
              <PermissionPicker
                selected={editPermissions}
                onChange={setEditPermissions}
                disablePermission={
                  editingRole?.is_protected ? (permission) => permission === "manage_roles" : undefined
                }
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingRole(null)}>
                Vazgeç
              </Button>
              <Button type="submit">Değişiklikleri kaydet</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PermissionPicker({
  selected,
  onChange,
  disablePermission,
}: {
  selected: Permission[];
  onChange: React.Dispatch<React.SetStateAction<Permission[]>>;
  disablePermission?: (permission: Permission) => boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label>Yetkiler</Label>
      <div className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
        {PERMISSIONS.map((permission) => (
          <label key={permission.key} className="flex items-start gap-2 text-sm">
            <Checkbox
              className="mt-0.5"
              checked={selected.includes(permission.key)}
              disabled={disablePermission?.(permission.key)}
              onCheckedChange={(checked) =>
                onChange((current) =>
                  checked
                    ? [...current, permission.key]
                    : current.filter((key) => key !== permission.key),
                )
              }
            />
            <span>
              {permission.label}
              <span className="block text-xs text-muted-foreground">{permission.hint}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
