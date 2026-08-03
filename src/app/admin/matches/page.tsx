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

export default function AdminMatchesPage() {
  const { loaded, actingUser, companies, companyMatches, addCompanyMatch, removeCompanyMatch } =
    useData();
  const [ureticiId, setUreticiId] = useState("");
  const [musteriId, setMusteriId] = useState("");

  const ureticiCompanies = companies.filter((c) => c.company_type === "uretici");
  const musteriCompanies = companies.filter((c) => c.company_type === "musteri");
  const companyName = (id: string) => companies.find((c) => c.id === id)?.name ?? "—";

  if (loaded && !actingUser?.is_platform_admin) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Üretici-Müşteri Eşleştirme</h1>
        <p className="text-muted-foreground">Bu ekrana erişim yetkiniz yok.</p>
      </div>
    );
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!ureticiId || !musteriId) {
      toast.error("Bir üretici ve bir müşteri seçin.");
      return;
    }
    const result = await addCompanyMatch(musteriId, ureticiId);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`“${companyName(musteriId)}” — “${companyName(ureticiId)}” eşleştirildi.`);
    setMusteriId("");
  }

  async function handleRemove(matchId: string) {
    const result = await removeCompanyMatch(matchId);
    if (!result.ok) toast.error(result.error);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Üretici-Müşteri Eşleştirme</h1>
        <p className="text-sm text-muted-foreground">
          Eşleştirilen bir müşteri, o üretici için sipariş oluşturabilir ve o üreticinin sipariş
          alanlarını kullanır. Sipariş yalnızca eşleştirilen üretici ve siparişi oluşturan müşteri
          tarafından görülür.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <Card>
          <CardHeader>
            <CardTitle>Eşleştirmeler</CardTitle>
            <CardDescription>
              {loaded ? `${companyMatches.length} eşleştirme` : "Yükleniyor…"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Üretici</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead className="w-32 text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companyMatches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                      Henüz bir eşleştirme yok — sağdan ilkini ekleyin.
                    </TableCell>
                  </TableRow>
                ) : (
                  companyMatches.map((match) => (
                    <TableRow key={match.id}>
                      <TableCell className="font-medium">
                        {companyName(match.uretici_company_id)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {companyName(match.musteri_company_id)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => handleRemove(match.id)}>
                          Kaldır
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Eşleştirme ekle</CardTitle>
            <CardDescription>Bir üretici ve bir müşteri seçin.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="match-uretici">Üretici</Label>
                <Select value={ureticiId} onValueChange={setUreticiId}>
                  <SelectTrigger id="match-uretici" className="w-full">
                    <SelectValue placeholder="Bir üretici seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {ureticiCompanies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="match-musteri">Müşteri</Label>
                <Select value={musteriId} onValueChange={setMusteriId}>
                  <SelectTrigger id="match-musteri" className="w-full">
                    <SelectValue placeholder="Bir müşteri seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {musteriCompanies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit">Eşleştirme ekle</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
