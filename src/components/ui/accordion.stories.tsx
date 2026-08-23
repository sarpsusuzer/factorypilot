import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./accordion";

// Typed as bare `Meta`, not `satisfies Meta<typeof Accordion>` — Accordion's
// props are a discriminated union on `type`, which collapses the inferred story
// args to `never` and then demands an `args` key on every story.
const meta: Meta<typeof Accordion> = {
  title: "UI Kit/Accordion",
  component: Accordion,
  parameters: {
    docs: {
      description: {
        component:
          "Collapsible sections — the order detail screen uses one per line item so a long " +
          "order stays scannable. `type=\"single\"` keeps one section open at a time; " +
          "`type=\"multiple\"` lets several stay open.",
      },
    },
  },
  decorators: [(Story) => <div className="max-w-lg">{Story()}</div>],
};

export default meta;
type Story = StoryObj<typeof Accordion>;

export const Single: Story = {
  render: () => (
    <Accordion type="single" collapsible defaultValue="item-1">
      <AccordionItem value="item-1">
        <AccordionTrigger>1. kalem — Bisiklet yaka</AccordionTrigger>
        <AccordionContent>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
            <dt className="text-muted-foreground">Adet</dt>
            <dd className="tabular-nums">250</dd>
            <dt className="text-muted-foreground">Bedenler</dt>
            <dd>M, L</dd>
          </dl>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>2. kalem — V yaka</AccordionTrigger>
        <AccordionContent>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
            <dt className="text-muted-foreground">Adet</dt>
            <dd className="tabular-nums">480</dd>
            <dt className="text-muted-foreground">Bedenler</dt>
            <dd>S, M, L, XL</dd>
          </dl>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>3. kalem — Polo</AccordionTrigger>
        <AccordionContent>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
            <dt className="text-muted-foreground">Adet</dt>
            <dd className="tabular-nums">96</dd>
            <dt className="text-muted-foreground">Bedenler</dt>
            <dd>L</dd>
          </dl>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const Multiple: Story = {
  render: () => (
    <Accordion type="multiple" defaultValue={["a", "b"]}>
      <AccordionItem value="a">
        <AccordionTrigger>Sipariş bilgileri</AccordionTrigger>
        <AccordionContent className="text-sm text-muted-foreground">
          Müşteri, termin tarihi ve notlar.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="b">
        <AccordionTrigger>Aşama geçmişi</AccordionTrigger>
        <AccordionContent className="text-sm text-muted-foreground">
          Dört geçiş kaydı.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="c">
        <AccordionTrigger>Ekler</AccordionTrigger>
        <AccordionContent className="text-sm text-muted-foreground">
          Teknik çizim yüklenmemiş.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};
