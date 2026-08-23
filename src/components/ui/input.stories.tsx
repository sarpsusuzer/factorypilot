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
          "32px tall to line up with the default Button. Font-size is 16px below the `md` " +
          "breakpoint and 14px above it — the larger mobile size is what stops iOS Safari from " +
          "zooming the viewport on focus.",
      },
    },
  },
  argTypes: {
    type: { control: "select", options: ["text", "email", "password", "number", "date", "file"] },
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
