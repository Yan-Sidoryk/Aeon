import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnswerEvent, GridCell } from "@/types/api";

type AnswerCellProps = {
  cell?: GridCell | AnswerEvent;
  /** The engine is part of this scan but hasn't answered yet. */
  pending?: boolean;
  className?: string;
};

// One prompt × engine cell, as in the Track mock: royal "You" pill, stone competitor pill, a dash when neither is
// named, and a red warning when the answer contradicts the label.
export function AnswerCell({ cell, pending, className }: AnswerCellProps) {
  if (!cell) {
    return pending ? (
      <span aria-label="Waiting for answer" className={cn("block h-7 w-16 animate-pulse rounded-full bg-sand", className)} />
    ) : (
      <span aria-label="Not scanned" className={cn("text-[15px] text-oat", className)}>
        ·
      </span>
    );
  }

  if ("error" in cell && cell.error) {
    return (
      <span title={cell.error} className={cn("inline-flex h-7 items-center rounded-full bg-sand px-2.5 text-[12px] text-stone", className)}>
        No answer
      </span>
    );
  }

  const issues = cell.accuracy_issues > 0 && (
    <span title={`${cell.accuracy_issues} statement${cell.accuracy_issues === 1 ? "" : "s"} contradict the label`}>
      <TriangleAlert className="size-4 text-alert" strokeWidth={2.5} aria-hidden="true" />
      <span className="sr-only">{cell.accuracy_issues} accuracy issues</span>
    </span>
  );

  if (cell.mentioned) {
    return (
      <span className={cn("inline-flex items-center gap-1.5", className)}>
        <span className="inline-flex h-7 animate-[fade-up_0.35s_ease-out_both] items-center rounded-full bg-royal/15 px-2.5 text-[12px] font-medium whitespace-nowrap text-royal-dark">
          You{cell.position ? ` #${cell.position}` : ""}
        </span>
        {issues}
      </span>
    );
  }

  const [first, ...rest] = cell.competitors_mentioned;
  if (first) {
    return (
      <span className={cn("inline-flex items-center gap-1.5", className)}>
        <span
          title={`Recommended instead: ${cell.competitors_mentioned.join(", ")}`}
          className="inline-flex h-7 max-w-[128px] animate-[fade-up_0.35s_ease-out_both] items-center rounded-full bg-stone/12 px-2.5 text-[12px] font-medium whitespace-nowrap text-graphite"
        >
          <span className="truncate">{first}</span>
          {rest.length > 0 && <span className="ml-1 text-stone">+{rest.length}</span>}
        </span>
        {issues}
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span aria-label="Neither you nor a competitor named" className="text-[15px] text-taupe">
        —
      </span>
      {issues}
    </span>
  );
}

export function AnswerLegend({ className }: { className?: string }) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-stone", className)}>
      <li className="flex items-center gap-2">
        <span className="inline-flex h-6 items-center rounded-full bg-royal/15 px-2 text-[12px] font-medium text-royal-dark">You #2</span>
        AI names you (and where)
      </li>
      <li className="flex items-center gap-2">
        <span className="inline-flex h-6 items-center rounded-full bg-stone/12 px-2 text-[12px] font-medium text-graphite">Rival</span>
        A competitor instead
      </li>
      <li className="flex items-center gap-2">
        <TriangleAlert className="size-4 text-alert" strokeWidth={2.5} />
        Contradicts your label
      </li>
      <li className="flex items-center gap-2">
        <span className="text-taupe">—</span>
        Neither named
      </li>
    </ul>
  );
}
