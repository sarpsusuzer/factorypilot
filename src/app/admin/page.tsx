"use client";

import { Building2, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SectionCard } from "@/components/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { cn } from "@/lib/utils";
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
    deleteCompany,
  } = useData();
  const [name, setName] = useState("");
  const [companyType, setNewCompanyType] = useState<CompanyType>("uretici");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  async function handleDelete() {
    if (!deletingCompany) return;
    setDeleting(true);
    const result = await deleteCompany(deletingCompany.id);
    setDeleting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`“${deletingCompany.name}” silindi.`);
    setDeletingCompany(null);
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
          contentFramed
        >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">Ad</TableHead>
                  <TableHead>Tür</TableHead>
                  <TableHead>Kullanıcı</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="w-16 text-right">İşlemler</TableHead>
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
                            size="sm"
                            value={editingName}
                            onChange={(event) => setEditingName(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") handleRename(company.id);
                              if (event.key === "Escape") setEditingId(null);
                            }}
                            autoFocus
                          />
                        ) : (
                          <span className="flex min-w-0 items-center gap-2">
                            {company.logo_url && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={company.logo_url}
                                alt=""
                                className="size-6 shrink-0 rounded object-contain"
                              />
                            )}
                            <span className="max-w-[160px] truncate" title={company.name}>
                              {company.name}
                            </span>
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
                      <TableCell>
                        <Badge
                          className={cn(
                            "gap-1.5 font-medium",
                            company.is_active
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-700",
                          )}
                        >
                          <span
                            className={cn(
                              "size-1.5 shrink-0 rounded-full",
                              company.is_active ? "bg-emerald-500" : "bg-slate-500",
                            )}
                          />
                          {company.is_active ? "Aktif" : "Pasif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {editing ? (
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button size="sm" onClick={() => handleRename(company.id)}>
                              Kaydet
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                              Vazgeç
                            </Button>
                          </div>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                aria-label={`${company.name} işlemleri`}
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onSelect={() => {
                                  setEditingId(company.id);
                                  setEditingName(company.name);
                                }}
                              >
                                Düzenle
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => handleToggleActive(company.id, !company.is_active)}
                              >
                                {company.is_active ? "Pasif yap" : "Aktif yap"}
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => openAdminEdit(company)}>
                                Yönetici
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => setDeletingCompany(company)}
                              >
                                <Trash2 className="size-4" />
                                Sil
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
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
          contentFramed
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

      <Dialog
        open={deletingCompany !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingCompany(null);
        }}
      >
        <DialogContent showCloseButton={false} onInteractOutside={(event) => event.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{deletingCompany?.name} silinsin mi?</DialogTitle>
            <DialogDescription>
              Şirket ve verileri (siparişler, geçmiş) veritabanında kalır, ancak şirket kimse giriş
              yapamayacak şekilde pasif hale gelir ve bu listeden kalıcı olarak kaybolur. Bu işlem
              buradan geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeletingCompany(null)}>
              Vazgeç
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Siliniyor…" : "Şirketi sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
