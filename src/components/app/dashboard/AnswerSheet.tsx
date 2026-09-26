"use client";

import { ExternalLink, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { AUDIENCE_SINGULAR, ISSUE_LABEL, bareDomain, plainText, plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Answer, Cell, Report, ReportQuestion } from "@/types/api";
import { Markdown } from "../Markdown";
import { Badge, Skeleton } from "../ui";
import { EngineMark, reportEngineLabel } from "./engines";
import { useApi } from "./useApi";

export type Selection = { promptId: number; engine: string };

/**
 * Side sheet (bottom sheet on phones) with every sample AI gave for one question on one engine: the full answer,
 * the sources it cited, and any sentence that contradicts the label.
 */
export function AnswerSheet({ report, selection, onClose }: { report: Report; selection: Selection; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const { promptId, engine } = selection;
  const question = report.questions.find((q) => q.id === promptId);
  const cell = question?.cells[engine];
  const answers = useApi(`answers:${report.id}:${promptId}:${engine}`, () => api.answers(report.id, promptId, engine));
  const [tab, setTab] = useState(0);
  const samples = answers.data ?? [];
  const current = samples[Math.min(tab, Math.max(samples.length - 1, 0))];

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      aria-labelledby="answer-sheet-title"
      className="m-0 ml-auto h-dvh max-h-dvh w-full max-w-[680px] bg-white p-0 backdrop:bg-black/40 max-sm:mt-auto max-sm:h-[92dvh] max-sm:rounded-t-3xl sm:rounded-l-3xl"
    >
      <div className="flex h-full flex-col">
        <div className="border-b border-oat/70 px-5 py-5 md:px-7">
          <div className="flex items-start justify-between gap-4">
            <p className="flex items-center gap-2 text-[14px] font-medium">
              <EngineMark engine={engine} />
              {reportEngineLabel(report, engine)}
            </p>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              aria-label="Close"
              className="-mt-1 grid size-9 shrink-0 cursor-pointer place-items-center rounded-full bg-sand transition-colors hover:bg-oat focus-visible:outline-2 focus-visible:outline-royal"
            >
              <X className="size-4" />
            </button>
          </div>
          <p id="answer-sheet-title" className="mt-3 font-display text-[20px] leading-[1.25] font-medium tracking-[-0.01em] md:text-[22px]">
            “{question?.text}”
          </p>
          {question && <QuestionMeta question={question} className="mt-2" />}
          {cell && <Verdict cell={cell} brand={report.product.brand} className="mt-4" />}
        </div>

        {samples.length > 1 && (
          <div role="tablist" aria-label="Answers" className="flex gap-1 overflow-x-auto border-b border-oat/70 px-5 py-2.5 md:px-7">
            {samples.map((a, i) => (
              <button
                key={a.id}
                type="button"
                role="tab"
                aria-selected={i === tab}
                onClick={() => setTab(i)}
                className={cn(
                  "flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-full px-3.5 text-[14px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-royal",
                  i === tab ? "bg-black text-white" : "text-graphite hover:bg-sand"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-2 rounded-full",
                    a.mentioned ? "bg-royal" : a.competitors_mentioned.length ? "bg-stone/50" : "border border-oat"
                  )}
                />
                Answer {i + 1}
                <span className="sr-only">{a.mentioned ? ", names you" : ", doesn't name you"}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-5 md:px-7">
          {answers.error ? (
            <p className="text-[15px] text-alert-ink">{answers.error}</p>
          ) : answers.data === undefined ? (
            <div className="flex flex-col gap-3" aria-busy="true">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-10/12" />
            </div>
          ) : current ? (
            <AnswerBody answer={current} engineLabel={reportEngineLabel(report, engine)} />
          ) : (
            <p className="text-[15px] text-stone">No answer was stored for this question.</p>
          )}
        </div>
      </div>
    </dialog>
  );
}

export function QuestionMeta({ question, className }: { question: ReportQuestion; className?: string }) {
  return (
    <span className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-stone", className)}>
      <span>{AUDIENCE_SINGULAR[question.audience]}</span>
      {question.source === "google_paa" && (
        <Badge tone="white" className="h-5 gap-1 px-2 text-[11px]">
          <EngineMark engine="google_aio" size={10} />
          Asked on Google
        </Badge>
      )}
    </span>
  );
}

function Verdict({ cell, brand, className }: { cell: Cell; brand: string; className?: string }) {
  const rivals = cell.competitors_mentioned ?? [];
  const votes = cell.votes && cell.samples && cell.samples > 1 ? `${cell.votes.replace("/", " of ")} answers` : null;
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {cell.state === "you" && (
        <Badge tone="royal">
          Names {brand}
          {cell.position ? ` · #${cell.position}` : ""}
        </Badge>
      )}
      {cell.state === "competitor" && <Badge>A competitor instead</Badge>}
      {cell.state === "none" && <Badge tone="white">Names neither</Badge>}
      {cell.state === "not_shown" && <Badge tone="white">No AI answer shown</Badge>}
      {cell.state === "error" && <Badge tone="white">No answer</Badge>}
      {votes && <span className="text-[12px] text-stone">{votes} name {brand}</span>}
      {rivals.length > 0 && (
        <span className="ml-1 text-[12px] text-stone">{cell.state === "competitor" ? "Named instead:" : "Also named:"}</span>
      )}
      {rivals.map((c) => (
        <Badge key={c} className="bg-stone/12">
          {c}
        </Badge>
      ))}
      {cell.label_conflict && <Badge tone="alert">Contradicts the label</Badge>}
      {cell.cites_you && <Badge tone="lime">Cites your site</Badge>}
    </div>
  );
}

function AnswerBody({ answer, engineLabel }: { answer: Answer; engineLabel: string }) {
  if (answer.error) {
    return (
      <p className="rounded-xl bg-sand px-4 py-3 text-[15px] leading-[1.5] text-graphite">
        {engineLabel} didn&apos;t answer this time: {answer.error}
      </p>
    );
  }
  if (!answer.shown) {
    return (
      <p className="rounded-xl bg-offwhite px-4 py-3 text-[15px] leading-[1.5] text-graphite">
        Google showed no AI answer for this question. That&apos;s neither good nor bad: there was nothing to be named in.
      </p>
    );
  }
  return (
    <>
      {answer.accuracy_issues.length > 0 && (
        <div className="mb-5 flex flex-col gap-2">
          {answer.accuracy_issues.map((issue, i) => (
            <div key={i} className="rounded-xl border border-alert-line bg-alert-soft px-4 py-3 text-[14px] leading-[1.5]">
              <p className="font-medium text-alert-ink">
                {ISSUE_LABEL[issue.type]}: “{plainText(issue.ai_sentence)}”
              </p>
              <p className="mt-1.5 text-graphite">
                <span className="font-medium text-forest">FDA label:</span> {plainText(issue.label_sentence)}
              </p>
              {issue.explanation && <p className="mt-1.5 text-stone">{issue.explanation}</p>}
            </div>
          ))}
        </div>
      )}
      <Markdown className="text-[15px] break-words">{answer.text || "_No answer text._"}</Markdown>
      {answer.citations.length > 0 && (
        <div className="mt-6 border-t border-oat/70 pt-4">
          <p className="text-[13px] font-medium text-stone">Sources cited · {answer.citations.length}</p>
          <ul className="mt-2 flex flex-col gap-2">
            {answer.citations.map((c, i) => (
              <li key={`${c.url}-${i}`}>
                <a href={c.url} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-2 text-[14px] leading-[1.4]">
                  <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-stone" />
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
      {answer.citations.length === 0 && (
        <p className="mt-6 border-t border-oat/70 pt-4 text-[13px] text-stone">No sources cited in this answer.</p>
      )}
      <p className="mt-4 text-[12px] text-taupe">
        {answer.mentioned ? "Names your drug" : "Doesn't name your drug"}
        {answer.competitors_mentioned.length > 0 && ` · names ${plural(answer.competitors_mentioned.length, "competitor")}`}
      </p>
    </>
  );
}
