import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BrandMark } from "./brand-mark";

const meta = {
  title: "Patterns/BrandMark",
  component: BrandMark,
  parameters: {
    docs: {
      description: {
        component:
          "The FactoryPilot glyph. A single path filled with `currentColor`, so it takes its " +
          "colour from whatever text colour it inherits — there is no `color` prop and no light/" +
          "dark variant to pick between. Size it with a `size-*` class rather than width/height.",
      },
    },
  },
  args: { className: "size-10 text-foreground" },
} satisfies Meta<typeof BrandMark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      {["size-3.5", "size-5", "size-8", "size-12", "size-20"].map((size) => (
        <div key={size} className="flex flex-col items-center gap-2">
          <BrandMark className={`${size} text-foreground`} />
          <code className="font-mono text-xs text-muted-foreground">{size}</code>
        </div>
      ))}
    </div>
  ),
};

export const Colour: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "`fill=\"currentColor\"` means the mark simply inherits. On the inverse surface it goes " +
          "white without a second asset.",
      },
    },
  },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {[
        ["text-foreground", "bg-background border border-border"],
        ["text-muted-foreground", "bg-background border border-border"],
        ["text-blue-500", "bg-background border border-border"],
        ["text-destructive", "bg-background border border-border"],
        ["text-inverse-foreground", "bg-inverse"],
      ].map(([tone, surface]) => (
        <div key={tone} className={`flex size-20 items-center justify-center rounded-xl ${surface}`}>
          <BrandMark className={`size-8 ${tone}`} />
        </div>
      ))}
    </div>
  ),
};

export const Lockup: Story = {
  parameters: {
    docs: { description: { story: "Mark plus wordmark, as it appears in the site nav." } },
  },
  render: () => (
    <div className="flex items-center gap-2">
      <BrandMark className="size-5 text-foreground" />
      <span className="text-[15px] font-semibold tracking-tight text-foreground">FactoryPilot</span>
    </div>
  ),
};
