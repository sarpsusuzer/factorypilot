"use client";

import { AlertTriangle, ChevronDown, Factory, OctagonAlert, PackageX, Repeat, ShieldCheck, Wrench } from "lucide-react";
import { OverviewLineChart, type ChartPoint } from "@/components/dashboard/overview-line-chart";
import { ListRow } from "@/components/list-row";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";

const HOURS = Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, "0")}:00`);

// Target vs. actual hourly output across a 24h shift schedule, dipping
// through the night shift and around the two changeover windows.
const TARGET_OUTPUT = [
  120, 118, 115, 112, 110, 108, 140, 220, 300, 320, 330, 336, 300, 260, 320, 335, 340, 330, 300, 240, 180, 150, 130, 122,
];
const ACTUAL_OUTPUT = [
  110, 108, 104, 100, 96, 94, 118, 190, 268, 296, 312, 318, 210, 230, 298, 318, 328, 312, 280, 210, 150, 128, 112, 108,
];

const CHART_DATA: ChartPoint[] = HOURS.map((time, i) => ({
  time,
  target: TARGET_OUTPUT[i],
  actual: ACTUAL_OUTPUT[i],
}));

const TOP_MACHINES = [
  { name: "CNC-04", units: 128 },
  { name: "Press-02", units: 96 },
  { name: "Line A — Cell 1", units: 88 },
  { name: "Weld-11", units: 54 },
  { name: "Line A — Cell 3", units: 21 },
];

const DOWNTIME_REASONS = [
  { icon: Repeat, label: "Changeover", minutes: 18, share: "43%" },
  { icon: PackageX, label: "Material wait", minutes: 11, share: "26%" },
  { icon: OctagonAlert, label: "Unplanned stop", minutes: 8, share: "19%" },
  { icon: Wrench, label: "Maintenance", minutes: 5, share: "12%" },
];

export default function OverviewPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Overview</h1>
        <button
          type="button"
          className="flex items-center gap-1 rounded-full border border-border bg-background px-3.5 py-1.5 text-sm font-medium text-foreground"
        >
          Today
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Uptime" value="97.8%" tooltip="Share of scheduled time the line was running" />
        <StatCard label="OEE" value="84.2%" tooltip="Overall equipment effectiveness" />
        <StatCard label="Downtime" value="42m" tooltip="Unplanned stop time this shift" />
        <StatCard label="Units/hr" value="318" tooltip="Trailing hourly output rate" trend={{ direction: "up", label: "+6%" }} />
        <StatCard label="Active machines" value="26/28" tooltip="Machines currently reporting" />
        <StatCard label="Defect rate" value="1.4%" tooltip="Units flagged at inspection" trend={{ direction: "down", label: "-0.3%" }} />
      </div>

      <OverviewLineChart
        data={CHART_DATA}
        series={[
          { key: "target", label: "target", color: "#B4B4BC", strokeWidth: 1.5 },
          { key: "actual", label: "actual", color: "#3B82F6", strokeWidth: 2 },
        ]}
      />

      <div className="grid gap-3 md:grid-cols-3">
        <SectionCard icon={<Factory className="size-4" />} title="Top machines" seeAllHref="#">
          {TOP_MACHINES.map((machine) => (
            <ListRow
              key={machine.name}
              leading={<span className="size-1.5 rounded-full bg-[#3B82F6]/40" />}
              label={machine.name}
              value={machine.units}
            />
          ))}
        </SectionCard>

        <SectionCard icon={<AlertTriangle className="size-4" />} title="Downtime reasons" seeAllHref="#">
          {DOWNTIME_REASONS.map((reason) => (
            <ListRow
              key={reason.label}
              leading={<reason.icon className="size-3.5 text-muted-foreground" />}
              label={reason.label}
              value={`${reason.minutes}m`}
              meta={reason.share}
            />
          ))}
        </SectionCard>

        <SectionCard icon={<ShieldCheck className="size-4" />} title="Quality" seeAllHref="#">
          <div className="rounded-md border border-dashed border-border px-3 py-4 text-sm leading-relaxed text-muted-foreground">
            No defects flagged this shift. Vision inspection is connected and reporting normally.
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
