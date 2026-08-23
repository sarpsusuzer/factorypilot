import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";

const meta = {
  title: "UI Kit/Card",
  component: Card,
  parameters: {
    docs: {
      description: {
        component:
          "The generic panel. Internal spacing flows from one `--card-spacing` variable, so " +
          "`size=\"sm\"` retightens the header, content and footer together rather than each " +
          "needing its own override. A `CardFooter` automatically removes the bottom padding so " +
          "the footer can sit flush against the card edge.",
      },
    },
  },
  argTypes: { size: { control: "inline-radio", options: ["default", "sm"] } },
  decorators: [(Story) => <div className="max-w-md">{Story()}</div>],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>Açık siparişler</CardTitle>
        <CardDescription>Sevk edilmemiş tüm siparişler.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Altı sipariş üretimde, ikisi kesim aşamasında bekliyor.
        </p>
      </CardContent>
    </Card>
  ),
};

export const WithAction: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "`CardAction` switches the header to a two-column grid automatically — no layout props " +
          "to pass, and the title still wraps correctly when the action is present.",
      },
    },
  },
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Aşama ayarları</CardTitle>
        <CardDescription>Siparişlerin geçtiği adımları düzenleyin.</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm">
            Düzenle
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Beş aşama tanımlı.</p>
      </CardContent>
    </Card>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Siparişi sil</CardTitle>
        <CardDescription>Bu işlem geri alınamaz.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          SP-1004 ve tüm aşama geçmişi kalıcı olarak silinecek.
        </p>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 border-t border-border py-4">
        <Button variant="outline">Vazgeç</Button>
        <Button variant="destructive">Sil</Button>
      </CardFooter>
    </Card>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      {(["default", "sm"] as const).map((size) => (
        <Card key={size} size={size}>
          <CardHeader>
            <CardTitle>size=&quot;{size}&quot;</CardTitle>
            <CardDescription>
              {size === "default" ? "16px iç boşluk" : "12px iç boşluk, daha küçük başlık"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Dikim aşamasında iki sipariş var.</p>
          </CardContent>
        </Card>
      ))}
    </div>
  ),
};
