"use client";

import { Check, ExternalLink, TriangleAlert, X } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { api, errorMessage } from "@/lib/api";
import { ISSUE_LABEL, bareDomain } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Answer, Cell, CellState } from "@/types/api";
import { Markdown } from "../Markdown";
import { Badge, Skeleton } from "../ui";
import { SEVERITY_LABEL, quoteText } from "./report-utils";
import { StateMark } from "./StateMark";

export type Selection = { promptId: number; engine: string };

function answerState(a: Answer): CellState {
  if (a.error) return "error";
  if (!a.shown) return "not_shown";
  if (a.mentioned) return "you";
  return a.competitors_mentioned.length ? "competitor" : "none";
}

type DialogProps = {
  reportId: string;
  brand: string;
  selection: Selection;
  question: string;
  engineLabel: string;
  cell?: Cell;
  onClose: () => void;
};

/** Side sheet (bottom sheet on a phone) with every sample behind one grid cell. Claude's three answers are tabs. */
export function AnswerDialog({ reportId, brand, selection, question, engineLabel, cell, onClose }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const [answers, setAnswers] = useState<Answer[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .answers(reportId, selection.promptId, selection.engine)
      .then((list) => !cancelled && setAnswers([...list].sort((a, b) => a.sample - b.sample)))
      .catch((err) => !cancelled && setError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [reportId, selection.promptId, selection.engine]);

  function onTabKey(event: KeyboardEvent) {
    if (!answers || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const last = answers.length - 1;
    const next =
      event.key === "Home" ? 0 : event.key === "End" ? last : event.key === "ArrowRight" ? (tab + 1) % answers.length : (tab + answers.length - 1) % answers.length;
    setTab(next);
    tabs.current[next]?.focus();
  }

  const current = answers?.[tab];
  const multi = (answers?.length ?? 0) > 1;

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      aria-labelledby="answer-dialog-title"
      className="m-0 ml-auto h-dvh max-h-dvh w-full max-w-[680px] bg-white p-0 backdrop:bg-black/40 max-sm:mt-auto max-sm:h-[92dvh] max-sm:rounded-t-3xl sm:rounded-l-3xl"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-oat/70 px-5 py-5 md:px-6">
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-stone">{engineLabel}</p>
            <p id="answer-dialog-title" className="mt-1 font-display text-[20px] leading-[1.25] font-medium text-balance">
              “{question}”
            </p>
            {cell && <CellVerdict cell={cell} brand={brand} />}
          </div>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label="Close"
            className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full bg-sand transition-colors hover:bg-oat focus-visible:outline-2 focus-visible:outline-royal"
          >
            <X className="size-4" />
          </button>
        </div>

        {multi && answers && (
          <div role="tablist" aria-label="Answers" onKeyDown={onTabKey} className="flex gap-1.5 overflow-x-auto border-b border-oat/70 px-5 py-3 md:px-6">
            {answers.map((a, i) => (
              <button
                key={a.id}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`answer-tab-${i}`}
                aria-selected={tab === i}
                aria-controls="answer-panel"
                tabIndex={tab === i ? 0 : -1}
                onClick={() => setTab(i)}
                className={cn(
                  "inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-full px-3.5 text-[14px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal",
                  tab === i ? "bg-black text-white" : "bg-sand text-black hover:bg-oat"
                )}
              >
                <StateMark state={answerState(a)} className="size-3.5 rounded-[4px] md:size-3.5 md:rounded-[4px] [&>svg]:size-2.5" />
                Answer {i + 1}
              </button>
            ))}
          </div>
        )}

        <div
          id="answer-panel"
          role={multi ? "tabpanel" : undefined}
          aria-labelledby={multi ? `answer-tab-${tab}` : undefined}
          className="flex-1 overflow-y-auto px-5 py-5 md:px-6"
        >
          {error && <p className="text-[15px] text-alert-ink">{error}</p>}
          {!answers && !error && (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-7 w-2/3" />
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          )}
          {answers && answers.length === 0 && <p className="text-[15px] text-stone">No answer was stored for this cell.</p>}
          {current && <Sample key={current.id} answer={current} brand={brand} />}
        </div>
      </div>
    </dialog>
  );
}

function CellVerdict({ cell, brand }: { cell: Cell; brand: string }) {
  const [votedYes, asked] = (cell.votes ?? "").split("/");
  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {cell.state === "you" && <Badge tone="royal">Names {brand}{cell.position ? ` · #${cell.position}` : ""}</Badge>}
      {cell.state === "competitor" && <Badge className="bg-stone/12">A competitor instead</Badge>}
      {cell.state === "none" && <Badge>Names neither</Badge>}
      {cell.state === "not_shown" && <Badge>No AI answer shown</Badge>}
      {cell.state === "error" && <Badge>No answer</Badge>}
      {cell.label_conflict && (
        <Badge tone="alert">
          <TriangleAlert className="size-3.5" strokeWidth={2.5} aria-hidden="true" /> Contradicts your label
        </Badge>
      )}
      {cell.samples && cell.samples > 1 && votedYes !== undefined && asked && (
        <span className="text-[13px] text-stone">
          {votedYes} of {asked} answers name {brand}; the check follows the majority.
        </span>
      )}
    </div>
  );
}

function CheckPill({ ok, bad = false, children }: { ok: boolean; bad?: boolean; children: ReactNode }) {
  return (
    <li
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium whitespace-nowrap",
        ok ? "bg-pass-soft text-forest" : bad ? "bg-alert-soft text-alert-ink" : "bg-sand text-graphite"
      )}
    >
      {ok ? (
        <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
      ) : bad ? (
        <TriangleAlert className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
      ) : (
        <X className="size-3.5" strokeWidth={3} aria-hidden="true" />
      )}
      {children}
    </li>
  );
}

function Sample({ answer, brand }: { answer: Answer; brand: string }) {
  if (answer.error) {
    return (
      <p className="rounded-xl bg-sand px-4 py-3 text-[14px] leading-[1.5] text-graphite">
        This engine didn&apos;t answer, so there&apos;s nothing to check. <span className="text-stone">({answer.error})</span>
      </p>
    );
  }
  if (!answer.shown) {
    return (
      <p className="rounded-xl bg-sand px-4 py-3 text-[14px] leading-[1.5] text-graphite">
        Google showed no AI answer for this question. That&apos;s neither good nor bad: there was nothing to check.
      </p>
    );
  }

  const issues = answer.accuracy_issues;
  return (
    <>
      <ul aria-label="Checks for this answer" className="flex flex-wrap gap-1.5">
        <CheckPill ok={answer.mentioned}>
          {answer.mentioned ? `Names ${brand}${answer.position ? ` · #${answer.position}` : ""}` : `Doesn't name ${brand}`}
        </CheckPill>
        {answer.mentioned && (
          <CheckPill ok={issues.length === 0} bad>
            {issues.length === 0 ? "Matches your label" : `Contradicts your label · ${issues.length}`}
          </CheckPill>
        )}
        <CheckPill ok={answer.cites_you}>{answer.cites_you ? "Cites your site" : "Doesn't cite your site"}</CheckPill>
      </ul>

      {answer.competitors_mentioned.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[13px] text-stone">{answer.mentioned ? "Also names" : "Recommends instead"}</span>
          {answer.competitors_mentioned.map((c) => (
            <Badge key={c} className="bg-stone/12">
              {c}
            </Badge>
          ))}
        </div>
      )}

      {issues.length > 0 && (
        <div className="mt-5 flex flex-col gap-2">
          {issues.map((issue, i) => (
            <div key={i} className="rounded-xl border border-alert-line bg-alert-soft px-4 py-3 text-[14px] leading-[1.5]">
              <p className="text-[12px] font-medium text-alert-ink">
                {ISSUE_LABEL[issue.type]} · {SEVERITY_LABEL[issue.severity]}
              </p>
              <p className="mt-1 font-medium text-alert-ink">“{quoteText(issue.ai_sentence)}”</p>
              <p className="mt-1.5 text-forest">
                <span className="text-stone">FDA label: </span>
                {quoteText(issue.label_sentence)}
              </p>
              <p className="mt-1.5 text-graphite">{issue.explanation}</p>
            </div>
          ))}
        </div>
      )}

      <Markdown className="mt-5 text-[15px]">{answer.text || "_No answer text._"}</Markdown>

      {answer.citations.length > 0 && (
        <div className="mt-6 border-t border-oat/70 pt-4">
          <p className="text-[13px] font-medium text-stone">Sources cited · {answer.citations.length}</p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {answer.citations.map((c, i) => (
              <li key={`${c.url}:${i}`}>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-2 text-[14px] leading-[1.4]"
                >
                  <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-stone" aria-hidden="true" />
                  <span className="min-w-0 break-words">
                    <span className="group-hover:underline">{c.title || bareDomain(c.url)}</span>{" "}
                    <span className="text-taupe">{bareDomain(c.url)}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
