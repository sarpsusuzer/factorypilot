"use client";

import { Clock, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { FieldsManager } from "@/components/fields-manager";
import { SectionCard } from "@/components/section-card";
import { StageBadge } from "@/components/stage-badge";
import { StagesManager } from "@/components/stages-manager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useData } from "@/lib/data";
import { orderTitle } from "@/lib/fields";
import { exceededBy, formatDuration, overdueOrders } from "@/lib/reporting";

const TABS = ["genel", "fields", "stages"] as const;
type Tab = (typeof TABS)[number];

export default function CompanyPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Yükleniyor…</p>}>
      <CompanyPageContent />
    </Suspense>
  );
}

function CompanyPageContent() {
  const {
    loaded,
    can,
    company,
    uploadCompanyLogo,
    orders,
    fields,
    history,
    settings,
    updateSettings,
  } = useData();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const initialTab: Tab = TABS.includes(requestedTab as Tab) ? (requestedTab as Tab) : "genel";
  const [tab, setTab] = useState<Tab>(initialTab);

  const overdue = useMemo(
    () => overdueOrders(orders, history, settings.overdue_threshold_days),
    [history, orders, settings.overdue_threshold_days],
  );

  if (loaded && !can("manage_company")) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Şirket</h1>
        <p className="text-muted-foreground">Bu ekrana erişim yetkiniz yok.</p>
      </div>
    );
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !company) return;

    setUploading(true);
    const result = await uploadCompanyLogo(company.id, file);
    setUploading(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Logo güncellendi.");
    if (inputRef.current) inputRef.current.value = "";
  }

  const canManageFields = can("manage_fields");
  const canManageStages = can("manage_stages");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Şirket</h1>
        <p className="text-sm text-muted-foreground">
          Logo, üst menüde “FactoryPilot” yazısının solunda gösterilir.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
        <TabsList>
          <TabsTrigger value="genel">Genel</TabsTrigger>
          {canManageFields && <TabsTrigger value="fields">Sipariş alanları</TabsTrigger>}
          {canManageStages && <TabsTrigger value="stages">Aşama ayarları</TabsTrigger>}
        </TabsList>

        <TabsContent value="genel" className="space-y-6">
          <SectionCard
            icon={<ImageIcon className="size-4" />}
            title={company?.name ?? "Yükleniyor…"}
            description="Şirket logosu"
          >
            <div className="flex items-center gap-6">
              <div className="flex size-20 items-center justify-center rounded-md border border-border bg-background">
                {company?.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={company.logo_url}
                    alt=""
                    className="size-full rounded-md object-contain p-2"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">Logo yok</span>
                )}
              </div>
              <div className="space-y-2">
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  onClick={() => inputRef.current?.click()}
                >
                  {uploading ? "Yükleniyor…" : "Logo yükle"}
                </Button>
                <p className="text-xs text-muted-foreground">PNG, JPG veya SVG.</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon={<Clock className="size-4" />}
            title="Geciken siparişler"
            description="Bulundukları aşamada eşik süreden uzun bekleyen siparişler."
          >
            <div className="space-y-4">
              <div className="grid max-w-64 gap-2">
                <Label htmlFor="threshold">Kaç gün sonra gecikmiş sayılsın</Label>
                <Input
                  id="threshold"
                  type="number"
                  min={0}
                  step={0.5}
                  value={settings.overdue_threshold_days}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    if (Number.isFinite(value) && value >= 0) {
                      updateSettings({ overdue_threshold_days: value });
                    }
                  }}
                />
              </div>

              {overdue.length === 0 ? (
                <p className="text-sm text-muted-foreground">Şu anda geciken sipariş yok.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sipariş</TableHead>
                      <TableHead>Aşama</TableHead>
                      <TableHead className="text-right">Bekleme</TableHead>
                      <TableHead className="text-right">Eşiği aşan süre</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overdue.map(({ order, elapsedMs }) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <Link href={`/orders/${order.id}`} className="font-medium hover:underline">
                            {orderTitle(order, fields)}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <StageBadge stage={order.current_stage} />
                        </TableCell>
                        <TableCell className="text-right">{formatDuration(elapsedMs)}</TableCell>
                        <TableCell className="text-right text-destructive">
                          +{formatDuration(exceededBy(elapsedMs, settings.overdue_threshold_days))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </SectionCard>
        </TabsContent>

        {canManageFields && (
          <TabsContent value="fields">
            <FieldsManager />
          </TabsContent>
        )}

        {canManageStages && (
          <TabsContent value="stages">
            <StagesManager />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
