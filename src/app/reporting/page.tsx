"use client";

import Link from "next/link";
import { useMemo } from "react";
import { StageBadge } from "@/components/stage-badge";
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
import { orderTitle } from "@/lib/fields";
import {
  averageTimePerStage,
  countByStage,
  formatDuration,
  overdueOrders,
} from "@/lib/reporting";

export default function ReportingPage() {
  const { loaded, orders, stages, fields, history, settings, can, updateSettings } = useData();

  const counts = useMemo(() => countByStage(orders, stages), [orders, stages]);
  const averages = useMemo(() => averageTimePerStage(stages, history), [history, stages]);
  const overdue = useMemo(
    () => overdueOrders(orders, history, settings.overdue_threshold_days),
    [history, orders, settings.overdue_threshold_days],
  );

  if (loaded && !can("view_reporting")) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Raporlar</h1>
        <p className="text-muted-foreground">Bu ekrana erişim yetkiniz yok.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Raporlar</h1>
        <p className="text-sm text-muted-foreground">
          {loaded ? "Siparişlerinizden ve aşama geçmişinden canlı veriler." : "Yükleniyor…"}
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {counts.map(({ stage, count }) => (
          <Card key={stage.id}>
            <CardHeader>
              <CardDescription>{stage.name}</CardDescription>
              <CardTitle className="text-3xl">{count}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              sipariş bu aşamada
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Aşama başına ortalama süre</CardTitle>
            <CardDescription>
              Siparişlerin çıkmış olduğu aşamalara göre hesaplanır. Siparişin hâlâ beklediği aşama
              henüz sayılmaz.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aşama</TableHead>
                  <TableHead>Ortalama</TableHead>
                  <TableHead className="text-right">Tamamlanan geçiş</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {averages.map(({ stage, averageMs, sampleSize }) => (
                  <TableRow key={stage.id}>
                    <TableCell>
                      <StageBadge stage={stage.name} />
                    </TableCell>
                    <TableCell>{averageMs === null ? "—" : formatDuration(averageMs)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{sampleSize}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Geciken siparişler</CardTitle>
            <CardDescription>
              Bulundukları aşamada eşik süreden uzun bekleyen siparişler.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
