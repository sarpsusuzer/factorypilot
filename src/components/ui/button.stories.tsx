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
          "Six variants across nine sizes. The press affordance is a 1px downward nudge rather " +
          "than a shadow or scale — consistent with the no-shadow rule. Buttons that open a menu " +
          "(`aria-haspopup`) skip the nudge, since the menu appearing is already the feedback.",
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
      options: ["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"],
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
  render: () => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button size="xs">xs</Button>
        <Button size="sm">sm</Button>
        <Button size="default">default</Button>
        <Button size="lg">lg</Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="icon-xs" aria-label="Ekle">
          <Plus />
        </Button>
        <Button size="icon-sm" aria-label="Ekle">
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
