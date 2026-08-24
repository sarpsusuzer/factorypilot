import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Label } from "./label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./select";

const meta = {
  title: "UI Kit/Select",
  component: Select,
  parameters: {
    docs: {
      description: {
        component:
          "Radix select. The trigger's `size` prop is the same 28 / 32 / 40 / 50 scale as Button " +
          "and Input, `default` is 40 — every bare `<SelectTrigger>` gets it, including every " +
          "dropdown in the app, so a select sitting next to a search bar or a submit button " +
          "lines up without anyone sizing it by hand. Used for stage pickers, role assignment, " +
          "and any `select` field type on a configured order form.",
      },
    },
  },
  decorators: [(Story) => <div className="max-w-sm">{Story()}</div>],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="grid gap-1.5">
      <Label htmlFor="model">Model</Label>
      <Select defaultValue="bisiklet">
        <SelectTrigger id="model">
          <SelectValue placeholder="Model seçin" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="bisiklet">Bisiklet yaka</SelectItem>
          <SelectItem value="v">V yaka</SelectItem>
          <SelectItem value="polo">Polo</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const Placeholder: Story = {
  render: () => (
    <div className="grid gap-1.5">
      <Label htmlFor="model-empty">Model</Label>
      <Select>
        <SelectTrigger id="model-empty">
          <SelectValue placeholder="Model seçin" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="bisiklet">Bisiklet yaka</SelectItem>
          <SelectItem value="v">V yaka</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const Grouped: Story = {
  render: () => (
    <div className="grid gap-1.5">
      <Label htmlFor="rol">Rol</Label>
      <Select defaultValue="uretim">
        <SelectTrigger id="rol">
          <SelectValue placeholder="Rol seçin" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Yönetim</SelectLabel>
            <SelectItem value="yonetici">Yönetici</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Operasyon</SelectLabel>
            <SelectItem value="uretim">Üretim</SelectItem>
            <SelectItem value="satis">Satış</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="grid gap-3">
      {(["sm", "md", "default", "lg"] as const).map((size) => (
        <Select key={size} defaultValue="bisiklet">
          <SelectTrigger size={size === "default" ? undefined : size}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bisiklet">
              {size} · {{ sm: 28, md: 32, default: 40, lg: 50 }[size]}
            </SelectItem>
          </SelectContent>
        </Select>
      ))}
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="sel-invalid">Hatalı</Label>
        <Select>
          <SelectTrigger id="sel-invalid" aria-invalid>
            <SelectValue placeholder="Zorunlu alan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Bisiklet yaka</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="sel-disabled">Devre dışı</Label>
        <Select defaultValue="a" disabled>
          <SelectTrigger id="sel-disabled">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Bisiklet yaka</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  ),
};
