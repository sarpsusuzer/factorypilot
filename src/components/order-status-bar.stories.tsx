import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import * as fixtures from "../../.storybook/fixtures";
import { OrderStatusBar } from "./order-status-bar";

const meta = {
  title: "Patterns/OrderStatusBar",
  component: OrderStatusBar,
  parameters: {
    docs: {
      description: {
        component:
          "One segmented bar plus a legend showing how orders split across stages. Segments are " +
          "sized by share, coloured from each stage's own swatch, and separated by a 2px " +
          "*background-coloured* border rather than a darker rule — so the division reads as a " +
          "gap rather than a line.\n\n" +
          "Empty stages are dropped from the bar but kept in the legend, so a stage sitting at " +
          "zero is still visible as a stage that exists.",
      },
    },
  },
  args: { orders: fixtures.orders, stages: fixtures.stages },
  decorators: [(Story) => <div className="max-w-2xl">{Story()}</div>],
} satisfies Meta<typeof OrderStatusBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Lopsided: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "A pile-up in one stage — the shape the bar exists to make obvious at a glance.",
      },
    },
  },
  args: {
    orders: fixtures.orders.map((order, index) => ({
      ...order,
      current_stage: index === 0 ? "Alındı" : "Kesim",
    })),
  },
};

export const SingleStage: Story = {
  parameters: {
    docs: { description: { story: "Every order in one stage — the bar becomes solid." } },
  },
  args: {
    orders: fixtures.orders.map((order) => ({ ...order, current_stage: "Dikim" })),
  },
};

export const Empty: Story = {
  parameters: {
    docs: {
      description: {
        story: "With no orders the bar is replaced by a sentence — an empty rail says nothing useful.",
      },
    },
  },
  args: { orders: [] },
};
