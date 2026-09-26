import { Check, Lock, X } from "lucide-react";
import type { ReactNode } from "react";
import { plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PremlrStatus, Round } from "@/types/api";
import { Spinner } from "../ui";
import { MAX_ROUNDS, ROUND_STATUS_LABEL } from "./draft-utils";

type RowState = PremlrStatus | "active" | "done";

const ICON: Record<RowState, string> = {
  ready: "bg-lime text-forest",
  done: "bg-lime text-forest",
  needs_changes: "bg-flame/15 text-[#a84300]",
  blocked: "bg-alert text-white",
  active: "",
};

const STATUS_TEXT: Record<PremlrStatus, string> = {
  ready: "text-forest",
  needs_changes: "text-[#a84300]",
  blocked: "text-alert-ink",
};

function Row({ state, last, children }: { state: RowState; last: boolean; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center">
        <span className={cn("grid size-6 shrink-0 place-items-center rounded-full", ICON[state])}>
          {(state === "ready" || state === "done") && <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />}
          {state === "needs_changes" && <X className="size-3.5" strokeWidth={3} aria-hidden="true" />}
          {state === "blocked" && <Lock className="size-3" strokeWidth={2.75} aria-hidden="true" />}
          {state === "active" && <Spinner />}
        </span>
        {!last && <span aria-hidden="true" className="my-1 w-px flex-1 bg-oat" />}
      </div>
      <div className={cn("min-w-0 pt-0.5 text-[14px] leading-[1.45]", !last && "pb-4")}>{children}</div>
    </li>
  );
}

/**
 * The fix agent's evaluator loop, one row per pre-MLR round: "Round 1 · Blocked · Every claim traced to the label"
 * → "Round 3 · Ready". Live (the agent is still working), it starts with the first draft and ends with what's
 * running now.
 */
export function RoundsTimeline({ rounds, live = false, className }: { rounds: Round[]; live?: boolean; className?: string }) {
  const sorted = [...rounds].sort((a, b) => a.round - b.round);
  const last = sorted.at(-1);
  const revising = live && last !== undefined && last.status !== "ready" && sorted.length < MAX_ROUNDS;

  return (
    <ol className={cn("flex flex-col", className)}>
      {live && (
        <Row state={last ? "done" : "active"} last={!last}>
          {last ? (
            "First draft written from the FDA label"
          ) : (
            <span className="font-medium">Writing a first draft from the FDA label, then checking it…</span>
          )}
        </Row>
      )}
      {sorted.map((round, i) => {
        const passed = round.checks?.filter((c) => c.passed).length ?? 0;
        return (
          <Row key={round.round} state={round.status} last={i === sorted.length - 1 && !revising}>
            <span className="font-medium">Round {round.round}</span>
            <span className="text-taupe"> · </span>
            <span className={cn("font-medium", STATUS_TEXT[round.status])}>{ROUND_STATUS_LABEL[round.status]}</span>
            {round.failed.length > 0 ? (
              <span className="text-stone"> · {round.failed.join(", ")}</span>
            ) : (
              round.checks && (
                <span className="text-stone">
                  {" · "}
                  {passed === round.checks.length ? `all ${plural(passed, "check")} pass` : `${passed} of ${round.checks.length} checks pass`}
                </span>
              )
            )}
          </Row>
        );
      })}
      {revising && last && (
        <Row state="active" last>
          <span className="font-medium">Round {last.round + 1}</span>
          <span className="text-stone"> · Revising what failed, then checking again…</span>
        </Row>
      )}
    </ol>
  );
}
