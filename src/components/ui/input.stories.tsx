import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Input } from "./input";
import { Label } from "./label";

const meta = {
  title: "UI Kit/Input",
  component: Input,
  parameters: {
    docs: {
      description: {
        component:
          "40px tall by default — the same 28 / 32 / 40 / 50 (`sm` / `md` / `default` / `lg`) " +
          "scale as Button and Select, so a search bar, a dropdown, and a submit button on one " +
          "row line up without anyone having to size them individually. Font-size is 16px below " +
          "the `md` breakpoint and 14px above it — the larger mobile size is what stops iOS " +
          "Safari from zooming the viewport on focus.",
      },
    },
  },
  argTypes: {
    type: { control: "select", options: ["text", "email", "password", "number", "date", "file"] },
    size: { control: "select", options: ["sm", "md", "default", "lg"] },
    disabled: { control: "boolean" },
    placeholder: { control: "text" },
  },
  args: { placeholder: "Müşteri adı", type: "text" },
  decorators: [(Story) => <div className="max-w-sm">{Story()}</div>],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithLabel: Story = {
  render: () => (
    <div className="grid gap-1.5">
      <Label htmlFor="musteri">Müşteri</Label>
      <Input id="musteri" placeholder="Kaya Mağazacılık" />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="s-default">Varsayılan</Label>
        <Input id="s-default" placeholder="Boş" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="s-filled">Dolu</Label>
        <Input id="s-filled" defaultValue="Kaya Mağazacılık" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="s-invalid">Hatalı</Label>
        <Input id="s-invalid" aria-invalid defaultValue="" placeholder="Zorunlu alan" />
        <p className="text-[13px] text-destructive">Bu alan zorunlu.</p>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="s-disabled">Devre dışı</Label>
        <Input id="s-disabled" disabled defaultValue="Değiştirilemez" />
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "`sm` (28) is reserved for an input sitting inline in a table row next to `sm` Buttons " +
          "— see the rename fields on the Stages, Users and Companies screens. `md` (32) is a " +
          "deliberately compact context, like the date-range fields inside the reporting filter " +
          "popover. Everything else — every standalone form field, the order search bar — is " +
          "`default` (40).",
      },
    },
  },
  render: () => (
    <div className="grid max-w-xs gap-3">
      <Input size="sm" placeholder="sm · 28" />
      <Input size="md" placeholder="md · 32" />
      <Input placeholder="default · 40" />
      <Input size="lg" placeholder="lg · 50" />
    </div>
  ),
};

export const Types: Story = {
  render: () => (
    <div className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="t-number">Adet</Label>
        <Input id="t-number" type="number" defaultValue={250} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="t-date">Termin tarihi</Label>
        <Input id="t-date" type="date" defaultValue="2026-09-15" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="t-password">Şifre</Label>
        <Input id="t-password" type="password" defaultValue="parola" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="t-file">Teknik çizim</Label>
        <Input id="t-file" type="file" />
      </div>
    </div>
  ),
};
