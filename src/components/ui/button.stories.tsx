import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArrowRight, Check, Plus, Trash2 } from "lucide-react";
import { Button } from "./button";

const meta = {
  title: "UI Kit/Button",
  component: Button,
  parameters: {
    docs: {
      description: {
        component:
          "Six variants on a fixed 28 / 32 / 40 / 50 height scale (`sm` / `md` / `default` / `lg`), " +
          "shared with Input and Select — `default` is 40 and is what every bare `<Button>` gets " +
          "unless a size is stated. Hover and active states are both a fill-colour step **and** a " +
          "1px downward nudge on press, so pressed reads as pressed rather than a flat colour swap " +
          "— consistent with the no-shadow rule (no drop shadow does the lifting instead). Buttons " +
          "that open a menu (`aria-haspopup`) skip the nudge, since the menu appearing is already " +
          "the feedback.",
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outline", "secondary", "ghost", "destructive", "link"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "default", "lg", "icon-sm", "icon-md", "icon", "icon-lg"],
    },
    disabled: { control: "boolean" },
    children: { control: "text" },
  },
  args: { children: "Sipariş oluştur", variant: "default", size: "default" },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "`default` is the single primary action per screen. `outline` sits on the page, " +
          "`secondary` sits on a card — they differ only in whether they carry a border. " +
          "`destructive` is reserved for actions that cannot be undone.",
      },
    },
  },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Kaydet</Button>
      <Button variant="outline">İptal</Button>
      <Button variant="secondary">Kopyala</Button>
      <Button variant="ghost">Vazgeç</Button>
      <Button variant="destructive">Sil</Button>
      <Button variant="link">Tümünü gör</Button>
    </div>
  ),
};

export const Sizes: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "28 · 32 · 40 · 50. `default` (40) is unlabeled here on purpose — it's what you get by " +
          "just not passing a `size` prop, same as every other bare `<Button>` in the app.",
      },
    },
  },
  render: () => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <Button size="sm">sm · 28</Button>
        <Button size="md">md · 32</Button>
        <Button>default · 40</Button>
        <Button size="lg">lg · 50</Button>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <Button size="icon-sm" aria-label="Ekle">
          <Plus />
        </Button>
        <Button size="icon-md" aria-label="Ekle">
          <Plus />
        </Button>
        <Button size="icon" aria-label="Ekle">
          <Plus />
        </Button>
        <Button size="icon-lg" aria-label="Ekle">
          <Plus />
        </Button>
      </div>
    </div>
  ),
};

export const HoverAndPressed: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Every variant carries three distinct states — rest, hover, active — so a press is " +
          "unambiguous. `default` and `destructive` step through their own colour family (getting " +
          "lighter on hover, lighter still on press, since darkening an already near-black fill is " +
          "barely visible); the light-surface variants (`outline`, `secondary`, `ghost`) hover to " +
          "`--accent` and press to the darker `--border` token, reusing existing design tokens " +
          "instead of inventing new ones. Focus this story and Tab through the buttons to see the " +
          "focus ring, or click and hold to see the press state.",
      },
    },
  },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Default</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

export const WithIcons: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Mark the icon with `data-icon=\"inline-start\"` or `\"inline-end\"` and the button " +
          "tightens the padding on that side, so an icon does not read as extra whitespace.",
      },
    },
  },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>
        <Plus data-icon="inline-start" />
        Yeni sipariş
      </Button>
      <Button variant="outline">
        Devam et
        <ArrowRight data-icon="inline-end" />
      </Button>
      <Button variant="secondary">
        <Check data-icon="inline-start" />
        Onayla
      </Button>
      <Button variant="destructive">
        <Trash2 data-icon="inline-start" />
        Siparişi sil
      </Button>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button disabled>Kaydet</Button>
      <Button variant="outline" disabled>
        İptal
      </Button>
      <Button variant="secondary" disabled>
        Kopyala
      </Button>
      <Button variant="destructive" disabled>
        Sil
      </Button>
    </div>
  ),
};

export const Invalid: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "`aria-invalid` drives the error ring on every control in the kit, buttons included — " +
          "no separate `error` prop to keep in sync.",
      },
    },
  },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button aria-invalid>Kaydet</Button>
      <Button variant="outline" aria-invalid>
        İptal
      </Button>
    </div>
  ),
};
