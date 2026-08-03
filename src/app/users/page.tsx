"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  const { loaded, users, roles, actingUser, can, addUser, updateUser, removeUser } = useData();
  const [newName, setNewName] = useState("");
  const [newRoleId, setNewRoleId] = useState(roles[0]?.id ?? "");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  if (loaded && !can("manage_roles")) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Kullanıcılar</h1>
        <p className="text-muted-foreground">Bu ekrana erişim yetkiniz yok.</p>
      </div>
    );
  }

  function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    const result = addUser({ name: newName, role_id: newRoleId || roles[0]?.id || "" });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`“${newName.trim()}” eklendi.`);
    setNewName("");
  }

  function handleRename(userId: string, roleId: string) {
    const result = updateUser(userId, { name: editingName, role_id: roleId });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setEditingId(null);
    setEditingName("");
  }

  function handleRoleChange(userId: string, name: string, roleId: string) {
    const result = updateUser(userId, { name, role_id: roleId });
    if (!result.ok) toast.error(result.error);
  }

  function handleRemove(userId: string, name: string) {
    const result = removeUser(userId);
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
          Kimlik seçiciden hangi isimlerin seçilebileceğini ve her birinin rolünü belirler.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kullanıcılar</CardTitle>
          <CardDescription>{loaded ? `${users.length} kullanıcı` : "Yükleniyor…"}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="w-56 text-right">İşlemler</TableHead>
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
                            if (event.key === "Enter") handleRename(user.id, user.role_id);
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
                    <TableCell>
                      <Select
                        value={user.role_id}
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
                            <Button size="sm" onClick={() => handleRename(user.id, user.role_id)}>
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
                                setEditingId(user.id);
                                setEditingName(user.name);
                              }}
                            >
                              Yeniden adlandır
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

          <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3 border-t pt-6 mt-6">
            <div className="grid min-w-56 flex-1 gap-2">
              <Label htmlFor="new-user">Kullanıcı ekle</Label>
              <Input
                id="new-user"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="Ad soyad"
                autoComplete="off"
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
        </CardContent>
      </Card>
    </div>
  );
}
