"use client";

import { Check, ChevronDown } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { STAGE_COLORS, stageColorDot } from "@/lib/stage-colors";
import type { StageColor } from "@/lib/types";

export default function StagesPage() {
  const {
    loaded,
    stages,
    orders,
    can,
    addStage,
    renameStage,
    removeStage,
    moveStage,
    setStageColor,
  } = useData();
  const [newStage, setNewStage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  if (loaded && !can("manage_stages")) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Aşama ayarları</h1>
        <p className="text-muted-foreground">Bu ekrana erişim yetkiniz yok.</p>
      </div>
    );
  }

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    const result = await addStage(newStage);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`“${newStage.trim()}” eklendi.`);
    setNewStage("");
  }

  async function handleRename(stageId: string) {
    const result = await renameStage(stageId, editingName);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Aşama yeniden adlandırıldı. Mevcut siparişler ve geçmiş güncellendi.");
    setEditingId(null);
    setEditingName("");
  }

  async function handleRemove(stageId: string) {
    const result = await removeStage(stageId);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Aşama silindi.");
  }

  async function handleColor(stageId: string, color: StageColor) {
    const result = await setStageColor(stageId, color);
    if (!result.ok) {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Aşama ayarları</h1>
        <p className="text-sm text-muted-foreground">
          Bu listenin sırası yalnızca görüntüleme sırasıdır — siparişler her an herhangi bir
          aşamaya taşınabilir.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aşamalar</CardTitle>
          <CardDescription>
            {loaded ? `${stages.length} aşama` : "Yükleniyor…"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Ad</TableHead>
                <TableHead className="w-40">Renk</TableHead>
                <TableHead className="w-32">Sipariş sayısı</TableHead>
                <TableHead className="w-72 text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stages.map((stage, index) => {
                const inStage = orders.filter((order) => order.current_stage === stage.name).length;
                const editing = editingId === stage.id;

                return (
                  <TableRow key={stage.id}>
                    <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                    <TableCell>
                      {editing ? (
                        <Input
                          value={editingName}
                          onChange={(event) => setEditingName(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") handleRename(stage.id);
                            if (event.key === "Escape") setEditingId(null);
                          }}
                          autoFocus
                        />
                      ) : (
                        <span className="font-medium">{stage.name}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2">
                            <span className={`size-3 rounded-full ${stageColorDot(stage.color)}`} />
                            {STAGE_COLORS.find((swatch) => swatch.key === stage.color)?.label}
                            <ChevronDown className="size-3.5 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {STAGE_COLORS.map((swatch) => (
                            <DropdownMenuItem
                              key={swatch.key}
                              onClick={() => handleColor(stage.id, swatch.key)}
                            >
                              <span className={`size-3 rounded-full ${swatch.dot}`} />
                              {swatch.label}
                              {swatch.key === stage.color && (
                                <Check className="ml-auto size-3.5" />
                              )}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{inStage}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap justify-end gap-2">
                        {editing ? (
                          <>
                            <Button size="sm" onClick={() => handleRename(stage.id)}>
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
                              onClick={() => moveStage(stage.id, "up")}
                              disabled={index === 0}
                            >
                              ↑
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => moveStage(stage.id, "down")}
                              disabled={index === stages.length - 1}
                            >
                              ↓
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingId(stage.id);
                                setEditingName(stage.name);
                              }}
                            >
                              Yeniden adlandır
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleRemove(stage.id)}>
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

          <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3 border-t pt-6">
            <div className="grid min-w-64 flex-1 gap-2">
              <Label htmlFor="new-stage">Aşama ekle</Label>
              <Input
                id="new-stage"
                value={newStage}
                onChange={(event) => setNewStage(event.target.value)}
                placeholder="örn. Paketleme"
                autoComplete="off"
              />
            </div>
            <Button type="submit">Aşamayı ekle</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
