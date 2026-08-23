"use client";

import { Users2 } from "lucide-react";
import { toast } from "sonner";
import { SectionCard } from "@/components/section-card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useData } from "@/lib/data";

export default function AdminUsersPage() {
  const { loaded, actingUser, users, companies, roles, setUserActive } = useData();

  if (loaded && !actingUser?.is_platform_admin) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Kullanıcılar</h1>
        <p className="text-muted-foreground">Bu ekrana erişim yetkiniz yok.</p>
      </div>
    );
  }

  async function handleToggleActive(userId: string, isActive: boolean) {
    const result = await setUserActive(userId, isActive);
    if (!result.ok) toast.error(result.error);
  }

  // Platform admins have no company of their own, so they don't belong here.
  const companyUsers = users.filter((user) => !user.is_platform_admin);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Kullanıcılar</h1>
        <p className="text-sm text-muted-foreground">
          Platformdaki tüm şirketlerin kullanıcıları. Pasif yapılan bir kullanıcı giriş yapamaz.
        </p>
      </div>

      <SectionCard
        icon={<Users2 className="size-4" />}
        title="Kullanıcılar"
        description={loaded ? `${companyUsers.length} kullanıcı` : "Yükleniyor…"}
      >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad</TableHead>
                <TableHead>E-posta</TableHead>
                <TableHead>Şirket</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="w-32 text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companyUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {companies.find((c) => c.id === user.company_id)?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {roles.find((r) => r.id === user.role_id)?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.is_active ? "Aktif" : "Pasif"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleActive(user.id, !user.is_active)}
                    >
                      {user.is_active ? "Pasif yap" : "Aktif yap"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
      </SectionCard>
    </div>
  );
}
