"use client";

import { Badge } from "@/components/ui/badge";
import { useData } from "@/lib/data";
import { stageColorClasses } from "@/lib/stage-colors";
import { cn } from "@/lib/utils";

const UNKNOWN = "bg-muted text-muted-foreground border-border";

/** Colour comes from the stage's own setting — see Stage settings to change it. */
export function StageBadge({ stage }: { stage: string }) {
  const { stages } = useData();
  const match = stages.find((s) => s.name === stage);

  return (
    <Badge
      variant="outline"
      className={cn("font-medium", match ? stageColorClasses(match.color) : UNKNOWN)}
    >
      {stage}
    </Badge>
  );
}
