import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta: Meta = {
  title: "Design System/Radius & Depth",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The radius scale is a fixed px ladder, not derived from a single `--radius` multiplier — " +
          "so a small control and a large panel can be tuned independently. Depth is expressed " +
          "entirely through fill contrast and hairline borders: every `--shadow-*` token is " +
          "deliberately `none`, which makes any stray `shadow-*` utility a silent no-op.",
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const RADII: { token: string; value: string; usage: string }[] = [
  { token: "--radius-xs", value: "4px", usage: "Checkbox, the smallest inline marks" },
  { token: "--radius-sm", value: "6px", usage: "Inputs, buttons, menu items, ListRow hover" },
  { token: "--radius-md", value: "10px", usage: "Default control radius; also --radius" },
  { token: "--radius-lg", value: "14px", usage: "TabsList, grouped controls" },
  { token: "--radius-xl", value: "16px", usage: "Card, SectionCard, StatCard — every panel" },
  { token: "--radius-2xl", value: "20px", usage: "Dialog surfaces" },
  { token: "--radius-3xl", value: "20px", usage: "Alias of 2xl — kept so the ladder stays contiguous" },
  { token: "--radius-4xl", value: "999px", usage: "Badge, StageBadge, the segmented status bar" },
];

export const Radius: Story = {
  render: () => (
    <div className="max-w-4xl space-y-2 p-6">
      {RADII.map(({ token, value, usage }) => (
        <div key={token} className="flex items-center gap-4 rounded-lg border border-border p-3">
          <div
            className="size-14 shrink-0 border border-border bg-card"
            style={{ borderRadius: `var(${token})` }}
          />
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[13px] text-foreground">{token}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{usage}</p>
          </div>
          <code className="shrink-0 font-mono text-xs text-muted-foreground">{value}</code>
        </div>
      ))}
    </div>
  ),
};

export const Depth: Story = {
  render: () => (
    <div className="max-w-4xl space-y-6 p-6">
      <div>
        <h3 className="text-[15px] font-semibold text-foreground">Stacking without shadows</h3>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Three surfaces are enough for the whole product. Nesting reads correctly because each
          step changes fill, and a hairline border separates any two surfaces that would otherwise
          share a value.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-background p-4">
        <p className="pb-3 text-[13px] text-muted-foreground">
          <code className="font-mono">bg-background</code> — the page
        </p>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="pb-3 text-[13px] text-muted-foreground">
            <code className="font-mono">bg-card</code> — a panel resting on the page
          </p>
          <div className="rounded-md bg-background px-3 py-2.5">
            <p className="text-[13px] text-muted-foreground">
              <code className="font-mono">bg-background</code> — an inset well inside the panel.
              Note StatCard inverts the usual order this way: a background-filled card holding a
              card-filled value block.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border p-4">
        <h4 className="text-[15px] font-semibold text-foreground">Shadow tokens</h4>
        <p className="mt-1 text-sm text-muted-foreground">
          All zeroed rather than removed, so third-party shadcn components that ship a{" "}
          <code className="font-mono text-xs">shadow-*</code> class render flat without needing to
          be patched.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {["--shadow-xs", "--shadow-sm", "--shadow-md", "--shadow-lg", "--shadow-panel"].map(
            (token) => (
              <code
                key={token}
                className="rounded-md bg-secondary px-2 py-1 font-mono text-xs text-secondary-foreground"
              >
                {token}: none
              </code>
            ),
          )}
        </div>
      </div>
    </div>
  ),
};
