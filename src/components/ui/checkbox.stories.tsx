import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Checkbox } from "./checkbox";
import { Label } from "./label";

const meta = {
  title: "UI Kit/Checkbox",
  component: Checkbox,
  parameters: {
    docs: {
      description: {
        component:
          "16px box with an invisible `::after` that extends the hit area well past the visual " +
          "bounds — so the target stays comfortable on touch without the checkbox itself growing " +
          "and throwing off the row rhythm.",
      },
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { defaultChecked: true },
};

export const States: Story = {
  render: () => (
    <div className="grid gap-3">
      {[
        { id: "cb-off", label: "İşaretsiz", props: {} },
        { id: "cb-on", label: "İşaretli", props: { defaultChecked: true } },
        { id: "cb-off-disabled", label: "Devre dışı", props: { disabled: true } },
        {
          id: "cb-on-disabled",
          label: "Devre dışı, işaretli",
          props: { disabled: true, defaultChecked: true },
        },
        { id: "cb-invalid", label: "Hatalı", props: { "aria-invalid": true } },
      ].map(({ id, label, props }) => (
        <div key={id} className="flex items-center gap-2.5">
          <Checkbox id={id} {...props} />
          <Label htmlFor={id} className="font-normal">
            {label}
          </Label>
        </div>
      ))}
    </div>
  ),
};

export const PermissionList: Story = {
  parameters: {
    docs: {
      description: {
        story: "How the Roles screen uses it — one checkbox per permission gate on a role.",
      },
    },
  },
  render: () => (
    <div className="max-w-sm rounded-xl border border-border bg-card p-3">
      <p className="px-1 pb-2 text-[15px] font-semibold text-foreground">Üretim</p>
      <div className="space-y-0.5">
        {[
          ["Rolleri yönet", false],
          ["Aşamaları yönet", false],
          ["Alanları yönet", false],
          ["Firmayı yönet", false],
          ["Sipariş oluştur", true],
          ["Aşama değiştir", true],
          ["Raporları gör", true],
        ].map(([label, checked]) => (
          <div key={String(label)} className="flex items-center gap-2.5 rounded-md px-2 py-2">
            <Checkbox id={`perm-${label}`} defaultChecked={checked as boolean} />
            <Label htmlFor={`perm-${label}`} className="font-normal">
              {label as string}
            </Label>
          </div>
        ))}
      </div>
    </div>
  ),
};
