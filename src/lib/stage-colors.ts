// The fixed set of stage colours. Kept as preset swatches (not a free colour
// picker) so every combination stays legible — text/background contrast is
// checked for each one.

import type { Stage, StageColor } from "./types";

export const DEFAULT_STAGE_COLOR: StageColor = "slate";

type Swatch = {
  key: StageColor;
  label: string;
  badge: string; // classes for the stage chip
  dot: string; // classes for the small colour swatch in settings
};

export const STAGE_COLORS: Swatch[] = [
  { key: "violet", label: "Mor", badge: "bg-violet-100 text-violet-700", dot: "bg-violet-500" },
  { key: "blue", label: "Mavi", badge: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  { key: "sky", label: "Gök mavisi", badge: "bg-sky-100 text-sky-700", dot: "bg-sky-500" },
  { key: "teal", label: "Turkuaz", badge: "bg-teal-100 text-teal-700", dot: "bg-teal-500" },
  { key: "emerald", label: "Yeşil", badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  { key: "amber", label: "Sarı", badge: "bg-amber-100 text-amber-800", dot: "bg-amber-500" },
  { key: "orange", label: "Turuncu", badge: "bg-orange-100 text-orange-800", dot: "bg-orange-500" },
  { key: "rose", label: "Kırmızı", badge: "bg-rose-100 text-rose-700", dot: "bg-rose-500" },
  { key: "fuchsia", label: "Pembe", badge: "bg-fuchsia-100 text-fuchsia-700", dot: "bg-fuchsia-500" },
  { key: "indigo", label: "Çivit", badge: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-500" },
  { key: "slate", label: "Gri", badge: "bg-slate-100 text-slate-700", dot: "bg-slate-500" },
];

const BY_KEY = new Map(STAGE_COLORS.map((swatch) => [swatch.key, swatch]));

export function stageColorClasses(color: StageColor | undefined) {
  return (color && BY_KEY.get(color)?.badge) ?? BY_KEY.get(DEFAULT_STAGE_COLOR)!.badge;
}

export function stageColorDot(color: StageColor | undefined) {
  return (color && BY_KEY.get(color)?.dot) ?? BY_KEY.get(DEFAULT_STAGE_COLOR)!.dot;
}

/** The badge's text-* class, e.g. for `fill="currentColor"` on an SVG mark. */
export function stageColorText(color: StageColor | undefined) {
  const badge = (color && BY_KEY.get(color)?.badge) ?? BY_KEY.get(DEFAULT_STAGE_COLOR)!.badge;
  return badge.split(" ").find((token) => token.startsWith("text-")) ?? "text-slate-700";
}

/** Cycles through the palette so newly seeded/added stages get varied colours by default. */
export function colorForPosition(position: number): StageColor {
  return STAGE_COLORS[position % STAGE_COLORS.length].key;
}

/**
 * Orders only ever reference a stage by name, so an üretici and a matched
 * müşteri seeded from the same template (e.g. both starting with "Alındı")
 * show up as two distinct rows here — one per company_id. Collapsing to the
 * first row per name is what every pipeline-shaped view (tabs, kanban
 * columns, the status bar) actually wants; it also keeps working for a
 * müşteri whose own company has no stages of its own.
 */
export function dedupeStagesByName(stages: Stage[]): Stage[] {
  const seen = new Set<string>();
  const result: Stage[] = [];
  for (const stage of stages) {
    if (seen.has(stage.name)) continue;
    seen.add(stage.name);
    result.push(stage);
  }
  return result;
}
