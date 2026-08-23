import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StatCard } from "./stat-card";

const meta = {
  title: "Patterns/StatCard",
  component: StatCard,
  parameters: {
    docs: {
      description: {
        component:
          "One KPI, always in its own bordered card. Summary numbers deliberately never share a " +
          "single outer Card with dividers between them — that reads as one metric with " +
          "footnotes rather than several independent stats.\n\n" +
          "Note the surface inversion: the card is `bg-background` and the value block inside it " +
          "is `bg-card`, the opposite of every other panel. It makes the number itself the raised " +
          "element rather than the container.",
      },
    },
  },
  argTypes: {
    label: { control: "text" },
    value: { control: "text" },
    tooltip: { control: "text" },
    caption: { control: "text" },
  },
  args: { label: "Açık siparişler", value: "6" },
  decorators: [(Story) => <div className="max-w-56">{Story()}</div>],
} satisfies Meta<typeof StatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Anatomy: Story = {
  decorators: [(Story) => <div className="max-w-4xl">{Story()}</div>],
  render: () => (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Açık siparişler" value="6" />
      <StatCard
        label="Geciken"
        value="2"
        tooltip="Bulunduğu aşamada eşik süreden uzun bekleyen siparişler."
      />
      <StatCard label="Bu ay üretilen" value="1.248" caption="Geçen ay 1.104 adet" />
      <StatCard
        label="Ortalama süre"
        value="4,2 gün"
        trend={{ direction: "up", label: "%12" }}
        caption="Alındı'dan sevkiyata"
      />
    </div>
  ),
};

export const WithTrend: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Up is the emphasis blue, down is muted grey — the pair is intentionally not " +
          "green/red, because in this product a rising number is not automatically good " +
          "(rising average stage time is bad). Colour marks direction, the label carries meaning.",
      },
    },
  },
  decorators: [(Story) => <div className="max-w-2xl">{Story()}</div>],
  render: () => (
    <div className="grid gap-3 sm:grid-cols-2">
      <StatCard label="Bu ay üretilen" value="1.248" trend={{ direction: "up", label: "%13" }} />
      <StatCard label="Ortalama süre" value="4,2 gün" trend={{ direction: "down", label: "%8" }} />
    </div>
  ),
};

export const LongValues: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "The label and the caption share one row and both truncate independently, which keeps " +
          "a row of cards on one baseline no matter how long either string runs. The value never " +
          "truncates — a clipped number is worse than a taller card.",
      },
    },
  },
  decorators: [(Story) => <div className="max-w-2xl">{Story()}</div>],
  render: () => (
    <div className="grid gap-3 sm:grid-cols-3">
      <StatCard label="Bu çeyrekte üretilen toplam adet sayısı" value="128.480" />
      <StatCard label="Kısa" value="3" />
      <StatCard
        label="Ortalama"
        value="12,8 gün"
        caption="Bu satır etikete komşu hücrede kırpılır."
      />
    </div>
  ),
};

export const Zero: Story = {
  decorators: [(Story) => <div className="max-w-2xl">{Story()}</div>],
  render: () => (
    <div className="grid gap-3 sm:grid-cols-3">
      <StatCard label="Geciken" value="0" caption="Hiçbir sipariş eşiği aşmadı" />
      <StatCard label="Açık siparişler" value="0" />
      <StatCard label="Bu ay üretilen" value="—" caption="Henüz veri yok" />
    </div>
  ),
};
