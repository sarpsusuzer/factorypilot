"use client";

import { Building2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SectionCard } from "@/components/section-card";
import { Button } from "@/components/ui/button";
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
import type { Company, CompanyType } from "@/lib/types";

const COMPANY_TYPE_LABELS: Record<CompanyType, string> = {
  uretici: "Üretici",
  musteri: "Müşteri",
};

export default function AdminCompaniesPage() {
  const {
    loaded,
    actingUser,
    companies,
    users,
    roles,
    createCompany,
    renameCompany,
    setCompanyActive,
    setCompanyType,
    updateCompanyAdmin,
  } = useData();
  const [name, setName] = useState("");
  const [companyType, setNewCompanyType] = useState<CompanyType>("uretici");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const [editingAdminFor, setEditingAdminFor] = useState<Company | null>(null);
  const [adminEditName, setAdminEditName] = useState("");
  const [adminEditEmail, setAdminEditEmail] = useState("");
  const [adminEditPassword, setAdminEditPassword] = useState("");

  function adminUserFor(company: Company) {
    const role = roles.find((r) => r.company_id === company.id && r.is_protected);
    return users.find((u) => u.company_id === company.id && u.role_id === role?.id);
  }

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
      company_type: companyType,
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
    setNewCompanyType("uretici");
    setAdminName("");
    setAdminEmail("");
    setAdminPassword("");
  }

  async function handleToggleActive(companyId: string, isActive: boolean) {
    const result = await setCompanyActive(companyId, isActive);
    if (!result.ok) toast.error(result.error);
  }

  async function handleTypeChange(companyId: string, type: CompanyType) {
    const result = await setCompanyType(companyId, type);
    if (!result.ok) toast.error(result.error);
  }

  async function handleRename(companyId: string) {
    const result = await renameCompany(companyId, editingName);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setEditingId(null);
    setEditingName("");
  }

  function openAdminEdit(company: Company) {
    const admin = adminUserFor(company);
    if (!admin) {
      toast.error("Bu şirket için yönetici bulunamadı.");
      return;
    }
    setEditingAdminFor(company);
    setAdminEditName(admin.name);
    setAdminEditEmail(admin.email);
    setAdminEditPassword("");
  }

  async function handleSaveAdminEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!editingAdminFor) return;
    const admin = adminUserFor(editingAdminFor);
    if (!admin) return;

    const result = await updateCompanyAdmin(admin.id, {
      name: adminEditName,
      email: adminEditEmail,
      password: adminEditPassword || undefined,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Yönetici bilgileri güncellendi.");
    setEditingAdminFor(null);
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

      <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <SectionCard
          icon={<Building2 className="size-4" />}
          title="Şirketler"
          description={loaded ? `${companies.length} şirket` : "Yükleniyor…"}
        >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad</TableHead>
                  <TableHead>Tür</TableHead>
                  <TableHead>Kullanıcı</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="w-80 text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => {
                  const userCount = users.filter((user) => user.company_id === company.id).length;
                  const editing = editingId === company.id;
                  return (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">
                        {editing ? (
                          <Input
                            value={editingName}
                            onChange={(event) => setEditingName(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") handleRename(company.id);
                              if (event.key === "Escape") setEditingId(null);
                            }}
                            autoFocus
                          />
                        ) : (
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
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={company.company_type}
                          onValueChange={(value) => handleTypeChange(company.id, value as CompanyType)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(COMPANY_TYPE_LABELS) as CompanyType[]).map((type) => (
                              <SelectItem key={type} value={type}>
                                {COMPANY_TYPE_LABELS[type]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{userCount}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {company.is_active ? "Aktif" : "Pasif"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          {editing ? (
                            <>
                              <Button size="sm" onClick={() => handleRename(company.id)}>
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
                                  setEditingId(company.id);
                                  setEditingName(company.name);
                                }}
                              >
                                Düzenle
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleActive(company.id, !company.is_active)}
                              >
                                {company.is_active ? "Pasif yap" : "Aktif yap"}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => openAdminEdit(company)}>
                                Yönetici
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

        <SectionCard
          icon={<Plus className="size-4" />}
          title="Şirket ekle"
          description="Şirket için varsayılan aşamalar ve sipariş alanları otomatik oluşturulur."
        >
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
                <Label htmlFor="company-type">Şirket türü</Label>
                <Select value={companyType} onValueChange={(value) => setNewCompanyType(value as CompanyType)}>
                  <SelectTrigger id="company-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(COMPANY_TYPE_LABELS) as CompanyType[]).map((type) => (
                      <SelectItem key={type} value={type}>
                        {COMPANY_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
        </SectionCard>
      </div>

      <Dialog
        open={editingAdminFor !== null}
        onOpenChange={(open) => {
          if (!open) setEditingAdminFor(null);
        }}
      >
        <DialogContent>
          <form onSubmit={handleSaveAdminEdit}>
            <DialogHeader>
              <DialogTitle>{editingAdminFor?.name} — Yönetici</DialogTitle>
              <DialogDescription>
                Şifreyi boş bırakmak mevcut şifreyi korur.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-6">
              <div className="grid gap-2">
                <Label htmlFor="admin-edit-name">Yönetici adı</Label>
                <Input
                  id="admin-edit-name"
                  value={adminEditName}
                  onChange={(event) => setAdminEditName(event.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="admin-edit-email">Yönetici e-postası</Label>
                <Input
                  id="admin-edit-email"
                  type="email"
                  value={adminEditEmail}
                  onChange={(event) => setAdminEditEmail(event.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="admin-edit-password">Yeni şifre</Label>
                <Input
                  id="admin-edit-password"
                  type="password"
                  value={adminEditPassword}
                  onChange={(event) => setAdminEditPassword(event.target.value)}
                  placeholder="Değiştirmemek için boş bırakın"
                  autoComplete="new-password"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingAdminFor(null)}>
                Vazgeç
              </Button>
              <Button type="submit">Kaydet</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
