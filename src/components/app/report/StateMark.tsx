import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CellState } from "@/types/api";

// One check as a small square: royal when AI names you, stone when it names a competitor instead, empty when it
// names neither, dashed when Google showed no AI answer, sand when the engine didn't answer.
const MARK: Record<CellState, string> = {
  you: "bg-royal text-white",
  competitor: "bg-stone/55",
  none: "border-[1.5px] border-oat bg-white",
  not_shown: "border-[1.5px] border-dashed border-taupe/70 bg-white",
  error: "bg-sand",
};

export function StateMark({ state, label, className }: { state: CellState; label?: string; className?: string }) {
  return (
    <span
      title={label}
      className={cn("inline-grid size-5 shrink-0 place-items-center rounded-[6px] md:size-6 md:rounded-[7px]", MARK[state], className)}
    >
      {state === "you" && <Check aria-hidden="true" className="size-3 md:size-3.5" strokeWidth={3.5} />}
      {label && <span className="sr-only">{label}</span>}
    </span>
  );
}

export function MarkLegend({ brand, className, showError = false }: { brand: string; className?: string; showError?: boolean }) {
  const items: { state: CellState; text: string }[] = [
    { state: "you", text: `Names ${brand}` },
    { state: "competitor", text: "A competitor instead" },
    { state: "none", text: "Neither" },
    { state: "not_shown", text: "No AI answer shown" },
    ...(showError ? [{ state: "error" as const, text: "No answer (engine error)" }] : []),
  ];
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-stone", className)}>
      {items.map(({ state, text }) => (
        <li key={state} className="flex items-center gap-2">
          <StateMark state={state} className="size-4 rounded-[5px] md:size-4 md:rounded-[5px] [&>svg]:size-2.5" />
          {text}
        </li>
      ))}
    </ul>
  );
}
