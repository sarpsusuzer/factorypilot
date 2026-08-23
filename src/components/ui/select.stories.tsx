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
          "Radix select. The trigger matches Input's height and border so a form mixing the two " +
          "stays on one baseline. Used for stage pickers, role assignment, and any `select` field " +
          "type on a configured order form.",
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
