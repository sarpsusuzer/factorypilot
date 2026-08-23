import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { OverviewLineChart, type ChartPoint } from "./overview-line-chart";

const HOURS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];

function series(base: number, spread: number, seed: number): number[] {
  // Deterministic pseudo-random so the chart looks the same on every run —
  // a snapshot that changes shape each reload is useless for review.
  let value = base;
  return HOURS.map((_, index) => {
    const wobble = Math.sin((index + seed) * 1.7) * spread;
    value = Math.max(0, Math.round(base + wobble + Math.cos(index * 0.9 + seed) * (spread / 2)));
    return value;
  });
}

const olusturulan = series(42, 14, 1);
const tamamlanan = series(30, 11, 4);

const data: ChartPoint[] = HOURS.map((time, index) => ({
  time,
  olusturulan: olusturulan[index],
  tamamlanan: tamamlanan[index],
}));

const meta = {
  title: "Patterns/OverviewLineChart",
  component: OverviewLineChart,
  parameters: {
    docs: {
      description: {
        component:
          "The dashboard's trend chart, built on Recharts. Three things make it look like the " +
          "rest of the product rather than like a chart library:\n\n" +
          "- The plot sits on a **dot grid** painted with a `radial-gradient` background rather " +
          "than Recharts' `CartesianGrid`, which is set to `transparent`.\n" +
          "- The **active x-axis tick** swaps for a filled dark pill as the cursor moves, so the " +
          "hovered position is readable without looking up at the tooltip.\n" +
          "- The **tooltip** is the same inverse surface as toasts.\n\n" +
          "Line animation is off (`isAnimationActive={false}`) — the chart re-renders on hover, " +
          "and animating on every pointer move reads as jitter.",
      },
    },
  },
  args: {
    data,
    series: [
      { key: "olusturulan", label: "Oluşturulan", color: "#3B82F6" },
      { key: "tamamlanan", label: "Tamamlanan", color: "#18181B" },
    ],
    dayLabel: "Bugün",
    height: 320,
  },
  argTypes: { height: { control: { type: "range", min: 180, max: 520, step: 20 } } },
  decorators: [(Story) => <div className="max-w-3xl">{Story()}</div>],
} satisfies Meta<typeof OverviewLineChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: {
    docs: { description: { story: "Hover the plot to see the tick pill and tooltip." } },
  },
};

export const SingleSeries: Story = {
  args: {
    series: [{ key: "olusturulan", label: "Oluşturulan", color: "#3B82F6" }],
  },
};

export const ThreeSeries: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Three is about the ceiling. Beyond that the neutrals stop being distinguishable from " +
          "each other and the chart needs a different form.",
      },
    },
  },
  args: {
    data: HOURS.map((time, index) => ({
      time,
      olusturulan: olusturulan[index],
      tamamlanan: tamamlanan[index],
      geciken: series(12, 6, 9)[index],
    })),
    series: [
      { key: "olusturulan", label: "Oluşturulan", color: "#3B82F6", strokeWidth: 2 },
      { key: "tamamlanan", label: "Tamamlanan", color: "#18181B", strokeWidth: 2 },
      { key: "geciken", label: "Geciken", color: "#8B8B93", strokeWidth: 1.5 },
    ],
  },
};

export const Short: Story = {
  args: { height: 200 },
};
