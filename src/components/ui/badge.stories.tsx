import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AlertTriangle, Check, Clock } from "lucide-react";
import { Badge } from "./badge";

const meta = {
  title: "UI Kit/Badge",
  component: Badge,
  parameters: {
    docs: {
      description: {
        component:
          "A fixed-height (20px) pill for status and counts. Fully rounded via `--radius-4xl`. " +
          "For anything representing an order's stage, use `StageBadge` instead — it pulls the " +
          "colour from the stage's own configured swatch.",
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "destructive", "outline", "ghost", "link"],
    },
    children: { control: "text" },
  },
  args: { children: "Yeni", variant: "default" },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge>default</Badge>
      <Badge variant="secondary">secondary</Badge>
      <Badge variant="outline">outline</Badge>
      <Badge variant="destructive">destructive</Badge>
      <Badge variant="ghost">ghost</Badge>
      <Badge variant="link">link</Badge>
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="secondary">
        <Clock data-icon="inline-start" />
        Bekliyor
      </Badge>
      <Badge>
        <Check data-icon="inline-start" />
        Tamamlandı
      </Badge>
      <Badge variant="destructive">
        <AlertTriangle data-icon="inline-start" />
        Geciken
      </Badge>
    </div>
  ),
};

export const WithDot: Story = {
  parameters: {
    docs: {
      description: {
        story: "The dot-plus-label shape StageBadge builds on — a 6px filled circle before the text.",
      },
    },
  },
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge className="gap-1.5 bg-emerald-100 font-medium text-emerald-700">
        <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
        Aktif
      </Badge>
      <Badge className="gap-1.5 bg-slate-100 font-medium text-slate-700">
        <span className="size-1.5 shrink-0 rounded-full bg-slate-500" />
        Pasif
      </Badge>
    </div>
  ),
};

export const Counts: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="secondary" className="tabular-nums">
        4
      </Badge>
      <Badge variant="secondary" className="tabular-nums">
        12
      </Badge>
      <Badge variant="secondary" className="tabular-nums">
        248
      </Badge>
      <Badge className="tabular-nums">99+</Badge>
    </div>
  ),
};
