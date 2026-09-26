import { cn } from "@/lib/utils";
import type { CellState, PremlrStatus, Tally } from "@/types/api";
import { Badge, type Tone } from "../ui";

// Every number on the dashboard is a count of yes/no checks. A check strip draws them one square per check, so
// "4 of 6" is four royal squares out of six, never a bar or a percentage.

const SQUARE: Record<CellState, string> = {
  you: "bg-royal",
  competitor: "bg-stone/45",
  none: "border border-oat bg-white",
  not_shown: "bg-sand",
  error: "border border-dashed border-oat",
};

const ORDER: CellState[] = ["you", "competitor", "none", "not_shown", "error"];

export type Check = { state: CellState; title?: string };

/** A tally as squares, "you" first. */
export function tallyChecks(tally: Tally): Check[] {
  return ORDER.flatMap((state) => Array.from({ length: tally[state] }, () => ({ state })));
}

/** Squares sorted by state, so strips read like counts and line up across engines and weeks. */
export function sortChecks(checks: Check[]): Check[] {
  return [...checks].sort((a, b) => ORDER.indexOf(a.state) - ORDER.indexOf(b.state));
}

export function CheckStrip({
  checks,
  label,
  size = "md",
  className,
}: {
  checks: Check[];
  /** What the strip says, for screen readers ("4 of 6 unbranded questions name Opzelura"). */
  label: string;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span role="img" aria-label={label} className={cn("flex flex-wrap", size === "sm" ? "gap-[3px]" : "gap-1", className)}>
      {checks.map((check, i) => (
        <span
          key={i}
          title={check.title}
          className={cn(size === "sm" ? "size-2.5 rounded-[3px]" : "size-3.5 rounded-[4px]", SQUARE[check.state])}
        />
      ))}
    </span>
  );
}

export function CheckLegend({ brand, className }: { brand: string; className?: string }) {
  const items: [CellState, string][] = [
    ["you", `Names ${brand}`],
    ["competitor", "A competitor instead"],
    ["none", "Neither"],
    ["not_shown", "No AI answer shown"],
  ];
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-stone", className)}>
      {items.map(([state, label]) => (
        <li key={state} className="flex items-center gap-1.5">
          <span aria-hidden="true" className={cn("size-2.5 rounded-[3px]", SQUARE[state])} />
          {label}
        </li>
      ))}
    </ul>
  );
}

const STATE_LABEL: Record<CellState, string> = {
  you: "Names you",
  competitor: "Competitor",
  none: "Neither",
  not_shown: "Not shown",
  error: "No answer",
};

/** One check's state as a small pill (the before → after of a change). */
export function StatePill({ state, className }: { state: CellState; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center rounded-full px-2 text-[12px] leading-none font-medium whitespace-nowrap",
        state === "you" && "bg-royal/15 text-royal-dark",
        state === "competitor" && "bg-stone/12 text-graphite",
        state === "none" && "border border-oat bg-white text-stone",
        (state === "not_shown" || state === "error") && "bg-sand text-taupe",
        className
      )}
    >
      {STATE_LABEL[state]}
    </span>
  );
}

const DRAFT_STATUS: Record<PremlrStatus, { label: string; tone: Tone }> = {
  ready: { label: "Ready for MLR review", tone: "lime" },
  needs_changes: { label: "Needs changes", tone: "flame" },
  blocked: { label: "Blocked", tone: "alert" },
};

/** Pre-MLR status of a draft. Older drafts may have none. */
export function DraftStatusBadge({ status, className }: { status: PremlrStatus | null | undefined; className?: string }) {
  const known = status ? DRAFT_STATUS[status] : undefined;
  return (
    <Badge tone={known?.tone ?? "sand"} className={className}>
      {known?.label ?? "Draft"}
    </Badge>
  );
}
