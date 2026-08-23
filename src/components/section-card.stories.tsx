import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Package, TrendingUp, Users } from "lucide-react";
import { Button } from "./ui/button";
import { ListRow } from "./list-row";
import { SectionCard } from "./section-card";

const meta = {
  title: "Patterns/SectionCard",
  component: SectionCard,
  parameters: {
    docs: {
      description: {
        component:
          "The dashboard's panel. Distinct from the generic `Card`: it has an opinionated header " +
          "(optional icon, a title at 15px/600, an optional right-hand affordance) and its body " +
          "is a tight `space-y-0.5` stack meant to hold `ListRow`s.\n\n" +
          "The right slot has a default — pass `seeAllHref` and you get a consistent 'See all' " +
          "link for free. Pass `action` when a section needs something else entirely, and it " +
          "replaces the link rather than sitting beside it.",
      },
    },
  },
  argTypes: { title: { control: "text" }, description: { control: "text" }, seeAllHref: { control: "text" } },
  args: { title: "Aşamalara göre", children: null },
  decorators: [(Story) => <div className="max-w-md">{Story()}</div>],
} satisfies Meta<typeof SectionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const STAGES = [
  { label: "Alındı", value: 1, meta: "%13", dot: "bg-violet-500" },
  { label: "Kesim", value: 2, meta: "%25", dot: "bg-blue-500" },
  { label: "Dikim", value: 2, meta: "%25", dot: "bg-teal-500" },
  { label: "Ütü & Paket", value: 1, meta: "%13", dot: "bg-amber-500" },
  { label: "Sevk edildi", value: 2, meta: "%25", dot: "bg-emerald-500" },
];

export const Default: Story = {
  render: () => (
    <SectionCard icon={<Package />} title="Aşamalara göre" seeAllHref="#">
      {STAGES.map((stage) => (
        <ListRow
          key={stage.label}
          leading={<span className={`size-2 rounded-full ${stage.dot}`} />}
          label={stage.label}
          value={stage.value}
          meta={stage.meta}
        />
      ))}
    </SectionCard>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <SectionCard
      icon={<TrendingUp />}
      title="En yoğun müşteriler"
      description="Son 30 gün içinde oluşturulan siparişlere göre."
      seeAllHref="#"
    >
      {[
        ["Kaya Mağazacılık", 3],
        ["Öz Giyim", 3],
        ["Nar Tekstil", 2],
      ].map(([name, count]) => (
        <ListRow key={String(name)} label={name as string} value={count as number} />
      ))}
    </SectionCard>
  ),
};

export const WithCustomAction: Story = {
  parameters: {
    docs: {
      description: {
        story: "`action` overrides the default 'See all' link — here, a period switcher.",
      },
    },
  },
  render: () => (
    <SectionCard
      icon={<Users />}
      title="Ekip etkinliği"
      action={
        <Button variant="ghost" size="xs">
          Son 7 gün
        </Button>
      }
    >
      {[
        ["Ayşe Demir", "12 geçiş"],
        ["Mehmet Yıldız", "8 geçiş"],
      ].map(([name, meta]) => (
        <ListRow key={String(name)} label={name as string} value={meta as string} />
      ))}
    </SectionCard>
  ),
};

export const Empty: Story = {
  render: () => (
    <SectionCard icon={<Package />} title="Geciken siparişler">
      <p className="px-2 py-6 text-center text-sm text-muted-foreground">
        Hiçbir sipariş eşiği aşmadı.
      </p>
    </SectionCard>
  ),
};

export const InAGrid: Story = {
  decorators: [(Story) => <div className="max-w-4xl">{Story()}</div>],
  parameters: { docs: { description: { story: "How the overview screen lays several out." } } },
  render: () => (
    <div className="grid gap-3 md:grid-cols-2">
      <SectionCard icon={<Package />} title="Aşamalara göre" seeAllHref="#">
        {STAGES.slice(0, 4).map((stage) => (
          <ListRow
            key={stage.label}
            leading={<span className={`size-2 rounded-full ${stage.dot}`} />}
            label={stage.label}
            value={stage.value}
            meta={stage.meta}
          />
        ))}
        <ListRow label="Daha fazla göster" muted href="#" />
      </SectionCard>
      <SectionCard
        icon={<TrendingUp />}
        title="En yoğun müşteriler"
        description="Son 30 gün"
        seeAllHref="#"
      >
        {[
          ["Kaya Mağazacılık", 3],
          ["Öz Giyim", 3],
          ["Nar Tekstil", 2],
        ].map(([name, count]) => (
          <ListRow key={String(name)} label={name as string} value={count as number} />
        ))}
      </SectionCard>
    </div>
  ),
};
