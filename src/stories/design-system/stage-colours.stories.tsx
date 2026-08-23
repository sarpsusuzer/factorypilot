import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge } from "@/components/ui/badge";
import { STAGE_COLORS, stageColorDot } from "@/lib/stage-colors";
import { cn } from "@/lib/utils";

const meta: Meta = {
  title: "Design System/Stage Colours",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Stages are the one place the product uses hue to carry meaning. It is a fixed set of " +
          "eleven preset swatches rather than a free colour picker, so every badge stays legible — " +
          "the text/background contrast of each pair is checked once, here, instead of being left " +
          "to whoever configures the stages. Each swatch ships a badge pair and a solid dot; the " +
          "dot is what the kanban columns and the segmented status bar use.",
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Swatches: Story = {
  render: () => (
    <div className="max-w-4xl space-y-2 p-6">
      {STAGE_COLORS.map((swatch) => (
        <div key={swatch.key} className="flex items-center gap-4 rounded-lg border border-border p-3">
          <span className={cn("size-6 shrink-0 rounded-full", swatch.dot)} />
          <Badge className={cn("gap-1.5 font-medium", swatch.badge)}>
            <span className={cn("size-1.5 shrink-0 rounded-full", swatch.dot)} />
            Kesim
          </Badge>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-foreground">{swatch.label}</p>
            <p className="font-mono text-xs text-muted-foreground">{swatch.key}</p>
          </div>
          <code className="hidden shrink-0 font-mono text-xs text-muted-foreground sm:block">
            {swatch.badge}
          </code>
        </div>
      ))}
    </div>
  ),
};

/**
 * `colorForPosition` cycles the palette so a freshly seeded set of stages gets
 * varied colours without anyone picking them — this is what a new company sees.
 */
export const DefaultPipeline: Story = {
  render: () => (
    <div className="max-w-4xl space-y-6 p-6">
      <div>
        <h3 className="text-[15px] font-semibold text-foreground">Assigned by position</h3>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          New stages take their colour from <code className="font-mono text-xs">colorForPosition</code>,
          which walks the palette in order and wraps. A pipeline therefore reads as a gradient of
          distinct hues on day one, before anyone opens Stage settings.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {STAGE_COLORS.map((swatch, index) => (
          <Badge key={swatch.key} className={cn("gap-1.5 font-medium", swatch.badge)}>
            <span className={cn("size-1.5 shrink-0 rounded-full", swatch.dot)} />
            Aşama {index + 1}
          </Badge>
        ))}
      </div>

      <div>
        <h3 className="text-[15px] font-semibold text-foreground">As a segmented bar</h3>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          The dot classes double as fills for OrderStatusBar. Adjacent segments are separated by a
          2px background-coloured border rather than a darker line.
        </p>
      </div>
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-muted">
        {STAGE_COLORS.map((swatch, index) => (
          <div
            key={swatch.key}
            title={swatch.label}
            className={cn(
              stageColorDot(swatch.key),
              index < STAGE_COLORS.length - 1 && "border-r-2 border-background",
            )}
            style={{ width: `${100 / STAGE_COLORS.length}%` }}
          />
        ))}
      </div>
    </div>
  ),
};
