import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BrandMark } from "./brand-mark";
import { ListRow } from "./list-row";
import { SectionCard } from "./section-card";

const meta = {
  title: "Patterns/ListRow",
  component: ListRow,
  parameters: {
    docs: {
      description: {
        component:
          "One line inside a `SectionCard`. Four slots: `leading` (a dot, glyph or icon), `label`, " +
          "`meta` (secondary, e.g. a share-of-total percent) and `value` (the primary number).\n\n" +
          "`value` and `meta` are both `tabular-nums`, so a stack of rows aligns on the decimal " +
          "without needing a table. The label truncates; the trailing group never shrinks.\n\n" +
          "Passing `href` turns the row into a link and adds the hover fill — note the fill is " +
          "`bg-background`, because the row sits on a `bg-card` panel and hover is a step *back* " +
          "toward the page rather than a step further forward.",
      },
    },
  },
  argTypes: { label: { control: "text" }, value: { control: "text" }, meta: { control: "text" }, muted: { control: "boolean" } },
  args: { label: "Kesim", value: 2, meta: "%25" },
  decorators: [
    (Story) => (
      <div className="max-w-md rounded-xl border border-border bg-card p-3">{Story()}</div>
    ),
  ],
} satisfies Meta<typeof ListRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Slots: Story = {
  render: () => (
    <div className="space-y-0.5">
      <ListRow label="Yalnızca etiket" />
      <ListRow label="Etiket ve değer" value={12} />
      <ListRow label="Etiket, meta ve değer" value={12} meta="%25" />
      <ListRow
        leading={<span className="size-2 rounded-full bg-blue-500" />}
        label="Renkli nokta ile"
        value={12}
        meta="%25"
      />
      <ListRow
        leading={<BrandMark className="size-3.5 text-muted-foreground" />}
        label="Marka işareti ile"
        value={12}
      />
      <ListRow label="Bağlantı satırı — üzerine gelin" value={12} href="#" />
      <ListRow label="Daha fazla göster" muted href="#" />
    </div>
  ),
};

export const Truncation: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "A long label gives way; the number never does. This is what keeps a column of values " +
          "aligned no matter how the labels vary.",
      },
    },
  },
  render: () => (
    <div className="space-y-0.5">
      <ListRow
        leading={<span className="size-2 rounded-full bg-violet-500" />}
        label="Kaya Mağazacılık — Sonbahar/Kış koleksiyonu, ikinci parti"
        value="1.248"
        meta="%64"
      />
      <ListRow
        leading={<span className="size-2 rounded-full bg-teal-500" />}
        label="Öz Giyim"
        value="96"
        meta="%5"
      />
    </div>
  ),
};

export const InContext: Story = {
  decorators: [(Story) => <div className="max-w-md">{Story()}</div>],
  render: () => (
    <SectionCard title="Aşamalara göre" seeAllHref="#">
      {[
        ["Alındı", 1, "%13", "bg-violet-500"],
        ["Kesim", 2, "%25", "bg-blue-500"],
        ["Dikim", 2, "%25", "bg-teal-500"],
        ["Ütü & Paket", 1, "%13", "bg-amber-500"],
      ].map(([label, value, meta, dot]) => (
        <ListRow
          key={String(label)}
          leading={<span className={`size-2 rounded-full ${dot}`} />}
          label={label as string}
          value={value as number}
          meta={meta as string}
          href="#"
        />
      ))}
      <ListRow label="Tüm aşamaları gör" muted href="#" />
    </SectionCard>
  ),
};
