"use client";

import { UserPlus, Users2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SectionCard } from "@/components/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useData } from "@/lib/data";

export default function UsersPage() {
  const {
    loaded,
    users: allUsers,
    company,
    roles,
    actingUser,
    can,
    addUser,
    updateUser,
    removeUser,
    setUserPassword,
  } = useData();
  // `useData().users` is scoped wider than this — it also carries cross-company
  // profiles the app needs to resolve an order's creator name elsewhere. This
  // screen manages accounts, so it must only ever show this company's own.
  const users = allUsers.filter((user) => user.company_id === company?.id);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRoleId, setNewRoleId] = useState(roles[0]?.id ?? "");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");

  if (loaded && !can("manage_roles")) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Kullanıcılar</h1>
        <p className="text-muted-foreground">Bu ekrana erişim yetkiniz yok.</p>
      </div>
    );
  }

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    const result = await addUser({
      name: newName,
      email: newEmail,
      role_id: newRoleId || roles[0]?.id || "",
      password: newPassword,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`“${newName.trim()}” eklendi.`);
    setNewName("");
    setNewEmail("");
    setNewPassword("");
  }

  async function handleResetPassword(userId: string, name: string) {
    const result = await setUserPassword(userId, resetPassword);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`“${name}” için şifre güncellendi.`);
    setResettingId(null);
    setResetPassword("");
  }

  async function handleRename(userId: string, roleId: string) {
    const result = await updateUser(userId, { name: editingName, role_id: roleId });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setEditingId(null);
    setEditingName("");
  }

  async function handleRoleChange(userId: string, name: string, roleId: string) {
    const result = await updateUser(userId, { name, role_id: roleId });
    if (!result.ok) toast.error(result.error);
  }

  async function handleRemove(userId: string, name: string) {
    const result = await removeUser(userId);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`“${name}” silindi.`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Kullanıcılar</h1>
        <p className="text-sm text-muted-foreground">
          Kimlerin giriş yapabileceğini, e-postalarını ve rollerini belirler.
        </p>
      </div>

      <SectionCard
        icon={<Users2 className="size-4" />}
        title="Kullanıcılar"
        description={loaded ? `${users.length} kullanıcı` : "Yükleniyor…"}
      >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad</TableHead>
                <TableHead>E-posta</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="w-80 text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const editing = editingId === user.id;

                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      {editing ? (
                        <Input
                          value={editingName}
                          onChange={(event) => setEditingName(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") handleRename(user.id, user.role_id ?? "");
                            if (event.key === "Escape") setEditingId(null);
                          }}
                          autoFocus
                        />
                      ) : (
                        <span className="font-medium">
                          {user.name}
                          {actingUser?.id === user.id && (
                            <span className="ml-2 text-xs text-muted-foreground">(siz)</span>
                          )}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Select
                        value={user.role_id ?? ""}
                        onValueChange={(roleId) => handleRoleChange(user.id, user.name, roleId)}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap justify-end gap-2">
                        {editing ? (
                          <>
                            <Button size="sm" onClick={() => handleRename(user.id, user.role_id ?? "")}>
                              Kaydet
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                              Vazgeç
                            </Button>
                          </>
                        ) : resettingId === user.id ? (
                          <>
                            <Input
                              type="password"
                              value={resetPassword}
                              onChange={(event) => setResetPassword(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") handleResetPassword(user.id, user.name);
                                if (event.key === "Escape") setResettingId(null);
                              }}
                              placeholder="Yeni şifre"
                              className="w-36"
                              autoFocus
                            />
                            <Button size="sm" onClick={() => handleResetPassword(user.id, user.name)}>
                              Kaydet
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setResettingId(null)}>
                              Vazgeç
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingId(user.id);
                                setEditingName(user.name);
                              }}
                            >
                              Yeniden adlandır
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setResettingId(user.id);
                                setResetPassword("");
                              }}
                            >
                              Şifre sıfırla
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemove(user.id, user.name)}
                              disabled={users.length === 1}
                              title={users.length === 1 ? "En az bir kullanıcı kalmalı" : undefined}
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
      </SectionCard>

      <SectionCard icon={<UserPlus className="size-4" />} title="Kullanıcı ekle">
        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
          <div className="grid min-w-48 flex-1 gap-2">
            <Label htmlFor="new-user">Ad soyad</Label>
            <Input
              id="new-user"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Ad soyad"
              autoComplete="off"
            />
          </div>
          <div className="grid min-w-48 flex-1 gap-2">
            <Label htmlFor="new-user-email">E-posta</Label>
            <Input
              id="new-user-email"
              type="email"
              value={newEmail}
              onChange={(event) => setNewEmail(event.target.value)}
              placeholder="ad@sirket.com"
              autoComplete="off"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-user-password">Şifre</Label>
            <Input
              id="new-user-password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-user-role">Rol</Label>
            <Select value={newRoleId || roles[0]?.id} onValueChange={setNewRoleId}>
              <SelectTrigger id="new-user-role" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit">Kullanıcıyı ekle</Button>
        </form>
      </SectionCard>
    </div>
  );
}
