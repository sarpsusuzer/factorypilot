import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge } from "./badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

const meta = {
  title: "UI Kit/Tabs",
  component: Tabs,
  parameters: {
    docs: {
      description: {
        component:
          "Two visual treatments off one primitive. `default` is a segmented control on a muted " +
          "track — good for switching a small view in place. `line` is an underlined nav, which " +
          "is what the order list uses for its stage filter, where the tab row is the page's " +
          "primary navigation. Both support horizontal and vertical orientation.",
      },
    },
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="acik" className="max-w-lg">
      <TabsList>
        <TabsTrigger value="acik">Açık</TabsTrigger>
        <TabsTrigger value="tamamlanan">Tamamlanan</TabsTrigger>
        <TabsTrigger value="tumu">Tümü</TabsTrigger>
      </TabsList>
      <TabsContent value="acik" className="text-sm text-muted-foreground">
        Sevk edilmemiş altı sipariş.
      </TabsContent>
      <TabsContent value="tamamlanan" className="text-sm text-muted-foreground">
        Sevk edilmiş iki sipariş.
      </TabsContent>
      <TabsContent value="tumu" className="text-sm text-muted-foreground">
        Sekiz sipariş.
      </TabsContent>
    </Tabs>
  ),
};

export const Line: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "The active tab is marked by a 2px rule underneath rather than a filled pill, so a long " +
          "row of stages stays quiet. Counts ride along as secondary badges.",
      },
    },
  },
  render: () => (
    <Tabs defaultValue="kesim" className="max-w-2xl">
      <TabsList variant="line">
        {[
          ["tumu", "Tümü", 8],
          ["alindi", "Alındı", 1],
          ["kesim", "Kesim", 2],
          ["dikim", "Dikim", 2],
          ["paket", "Ütü & Paket", 1],
          ["sevk", "Sevk edildi", 2],
        ].map(([value, label, count]) => (
          <TabsTrigger key={String(value)} value={String(value)}>
            {label as string}
            <Badge variant="secondary" className="tabular-nums">
              {count as number}
            </Badge>
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="kesim" className="pt-2 text-sm text-muted-foreground">
        SP-1002 ve SP-1003 kesimde.
      </TabsContent>
    </Tabs>
  ),
};

export const Vertical: Story = {
  render: () => (
    <Tabs defaultValue="genel" orientation="vertical" className="max-w-lg">
      <TabsList>
        <TabsTrigger value="genel">Genel</TabsTrigger>
        <TabsTrigger value="alanlar">Alanlar</TabsTrigger>
        <TabsTrigger value="asamalar">Aşamalar</TabsTrigger>
      </TabsList>
      <TabsContent value="genel" className="text-sm text-muted-foreground">
        Firma adı ve logo.
      </TabsContent>
      <TabsContent value="alanlar" className="text-sm text-muted-foreground">
        Yedi alan tanımlı.
      </TabsContent>
      <TabsContent value="asamalar" className="text-sm text-muted-foreground">
        Beş aşama tanımlı.
      </TabsContent>
    </Tabs>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Tabs defaultValue="acik" className="max-w-lg">
      <TabsList>
        <TabsTrigger value="acik">Açık</TabsTrigger>
        <TabsTrigger value="raporlar" disabled>
          Raporlar
        </TabsTrigger>
        <TabsTrigger value="tumu">Tümü</TabsTrigger>
      </TabsList>
      <TabsContent value="acik" className="text-sm text-muted-foreground">
        Raporlar sekmesi bu rolde kapalı.
      </TabsContent>
    </Tabs>
  ),
};
