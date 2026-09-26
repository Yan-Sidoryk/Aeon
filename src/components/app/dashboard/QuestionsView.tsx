"use client";

import { useState } from "react";
import { AUDIENCE_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Audience, QuestionKind, Report, ReportQuestion } from "@/types/api";
import { AnswerCell, AnswerLegend } from "../AnswerCell";
import { AnswerSheet, QuestionMeta, type Selection } from "./AnswerSheet";
import { EngineMark, shortEngineLabel } from "./engines";
import { PageHeading, WithReport } from "./parts";

const KINDS: QuestionKind[] = ["unbranded", "branded", "comparison", "off_label"];

const KIND_LABEL: Record<QuestionKind, string> = {
  unbranded: "Unbranded",
  branded: "Branded",
  comparison: "Comparison",
  off_label: "Off-label",
};

const KIND_NOTE: Record<QuestionKind, string> = {
  unbranded: "Don't name a drug, so AI chooses what to recommend",
  branded: "Name your drug",
  comparison: "Weigh your drug against a competitor",
  off_label: "Ask about uses outside the label; monitored, never promoted",
};

const AUDIENCES: Audience[] = ["patient", "caregiver", "hcp"];

type Filter<T> = T | "all";

type Group = { kind: QuestionKind; questions: ReportQuestion[] };

/** Questions: the question × engine grid of the latest scan. Every cell opens the answers behind it. */
export function QuestionsView() {
  return <WithReport>{(report) => <Questions report={report} />}</WithReport>;
}

function Questions({ report }: { report: Report }) {
  const [kind, setKind] = useState<Filter<QuestionKind>>("all");
  const [audience, setAudience] = useState<Filter<Audience>>("all");
  const [selected, setSelected] = useState<Selection | null>(null);
  const brand = report.product.brand;

  const kinds = KINDS.filter((k) => report.questions.some((q) => q.kind === k));
  const audiences = AUDIENCES.filter((a) => report.questions.some((q) => q.audience === a));
  const byAudience = report.questions.filter((q) => audience === "all" || q.audience === audience);
  const byKind = report.questions.filter((q) => kind === "all" || q.kind === kind);
  const shown = byAudience.filter((q) => kind === "all" || q.kind === kind);
  const groups: Group[] = kinds
    .map((k) => ({ kind: k, questions: shown.filter((q) => q.kind === k) }))
    .filter((g) => g.questions.length > 0);

  return (
    <div>
      <PageHeading
        title="Questions"
        description={`The ${report.questions.length} questions we ask AI about ${brand}, and what each engine answered in the latest scan. Open any answer to read it with its sources.`}
      />

      <div className="mt-6 flex flex-col gap-2.5">
        <Chips
          label="Question type"
          value={kind}
          onChange={setKind}
          options={[
            { value: "all", label: "All", count: byAudience.length },
            ...kinds.map((k) => ({ value: k, label: KIND_LABEL[k], count: byAudience.filter((q) => q.kind === k).length })),
          ]}
        />
        <Chips
          label="Audience"
          value={audience}
          onChange={setAudience}
          options={[
            { value: "all", label: "Everyone", count: byKind.length },
            ...audiences.map((a) => ({ value: a, label: AUDIENCE_LABEL[a], count: byKind.filter((q) => q.audience === a).length })),
          ]}
        />
      </div>

      <AnswerLegend className="mt-6 mb-3" multiSample={report.engines.some((e) => e.samples > 1)} />

      {groups.length === 0 ? (
        <p className="rounded-2xl border border-oat/70 bg-white px-4 py-10 text-center text-[15px] text-stone">
          No question matches these filters.
        </p>
      ) : (
        <>
          <QuestionCards report={report} groups={groups} onOpen={setSelected} />
          <QuestionTable report={report} groups={groups} onOpen={setSelected} />
        </>
      )}

      {selected && <AnswerSheet report={report} selection={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function namedCount(report: Report, question: ReportQuestion): { named: number; of: number } {
  const live = report.engines.filter((e) => question.cells[e.name]);
  return { named: live.filter((e) => question.cells[e.name].state === "you").length, of: live.length };
}

function GroupTitle({ group }: { group: Group }) {
  return (
    <span className="flex flex-wrap items-baseline gap-x-2 text-[13px]">
      <span className="font-medium text-black">
        {KIND_LABEL[group.kind]} · {group.questions.length}
      </span>
      <span className="text-stone">{KIND_NOTE[group.kind]}</span>
    </span>
  );
}

function CellButton({
  question,
  engine,
  label,
  onOpen,
}: {
  question: ReportQuestion;
  engine: string;
  label: string;
  onOpen: (s: Selection) => void;
}) {
  const cell = question.cells[engine];
  if (!cell) return <AnswerCell className="px-1" />;
  return (
    <button
      type="button"
      onClick={() => onOpen({ promptId: question.id, engine })}
      aria-label={`Read the ${label} answer to: ${question.text}`}
      className="cursor-pointer rounded-xl p-1 transition-colors hover:bg-offwhite focus-visible:outline-2 focus-visible:outline-royal"
    >
      <AnswerCell cell={cell} />
    </button>
  );
}

/** Phones: one card per question, one row per engine. */
function QuestionCards({ report, groups, onOpen }: { report: Report; groups: Group[]; onOpen: (s: Selection) => void }) {
  return (
    <div className="flex flex-col gap-6 md:hidden">
      {groups.map((group) => (
        <section key={group.kind} aria-label={KIND_LABEL[group.kind]}>
          <GroupTitle group={group} />
          <ul className="mt-2.5 flex flex-col gap-2">
            {group.questions.map((q) => {
              const { named, of } = namedCount(report, q);
              return (
                <li key={q.id} className="rounded-2xl border border-oat/70 bg-white p-4">
                  <p className="text-[15px] leading-[1.4] font-medium">{q.text}</p>
                  <div className="mt-1.5 flex items-center justify-between gap-3">
                    <QuestionMeta question={q} />
                    <span className="shrink-0 text-[12px] text-stone tabular-nums">
                      Names you on <span className="font-medium text-royal-dark">{named}</span> of {of}
                    </span>
                  </div>
                  <ul className="mt-3 flex flex-col border-t border-oat/60 pt-1.5">
                    {report.engines.map((e) => (
                      <li key={e.name} className="flex min-h-10 items-center justify-between gap-3">
                        <span className="flex min-w-0 items-center gap-2 text-[14px] text-graphite">
                          <EngineMark engine={e.name} size={14} />
                          <span className="truncate">{shortEngineLabel(e.name, e.label)}</span>
                        </span>
                        <CellButton question={q} engine={e.name} label={e.label} onOpen={onOpen} />
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      {report.coming_soon.length > 0 && (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-taupe">
          <span className="font-medium">Coming soon</span>
          {report.coming_soon.map((e) => (
            <span key={e.name} className="flex items-center gap-1.5">
              <EngineMark engine={e.name} size={14} muted />
              {e.label}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

/** Tablet and up: the grid, with the engines that aren't live yet greyed out on the right. */
function QuestionTable({ report, groups, onOpen }: { report: Report; groups: Group[]; onOpen: (s: Selection) => void }) {
  const soon = report.coming_soon;
  const columns = 2 + report.engines.length + soon.length;

  return (
    <div className="relative hidden overflow-x-auto rounded-2xl border border-oat/70 bg-white md:block">
      <table className="w-full min-w-[760px] border-collapse text-left">
        <thead>
          <tr className="text-[13px] text-stone">
            <th scope="col" rowSpan={2} className="sticky left-0 z-10 min-w-[240px] bg-white px-4 pt-3 pb-3 align-bottom font-medium">
              Question
            </th>
            <td colSpan={report.engines.length} aria-hidden="true" />
            {soon.length > 0 && (
              <th scope="colgroup" colSpan={soon.length} className="px-2 pt-3 pb-1 text-center text-[11px] font-medium text-taupe">
                <span className="block border-b border-oat/70 pb-1">Coming soon</span>
              </th>
            )}
            <th scope="col" rowSpan={2} className="px-4 pt-3 pb-3 text-right align-bottom font-medium whitespace-nowrap">
              Names you
            </th>
          </tr>
          <tr className="text-[13px] text-stone">
            {report.engines.map((e) => (
              <th key={e.name} scope="col" className="w-[116px] px-2 pb-3 font-medium">
                <span className="flex items-center gap-1.5 px-1 whitespace-nowrap">
                  <EngineMark engine={e.name} size={14} />
                  {shortEngineLabel(e.name, e.label)}
                </span>
              </th>
            ))}
            {soon.map((e) => (
              <th key={e.name} scope="col" className="w-[52px] px-2 pb-3 text-center font-medium" title={`${e.label}: coming soon`}>
                <span className="inline-flex justify-center">
                  <EngineMark engine={e.name} size={16} muted />
                </span>
                <span className="sr-only">{e.label} (coming soon)</span>
              </th>
            ))}
          </tr>
        </thead>
        {groups.map((group) => (
          <tbody key={group.kind}>
            <tr className="border-t border-oat/60 bg-offwhite">
              <th scope="colgroup" colSpan={columns} className="px-4 py-2.5 text-left font-normal">
                <span className="sticky left-4 block">
                  <GroupTitle group={group} />
                </span>
              </th>
            </tr>
            {group.questions.map((q) => {
              const { named, of } = namedCount(report, q);
              return (
                <tr key={q.id} className="border-t border-oat/50">
                  <th scope="row" className="sticky left-0 z-10 bg-white px-4 py-3 align-top font-normal">
                    <span className="block text-[14px] leading-[1.4]">{q.text}</span>
                    <QuestionMeta question={q} className="mt-1.5" />
                  </th>
                  {report.engines.map((e) => (
                    <td key={e.name} className="px-2 py-2.5 align-middle">
                      <CellButton question={q} engine={e.name} label={e.label} onOpen={onOpen} />
                    </td>
                  ))}
                  {soon.map((e) => (
                    <td key={e.name} className="px-2 py-2.5 text-center align-middle">
                      <AnswerCell comingSoon />
                    </td>
                  ))}
                  <td className="px-4 py-2.5 text-right align-middle text-[14px] whitespace-nowrap tabular-nums">
                    <span className={cn("font-medium", named > 0 ? "text-royal-dark" : "text-taupe")}>{named}</span>
                    <span className="text-stone"> of {of}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        ))}
      </table>
    </div>
  );
}

function Chips<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; count: number }[];
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-1.5">
      <span className="w-full text-[13px] text-stone sm:mr-1 sm:w-[104px]">{label}</span>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal",
              active ? "bg-black text-white" : "bg-white text-graphite shadow-[0_0_0_1px_var(--color-oat)] hover:bg-sand"
            )}
          >
            {o.label}
            <span className={cn("tabular-nums", active ? "text-white/60" : "text-taupe")}>{o.count}</span>
          </button>
        );
      })}
    </div>
  );
}
