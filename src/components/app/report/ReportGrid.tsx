"use client";

import { useState } from "react";
import { AUDIENCE_SINGULAR } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Report } from "@/types/api";
import { AnswerCell, AnswerLegend } from "../AnswerCell";
import { SectionTitle } from "../ui";
import { AnswerDialog, type Selection } from "./AnswerDialog";
import { KIND_LABEL } from "./report-utils";

const PREVIEW_ROWS = 12;

type GridProps = Pick<Report, "id" | "questions" | "engines" | "coming_soon"> & { brand: string };

/** "Every answer": question × engine. A cell opens every sample behind it: text, citations, label checks. */
export function ReportGrid({ id, questions, engines, coming_soon: comingSoon, brand }: GridProps) {
  const [showAll, setShowAll] = useState(false);
  const [selected, setSelected] = useState<Selection | null>(null);
  const rows = showAll ? questions : questions.slice(0, PREVIEW_ROWS);
  const multiSample = engines.some((e) => e.samples > 1);
  const selectedQuestion = selected && questions.find((q) => q.id === selected.promptId);
  const selectedEngine = selected && engines.find((e) => e.name === selected.engine);

  return (
    <section id="every-answer" aria-labelledby="answers-title" className="scroll-mt-24">
      <SectionTitle>
        <span id="answers-title">Every answer</span>
      </SectionTitle>
      <p className="mt-1.5 text-[15px] text-stone">Open any cell to read what AI said, which sources it cited, and how it checks against the label.</p>
      <AnswerLegend className="mt-5 mb-3" multiSample={multiSample} />
      <div className="overflow-x-auto rounded-2xl border border-oat/70 bg-white">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="text-[13px] text-stone">
              <th scope="col" className="sticky left-0 z-10 w-[210px] min-w-[210px] bg-white px-4 py-3 font-medium md:w-[40%]">
                Question
              </th>
              {engines.map((engine) => (
                <th key={engine.name} scope="col" className="px-3 py-3 font-medium">
                  {engine.label}
                  {engine.samples > 1 && <span className="block text-[11px] font-normal text-taupe">asked {engine.samples}×</span>}
                </th>
              ))}
              {comingSoon.map((engine) => (
                <th key={engine.name} scope="col" className="px-3 py-3 font-medium text-taupe">
                  {engine.label}
                  <span className="block text-[11px] font-normal">Coming soon</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((q) => (
              <tr key={q.id} className="border-t border-oat/50">
                <th scope="row" className="sticky left-0 z-10 bg-white px-4 py-3 text-[14px] leading-[1.4] font-normal">
                  {q.text}
                  <span className="mt-1 block text-[12px] text-taupe">
                    {AUDIENCE_SINGULAR[q.audience]} · {KIND_LABEL[q.kind]}
                    {q.source === "google_paa" && " · Asked on Google"}
                  </span>
                </th>
                {engines.map((engine) => {
                  const cell = q.cells[engine.name];
                  const openable = cell && cell.error !== "not asked";
                  return (
                    <td key={engine.name} className="px-2 py-2">
                      {openable ? (
                        <button
                          type="button"
                          onClick={() => setSelected({ promptId: q.id, engine: engine.name })}
                          aria-label={`Read the ${engine.label} ${engine.samples > 1 ? "answers" : "answer"} to: ${q.text}`}
                          className={cn(
                            "cursor-pointer rounded-xl p-1 transition-colors hover:bg-offwhite focus-visible:outline-2 focus-visible:outline-royal"
                          )}
                        >
                          <AnswerCell cell={cell} />
                        </button>
                      ) : (
                        <AnswerCell cell={cell} className="px-1" />
                      )}
                    </td>
                  );
                })}
                {comingSoon.map((engine) => (
                  <td key={engine.name} className="px-3 py-2">
                    <AnswerCell comingSoon />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {questions.length > PREVIEW_ROWS && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-3 cursor-pointer text-[14px] font-medium text-royal-dark underline-offset-4 hover:underline"
        >
          {showAll ? "Show fewer" : `Show all ${questions.length} questions`}
        </button>
      )}

      {selected && selectedQuestion && (
        <AnswerDialog
          key={`${selected.promptId}:${selected.engine}`}
          reportId={id}
          brand={brand}
          selection={selected}
          question={selectedQuestion.text}
          engineLabel={selectedEngine?.label ?? selected.engine}
          cell={selectedQuestion.cells[selected.engine]}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  );
}
