import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect, useState } from "react";

/**
 * Swatches resolve their value from the live CSS custom property rather than a
 * hardcoded hex, so this page can never drift from `src/app/globals.css` — edit
 * the token there and the swatch follows.
 */
function useTokenValue(token: string) {
  const [value, setValue] = useState("");
  useEffect(() => {
    const root = document.querySelector(".fp-root") ?? document.documentElement;
    setValue(getComputedStyle(root).getPropertyValue(token).trim());
  }, [token]);
  return value;
}

function Swatch({ token, note }: { token: string; note?: string }) {
  const value = useTokenValue(token);
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-2">
      <div
        className="size-11 shrink-0 rounded-md border border-border"
        style={{ background: `var(${token})` }}
      />
      <div className="min-w-0">
        <p className="truncate font-mono text-[13px] text-foreground">{token}</p>
        <p className="font-mono text-xs uppercase text-muted-foreground">{value || "—"}</p>
        {note && <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>}
      </div>
    </div>
  );
}

function Group({ title, blurb, tokens }: { title: string; blurb?: string; tokens: [string, string?][] }) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
        {blurb && <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">{blurb}</p>}
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {tokens.map(([token, note]) => (
          <Swatch key={token} token={token} note={note} />
        ))}
      </div>
    </section>
  );
}

const meta: Meta = {
  title: "Design System/Colours",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Every colour in FactoryPilot is a CSS custom property defined in `globals.css` and " +
          "exposed to Tailwind through `@theme inline`. Components reference the semantic name " +
          "(`bg-card`, `text-muted-foreground`) — never a raw hex — so a palette change is a " +
          "one-file edit.",
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Palette: Story = {
  render: () => (
    <div className="space-y-8 p-6">
      <Group
        title="Surfaces"
        blurb="Depth comes from fill contrast plus hairline borders — there are no drop shadows anywhere in the product."
        tokens={[
          ["--background", "The page itself"],
          ["--card", "Raised panels, section cards"],
          ["--popover", "Menus, dialogs, selects"],
          ["--muted", "Inset wells, disabled fills"],
          ["--secondary", "Secondary buttons, chips"],
          ["--accent", "Hover fill on ghost/outline"],
        ]}
      />
      <Group
        title="Content"
        tokens={[
          ["--foreground", "Primary text"],
          ["--muted-foreground", "Labels, captions, meta"],
          ["--card-foreground"],
          ["--secondary-foreground"],
          ["--accent-foreground"],
          ["--popover-foreground"],
        ]}
      />
      <Group
        title="Action & state"
        tokens={[
          ["--primary", "Default button, focus ring source"],
          ["--primary-foreground"],
          ["--destructive", "Delete, irreversible actions"],
          ["--destructive-foreground"],
          ["--ring", "Focus ring"],
          ["--border", "Every hairline; also --input"],
        ]}
      />
      <Group
        title="Inverse"
        blurb="The one deliberate dark surface — tooltips and toasts stay inverted regardless of the rest of the (light-only) page."
        tokens={[
          ["--inverse"],
          ["--inverse-foreground"],
          ["--inverse-muted-foreground"],
        ]}
      />
      <Group
        title="Charts"
        blurb="Used by the dashboard line chart. Ordered by prominence — chart-1 is the emphasis blue, the rest are neutrals."
        tokens={[["--chart-1"], ["--chart-2"], ["--chart-3"], ["--chart-4"], ["--chart-5"]]}
      />
      <Group
        title="Sidebar"
        blurb="Declared by shadcn's sidebar primitive. Kept in sync with the surface palette; no screen mounts a sidebar yet."
        tokens={[
          ["--sidebar"],
          ["--sidebar-foreground"],
          ["--sidebar-primary"],
          ["--sidebar-accent"],
          ["--sidebar-border"],
          ["--sidebar-ring"],
        ]}
      />
    </div>
  ),
};
