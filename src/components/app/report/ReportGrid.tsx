"use client";

import { ExternalLink, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { AUDIENCE_SINGULAR, ISSUE_LABEL, bareDomain, engineLabel, plainText } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Answer, GridCell, Report } from "@/types/api";
import { AnswerCell, AnswerLegend } from "../AnswerCell";
import { Markdown } from "../Markdown";
import { Badge, SectionTitle, Skeleton } from "../ui";

const PREVIEW_ROWS = 10;

type Selection = { promptId: number; engine: string };

/** Every question × engine answer. A cell opens the full answer text, its citations and any label conflicts. */
export function ReportGrid({ report }: { report: Report }) {
  const engines = [...new Set(report.grid.map((c) => c.engine))];
  const cells = new Map(report.grid.map((c) => [`${c.prompt_id}:${c.engine}`, c]));
  const [showAll, setShowAll] = useState(false);
  const [selected, setSelected] = useState<Selection | null>(null);
  const rows = showAll ? report.prompts : report.prompts.slice(0, PREVIEW_ROWS);

  return (
    <section aria-labelledby="answers-title" className="mt-16">
      <SectionTitle>
        <span id="answers-title">Every answer</span>
      </SectionTitle>
      <p className="mt-1.5 text-[15px] text-stone">Open any cell to read what AI actually said and which sources it cited.</p>
      <AnswerLegend className="mt-5 mb-3" />
      <div className="overflow-x-auto rounded-2xl border border-oat/70 bg-white">
        <table className={cn("w-full border-collapse text-left", engines.length > 2 && "min-w-[720px]")}>
          <thead>
            <tr className="text-[13px] text-stone">
              <th scope="col" className="sticky left-0 z-10 bg-white px-4 py-3 font-medium">
                Question
              </th>
              {engines.map((engine) => (
                <th key={engine} scope="col" className="w-[112px] px-3 py-3 font-medium md:w-[140px]">
                  {engineLabel(engine)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((prompt) => (
              <tr key={prompt.id} className="border-t border-oat/50">
                <th scope="row" className="sticky left-0 z-10 bg-white px-4 py-3 text-[14px] leading-[1.4] font-normal">
                  {prompt.text}
                  <span className="mt-1 block text-[12px] text-taupe">{AUDIENCE_SINGULAR[prompt.audience]}</span>
                </th>
                {engines.map((engine) => {
                  const cell = cells.get(`${prompt.id}:${engine}`);
                  return (
                    <td key={engine} className="px-2 py-2">
                      {cell ? (
                        <button
                          type="button"
                          onClick={() => setSelected({ promptId: prompt.id, engine })}
                          aria-label={`Read the ${engineLabel(engine)} answer to: ${prompt.text}`}
                          className="cursor-pointer rounded-xl p-1 transition-colors hover:bg-offwhite focus-visible:outline-2 focus-visible:outline-royal"
                        >
                          <AnswerCell cell={cell} />
                        </button>
                      ) : (
                        <AnswerCell className="px-1" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {report.prompts.length > PREVIEW_ROWS && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-3 cursor-pointer text-[14px] font-medium text-royal-dark underline-offset-4 hover:underline"
        >
          {showAll ? "Show fewer" : `Show all ${report.prompts.length} questions`}
        </button>
      )}

      {selected && (
        <AnswerDialog
          reportId={report.id}
          selection={selected}
          question={report.prompts.find((p) => p.id === selected.promptId)?.text ?? ""}
          cell={cells.get(`${selected.promptId}:${selected.engine}`)}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  );
}

function AnswerDialog({
  reportId,
  selection,
  question,
  cell,
  onClose,
}: {
  reportId: string;
  selection: Selection;
  question: string;
  cell?: GridCell;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .answers(reportId, selection.promptId, selection.engine)
      .then((list) => !cancelled && setAnswer(list[0] ?? null))
      .catch((err) => !cancelled && setError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [reportId, selection]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      className="m-0 ml-auto h-dvh max-h-dvh w-full max-w-[640px] bg-white p-0 backdrop:bg-black/40 max-sm:mt-auto max-sm:h-[90dvh] max-sm:rounded-t-3xl sm:rounded-l-3xl"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-oat/70 px-6 py-5">
          <div className="min-w-0">
            <p className="text-[13px] text-stone">{engineLabel(selection.engine)}</p>
            <p className="mt-1 font-display text-[20px] leading-[1.25] font-medium">“{question}”</p>
            {cell && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {cell.mentioned ? (
                  <Badge tone="royal">Mentions you{cell.position ? ` · #${cell.position}` : ""}</Badge>
                ) : (
                  <Badge>Doesn&apos;t mention you</Badge>
                )}
                {cell.competitors_mentioned.map((c) => (
                  <Badge key={c} className="bg-stone/12">
                    {c}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label="Close"
            className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full bg-sand transition-colors hover:bg-oat"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {error && <p className="text-[15px] text-alert-ink">{error}</p>}
          {!answer && !error && (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          )}
          {answer && (
            <>
              {answer.accuracy_issues.length > 0 && (
                <div className="mb-5 flex flex-col gap-2">
                  {answer.accuracy_issues.map((issue, i) => (
                    <div key={i} className="rounded-xl border border-alert-line bg-alert-soft px-4 py-3 text-[14px] leading-[1.5]">
                      <p className="font-medium text-alert-ink">
                        {ISSUE_LABEL[issue.type]}: “{plainText(issue.ai_sentence)}”
                      </p>
                      <p className="mt-1 text-graphite">Label: {plainText(issue.label_sentence)}</p>
                    </div>
                  ))}
                </div>
              )}
              <Markdown className="text-[15px]">{answer.text || "_No answer text._"}</Markdown>
              {answer.citations.length > 0 && (
                <div className="mt-6 border-t border-oat/70 pt-4">
                  <p className="text-[13px] font-medium text-stone">Sources cited · {answer.citations.length}</p>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {answer.citations.map((c) => (
                      <li key={c.url}>
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-start gap-2 text-[14px] leading-[1.4]"
                        >
                          <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-stone" />
                          <span>
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
          )}
        </div>
      </div>
    </dialog>
  );
}
