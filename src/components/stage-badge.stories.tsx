import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import * as fixtures from "../../.storybook/fixtures";
import { StageBadge } from "./stage-badge";

const meta = {
  title: "Patterns/StageBadge",
  component: StageBadge,
  parameters: {
    docs: {
      description: {
        component:
          "A stage rendered in its own configured colour. The component takes only the stage " +
          "*name* — it looks the colour up from `useData()` itself, so a badge can never drift " +
          "from what Stage settings says.\n\n" +
          "In Storybook `useData()` is served from `.storybook/fixtures.ts`; override it per-story " +
          "with `parameters: { data: { stages: [...] } }`.",
      },
    },
  },
  argTypes: {
    stage: { control: "select", options: fixtures.stages.map((s) => s.name) },
  },
  args: { stage: "Kesim" },
} satisfies Meta<typeof StageBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Pipeline: Story = {
  parameters: {
    docs: { description: { story: "The default seeded pipeline, in order." } },
  },
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      {fixtures.stages.map((stage) => (
        <StageBadge key={stage.id} stage={stage.name} />
      ))}
    </div>
  ),
};

export const UnknownStage: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "An order referencing a stage that no longer exists still renders — falling back to " +
          "neutral grey rather than throwing or showing nothing. Orders reference stages by name, " +
          "so this happens whenever a stage is deleted while orders still sit in it.",
      },
    },
  },
  args: { stage: "Silinmiş aşama" },
};

export const Recoloured: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "The same stage names with different configured swatches — this is what a company sees " +
          "after editing colours in Stage settings. Nothing about the badge changed; only the data did.",
      },
    },
    data: {
      stages: fixtures.stages.map((stage, index) => ({
        ...stage,
        color: (["rose", "orange", "fuchsia", "indigo", "sky"] as const)[index],
      })),
    },
  },
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      {fixtures.stages.map((stage) => (
        <StageBadge key={stage.id} stage={stage.name} />
      ))}
    </div>
  ),
};
