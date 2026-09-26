import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Cell } from "@/types/api";

type AnswerCellProps = {
  cell?: Cell;
  /** The engine is part of this scan but hasn't answered yet. */
  pending?: boolean;
  /** The engine isn't live yet (ChatGPT, Gemini, Perplexity). */
  comingSoon?: boolean;
  className?: string;
};

function votesNote(cell: Cell): string {
  return cell.votes && cell.samples && cell.samples > 1 ? ` (${cell.votes.replace("/", " of ")} answers)` : "";
}

// One question × engine: a check, not a score. Royal "You" pill (with position), stone competitor pill, a dash when
// neither is named, "no answer shown" when Google shows no AI Overview, and a red warning when it contradicts the label.
export function AnswerCell({ cell, pending, comingSoon, className }: AnswerCellProps) {
  if (comingSoon) {
    return <span className={cn("text-[12px] text-oat", className)}>Soon</span>;
  }
  if (!cell) {
    return pending ? (
      <span aria-label="Waiting for answer" className={cn("block h-7 w-16 animate-pulse rounded-full bg-sand", className)} />
    ) : (
      <span aria-label="Not asked" className={cn("text-[15px] text-oat", className)}>
        ·
      </span>
    );
  }

  if (cell.state === "error") {
    return (
      <span title={cell.error ?? "No answer"} className={cn("inline-flex h-7 items-center rounded-full bg-sand px-2.5 text-[12px] text-stone", className)}>
        No answer
      </span>
    );
  }

  if (cell.state === "not_shown") {
    return (
      <span title="Google showed no AI answer for this question" className={cn("text-[12px] whitespace-nowrap text-taupe", className)}>
        Not shown
      </span>
    );
  }

  // `relative`: the sr-only text is absolutely positioned; without a positioned ancestor its containing block is the
  // page, so it would escape the grid's scroll container and widen the page on phones.
  const conflict = cell.label_conflict && (
    <span title="Contradicts your FDA label" className="relative">
      <TriangleAlert className="size-4 text-alert" strokeWidth={2.5} aria-hidden="true" />
      <span className="sr-only">Contradicts your label</span>
    </span>
  );

  if (cell.state === "you") {
    return (
      <span className={cn("inline-flex items-center gap-1.5", className)}>
        <span
          title={`Names you${cell.position ? ` at position ${cell.position}` : ""}${votesNote(cell)}`}
          className="inline-flex h-7 animate-[fade-up_0.35s_ease-out_both] items-center rounded-full bg-royal/15 px-2.5 text-[12px] font-medium whitespace-nowrap text-royal-dark"
        >
          You{cell.position ? ` #${cell.position}` : ""}
        </span>
        {conflict}
      </span>
    );
  }

  const [first, ...rest] = cell.competitors_mentioned ?? [];
  if (cell.state === "competitor" && first) {
    return (
      <span className={cn("inline-flex items-center gap-1.5", className)}>
        <span
          title={`Recommends instead: ${(cell.competitors_mentioned ?? []).join(", ")}${votesNote(cell)}`}
          className="inline-flex h-7 max-w-[128px] animate-[fade-up_0.35s_ease-out_both] items-center rounded-full bg-stone/12 px-2.5 text-[12px] font-medium whitespace-nowrap text-graphite"
        >
          <span className="truncate">{first}</span>
          {rest.length > 0 && <span className="ml-1 text-stone">+{rest.length}</span>}
        </span>
        {conflict}
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span aria-label="Neither you nor a competitor named" className="text-[15px] text-taupe">
        —
      </span>
      {conflict}
    </span>
  );
}

export function AnswerLegend({ className, multiSample = false }: { className?: string; multiSample?: boolean }) {
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
      <li className="flex items-center gap-2">
        <span className="text-[12px] text-taupe">Not shown</span>
        No Google AI answer
      </li>
      {multiSample && <li className="text-[12px]">Claude is asked 3 times; a cell shows what most answers said.</li>}
    </ul>
  );
}
