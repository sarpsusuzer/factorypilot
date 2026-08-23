import type { Decorator, Preview } from "@storybook/nextjs-vite";
import "../src/app/globals.css";
import { Toaster } from "../src/components/ui/sonner";
import { setMockData } from "./mocks/data";

/**
 * Stories declare `parameters: { data: { orders: [] } }` to reshape what
 * `useData()` returns. Applied before render so the first paint is already
 * correct — the mock store is read synchronously, not subscribed to.
 */
const withMockData: Decorator = (Story, context) => {
  setMockData(context.parameters.data ?? {});
  return <Story />;
};

/**
 * The app never renders bare — everything sits inside a `bg-background` page
 * with the font variables set on <html>. Stories get the same, so spacing and
 * fill contrast read the way they do in the product.
 */
const withAppChrome: Decorator = (Story, context) => {
  const bare = context.parameters.layout === "fullscreen";
  return (
    <div className="fp-root min-h-full bg-background font-sans text-foreground antialiased">
      <div className={bare ? "" : "p-6"}>
        <Story />
      </div>
      <Toaster />
    </div>
  );
};

const preview: Preview = {
  decorators: [withAppChrome, withMockData],

  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    options: {
      storySort: {
        order: [
          "Design System",
          ["Introduction", "Colours", "Typography", "Radius & Depth", "Stage Colours"],
          "UI Kit",
          "Patterns",
        ],
      },
    },
    // The product is light-only by design (see globals.css) — the .dark block
    // is inherited shadcn defaults that no screen opts into yet.
    backgrounds: {
      options: {
        page: { name: "Page", value: "#ffffff" },
        card: { name: "Card", value: "#f7f7f8" },
      },
    },
    a11y: { test: "todo" },
  },

  initialGlobals: { backgrounds: { value: "page" } },

  tags: ["autodocs"],
};

export default preview;
