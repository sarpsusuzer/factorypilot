import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Label } from "./label";
import { Textarea } from "./textarea";

const meta = {
  title: "UI Kit/Textarea",
  component: Textarea,
  parameters: {
    docs: {
      description: {
        component:
          "Uses `field-sizing: content`, so the box grows with what is typed instead of scrolling " +
          "inside a fixed height — no resize handle and no JS measuring. `min-h-16` sets the floor.",
      },
    },
  },
  args: { placeholder: "Sipariş notları" },
  decorators: [(Story) => <div className="max-w-md">{Story()}</div>],
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const States: Story = {
  render: () => (
    <div className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="ta-empty">Boş</Label>
        <Textarea id="ta-empty" placeholder="Sipariş notları" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="ta-grown">İçerikle büyür</Label>
        <Textarea
          id="ta-grown"
          defaultValue={
            "Kumaş tedarikçiden 12 Ağustos'ta gelecek.\n" +
            "Kesim önceliği: önce L ve XL bedenler.\n" +
            "Paketleme sırasında etiket kontrolü yapılacak."
          }
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="ta-invalid">Hatalı</Label>
        <Textarea id="ta-invalid" aria-invalid placeholder="Zorunlu alan" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="ta-disabled">Devre dışı</Label>
        <Textarea id="ta-disabled" disabled defaultValue="Değiştirilemez" />
      </div>
    </div>
  ),
};
