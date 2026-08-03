"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useData } from "@/lib/data";

export default function CompanyPage() {
  const { loaded, can, company, uploadCompanyLogo } = useData();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Şirket</h1>
        <p className="text-sm text-muted-foreground">
          Logo, üst menüde “FactoryPilot” yazısının solunda gösterilir.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{company?.name ?? "Yükleniyor…"}</CardTitle>
          <CardDescription>Şirket logosu</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <div className="flex size-20 items-center justify-center rounded-lg border bg-muted">
            {company?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={company.logo_url} alt="" className="size-full rounded-lg object-contain p-2" />
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
            <Button type="button" variant="outline" disabled={uploading} onClick={() => inputRef.current?.click()}>
              {uploading ? "Yükleniyor…" : "Logo yükle"}
            </Button>
            <p className="text-xs text-muted-foreground">PNG, JPG veya SVG.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
