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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useData } from "@/lib/data";

export default function AdminCompaniesPage() {
  const { loaded, actingUser, companies, users, createCompany, setCompanyActive } = useData();
  const [name, setName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  if (loaded && !actingUser?.is_platform_admin) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Şirketler</h1>
        <p className="text-muted-foreground">Bu ekrana erişim yetkiniz yok.</p>
      </div>
    );
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    const result = await createCompany({
      name,
      admin_name: adminName,
      admin_email: adminEmail,
      admin_password: adminPassword,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`“${name.trim()}” eklendi.`);
    setName("");
    setAdminName("");
    setAdminEmail("");
    setAdminPassword("");
  }

  async function handleToggleActive(companyId: string, isActive: boolean) {
    const result = await setCompanyActive(companyId, isActive);
    if (!result.ok) toast.error(result.error);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Şirketler</h1>
        <p className="text-sm text-muted-foreground">
          Platformdaki her şirket kendi rollerine, siparişlerine ve ayarlarına sahiptir — hiçbiri
          birbirini göremez. Bir şirket pasif yapıldığında o şirketteki kimse giriş yapamaz.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <Card>
          <CardHeader>
            <CardTitle>Şirketler</CardTitle>
            <CardDescription>{loaded ? `${companies.length} şirket` : "Yükleniyor…"}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad</TableHead>
                  <TableHead>Kullanıcı</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="w-32 text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => {
                  const userCount = users.filter((user) => user.company_id === company.id).length;
                  return (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">
                        <span className="flex items-center gap-2">
                          {company.logo_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={company.logo_url}
                              alt=""
                              className="size-6 rounded object-contain"
                            />
                          )}
                          {company.name}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{userCount}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {company.is_active ? "Aktif" : "Pasif"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleActive(company.id, !company.is_active)}
                        >
                          {company.is_active ? "Pasif yap" : "Aktif yap"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Şirket ekle</CardTitle>
            <CardDescription>
              Şirket için varsayılan aşamalar ve sipariş alanları otomatik oluşturulur.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="company-name">Şirket adı</Label>
                <Input
                  id="company-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="admin-name">Yönetici adı</Label>
                <Input
                  id="admin-name"
                  value={adminName}
                  onChange={(event) => setAdminName(event.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="admin-email">Yönetici e-postası</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={adminEmail}
                  onChange={(event) => setAdminEmail(event.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="admin-password">Yönetici şifresi</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={adminPassword}
                  onChange={(event) => setAdminPassword(event.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit">Şirketi ekle</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
