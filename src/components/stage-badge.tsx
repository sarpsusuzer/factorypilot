"use client";

import { Badge } from "@/components/ui/badge";
import { useData } from "@/lib/data";
import { stageColorClasses, stageColorDot } from "@/lib/stage-colors";
import { cn } from "@/lib/utils";

const UNKNOWN = "bg-muted text-muted-foreground";
const UNKNOWN_DOT = "bg-muted-foreground";

/** Colour comes from the stage's own setting — see Stage settings to change it. */
export function StageBadge({ stage }: { stage: string }) {
  const { stages } = useData();
  const match = stages.find((s) => s.name === stage);

  return (
    <Badge className={cn("gap-1.5 font-medium", match ? stageColorClasses(match.color) : UNKNOWN)}>
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          match ? stageColorDot(match.color) : UNKNOWN_DOT,
        )}
      />
      {stage}
    </Badge>
  );
}
