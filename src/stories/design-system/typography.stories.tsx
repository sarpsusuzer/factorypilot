import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta: Meta = {
  title: "Design System/Typography",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "IBM Plex Sans for everything, IBM Plex Mono for tabular/technical values. " +
          "The scale is deliberately narrow — most of the product lives between 13px and 15px, " +
          "with size differences doing less work than weight and colour.",
      },
    },
  },
};

export default meta;
type Story = StoryObj;

function Row({
  sample,
  className,
  usage,
  spec,
}: {
  sample: string;
  className: string;
  usage: string;
  spec: string;
}) {
  return (
    <div className="grid items-baseline gap-2 border-b border-border py-4 md:grid-cols-[1fr_auto]">
      <div className="min-w-0">
        <p className={className}>{sample}</p>
        <p className="mt-1.5 text-xs text-muted-foreground">{usage}</p>
      </div>
      <code className="shrink-0 font-mono text-xs text-muted-foreground">{spec}</code>
    </div>
  );
}

export const Scale: Story = {
  render: () => (
    <div className="max-w-4xl space-y-1 p-6">
      <Row
        sample="Sipariş takibi"
        className="text-[30px] font-semibold leading-none tracking-tight text-foreground"
        usage="StatCard value — the only place a number gets to be this large."
        spec="30 / 600 / -0.025em"
      />
      <Row
        sample="Açık siparişler"
        className="text-base font-medium text-foreground"
        usage="CardTitle. Medium, not semibold — headings sit quietly."
        spec="16 / 500"
      />
      <Row
        sample="Bu haftaki üretim"
        className="text-[15px] font-semibold text-foreground"
        usage="SectionCard title. Slightly smaller than CardTitle but heavier."
        spec="15 / 600"
      />
      <Row
        sample="Kesim aşamasında bekleyen dört sipariş var."
        className="text-sm text-foreground"
        usage="Body copy, table cells, ListRow labels. The workhorse size."
        spec="14 / 400"
      />
      <Row
        sample="Son 30 günde oluşturulan siparişler"
        className="text-sm text-muted-foreground"
        usage="CardDescription, SectionCard description, helper text."
        spec="14 / 400 / muted"
      />
      <Row
        sample="Ortalama süre"
        className="text-[13px] text-muted-foreground"
        usage="StatCard label, ListRow meta, captions, 'See all' links."
        spec="13 / 400 / muted"
      />
      <Row
        sample="Sevk edildi"
        className="text-xs font-medium text-foreground"
        usage="Badge and StageBadge text."
        spec="12 / 500"
      />
      <Row
        sample="SP-1004 · 1.248 adet · %64"
        className="font-mono text-sm tabular-nums text-foreground"
        usage="Order numbers, counts, percentages — anything that should align in a column."
        spec="14 / 400 / mono, tabular-nums"
      />
    </div>
  ),
};

export const Families: Story = {
  render: () => (
    <div className="max-w-4xl space-y-6 p-6">
      {[
        {
          name: "IBM Plex Sans",
          token: "--font-sans",
          className: "font-sans",
          note: "Bound to Tailwind's font-sans and set on <html>. Weights 400 / 500 / 600 / 700.",
        },
        {
          name: "IBM Plex Mono",
          token: "--font-geist-mono",
          className: "font-mono",
          note: "Reserved for values that benefit from fixed advance width. Weights 400 / 500 / 600.",
        },
      ].map((family) => (
        <div key={family.token} className="rounded-xl border border-border p-4">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-[15px] font-semibold text-foreground">{family.name}</h3>
            <code className="font-mono text-xs text-muted-foreground">{family.token}</code>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{family.note}</p>
          <p className={`${family.className} mt-4 text-2xl text-foreground`}>
            ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ
          </p>
          <p className={`${family.className} text-2xl text-foreground`}>
            abcçdefgğhıijklmnoöprsştuüvyz 0123456789
          </p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            {[400, 500, 600, 700].map((weight) => (
              <span
                key={weight}
                className={`${family.className} text-base text-foreground`}
                style={{ fontWeight: weight }}
              >
                {weight} Termin tarihi
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
};
