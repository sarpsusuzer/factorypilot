import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Checkbox } from "./checkbox";
import { Input } from "./input";
import { Label } from "./label";
import { Separator } from "./separator";

const meta: Meta = {
  title: "UI Kit/Label & Separator",
  parameters: {
    docs: {
      description: {
        component:
          "Two small primitives that mostly disappear into other components. Label dims itself " +
          "automatically when the control it points at is disabled — via `peer-disabled`, so " +
          "there is no `disabled` prop to keep in sync. Separator is a 1px `bg-border` rule that " +
          "picks its own axis from `orientation`.",
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Labels: Story = {
  render: () => (
    <div className="grid max-w-sm gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="l-1">Müşteri</Label>
        <Input id="l-1" placeholder="Kaya Mağazacılık" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="l-2">
          Termin tarihi
          <span className="text-muted-foreground">(zorunlu)</span>
        </Label>
        <Input id="l-2" type="date" defaultValue="2026-09-15" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="l-3">Devre dışı alan</Label>
        <Input id="l-3" className="peer" disabled defaultValue="Değiştirilemez" />
      </div>
      <div className="flex items-center gap-2.5">
        <Checkbox id="l-4" defaultChecked />
        <Label htmlFor="l-4" className="font-normal">
          Sadece geciken siparişleri göster
        </Label>
      </div>
    </div>
  ),
};

export const Separators: Story = {
  render: () => (
    <div className="max-w-md space-y-6">
      <div>
        <p className="pb-3 text-sm text-muted-foreground">Yatay</p>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-foreground">Sipariş bilgileri</p>
          <Separator className="my-3" />
          <p className="text-sm text-foreground">Aşama geçmişi</p>
          <Separator className="my-3" />
          <p className="text-sm text-foreground">Ekler</p>
        </div>
      </div>
      <div>
        <p className="pb-3 text-sm text-muted-foreground">Dikey</p>
        <div className="flex h-8 items-center gap-3 rounded-xl border border-border bg-card px-4">
          <span className="text-sm tabular-nums">8 sipariş</span>
          <Separator orientation="vertical" />
          <span className="text-sm tabular-nums">2 geciken</span>
          <Separator orientation="vertical" />
          <span className="text-sm tabular-nums">%64 tamamlandı</span>
        </div>
      </div>
    </div>
  ),
};
