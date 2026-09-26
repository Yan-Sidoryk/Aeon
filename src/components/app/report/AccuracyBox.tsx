import { CircleCheck, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { ISSUE_LABEL, plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AccuracyIssue, AccuracyIssueType, Report, Severity } from "@/types/api";
import { Badge, Panel, SectionTitle, type Tone } from "../ui";
import { SEVERITY_LABEL, answersPhrase, engineLabeler, groupIssues, quoteText, type IssueGroup } from "./report-utils";

const SEVERITY_TONE: Record<Severity, Tone> = { high: "alert", medium: "flame", low: "sand" };
const VISIBLE = 3;

/** 2. The red box: AI statements that contradict the FDA label, the AI sentence next to the label sentence. */
export function AccuracyBox({ report }: { report: Report }) {
  const brand = report.product.brand;
  const issues = report.accuracy_issues;

  if (issues.length === 0) {
    return (
      <Panel className="flex items-center gap-3 border-lime bg-pass-soft">
        <CircleCheck className="size-6 shrink-0 text-forest" aria-hidden="true" />
        <p className="text-[16px]">No AI answer in this scan contradicted {brand}&apos;s FDA label.</p>
      </Panel>
    );
  }

  const label = engineLabeler(report);
  const groups = groupIssues(report);
  const questions = new Set(issues.map((i) => i.prompt_id)).size;
  const byType = groups.reduce<Partial<Record<AccuracyIssueType, number>>>(
    (acc, g) => ({ ...acc, [g.issues[0].type]: (acc[g.issues[0].type] ?? 0) + 1 }),
    {}
  );
  const [top, rest] = [groups.slice(0, VISIBLE), groups.slice(VISIBLE)];

  return (
    <section aria-labelledby="accuracy-title" className="rounded-3xl border border-alert-line bg-alert-soft p-5 md:p-8">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-4 gap-y-2">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-alert text-white md:row-span-2">
          <TriangleAlert className="size-5" strokeWidth={2.25} aria-hidden="true" />
        </span>
        <SectionTitle className="self-center text-alert-ink">
          <span id="accuracy-title">
            AI contradicts {brand}&apos;s label on {questions} of {report.questions.length} questions
          </span>
        </SectionTitle>
        <p className="col-span-2 text-[15px] leading-[1.5] text-graphite md:col-span-1 md:col-start-2">
          Every answer that names {brand} is checked against the FDA label, sentence by sentence. Review these with
          medical affairs before acting on them.
        </p>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {(Object.entries(byType) as [AccuracyIssueType, number][]).map(([type, n]) => (
          <Badge key={type} tone="white" className="h-7 px-3 text-[13px] leading-none">
            {ISSUE_LABEL[type]} · {n}
          </Badge>
        ))}
      </div>
      <div className="mt-6 flex flex-col gap-3">
        {top.map((group) => (
          <IssueCard key={group.key} group={group} engine={label(group.issues[0].engine)} />
        ))}
      </div>
      {rest.length > 0 && (
        <details className="group mt-3">
          <summary className="inline-flex h-10 cursor-pointer list-none items-center rounded-full bg-white px-4 text-[14px] font-medium transition-colors hover:bg-offwhite focus-visible:outline-2 focus-visible:outline-royal [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">Show all {groups.length} conflicts</span>
            <span className="hidden group-open:inline">Show fewer</span>
          </summary>
          <div className="mt-3 flex flex-col gap-3">
            {rest.map((group) => (
              <IssueCard key={group.key} group={group} engine={label(group.issues[0].engine)} />
            ))}
          </div>
        </details>
      )}
    </section>
  );
}

/** Other sentences in the group that say something different from the first one. */
function otherStatements(group: IssueGroup): AccuracyIssue[] {
  const seen = new Set([quoteText(group.issues[0].ai_sentence).trim()]);
  return group.issues.slice(1).filter((i) => {
    const key = quoteText(i.ai_sentence).trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function IssueCard({ group, engine }: { group: IssueGroup; engine: string }) {
  const [issue] = group.issues;
  const others = otherStatements(group);
  return (
    <article className="rounded-2xl bg-white p-4 md:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={SEVERITY_TONE[group.severity]}>{SEVERITY_LABEL[group.severity]}</Badge>
        <Badge tone="white">{ISSUE_LABEL[issue.type]}</Badge>
        <span className="text-[13px] font-medium text-alert-ink">{answersPhrase(group, engine)}</span>
      </div>
      <p className="mt-2 text-[14px] leading-[1.45] text-stone">“{issue.prompt}”</p>
      <Pair issue={issue} engine={engine} className="mt-3" />
      <p className="mt-3 text-[14px] leading-[1.55] text-graphite">{issue.explanation}</p>
      {others.length > 0 && (
        <details className="group/more mt-3">
          <summary className="cursor-pointer list-none text-[14px] font-medium text-alert-ink underline-offset-4 hover:underline [&::-webkit-details-marker]:hidden">
            <span className="group-open/more:hidden">{plural(others.length, "more statement")} like this</span>
            <span className="hidden group-open/more:inline">Hide the other statements</span>
          </summary>
          <div className="mt-3 flex flex-col gap-3">
            {others.map((other, i) => (
              <Pair key={i} issue={other} engine={engine} />
            ))}
          </div>
        </details>
      )}
    </article>
  );
}

function Pair({ issue, engine, className }: { issue: AccuracyIssue; engine: string; className?: string }) {
  return (
    <div className={cn("grid gap-2 md:grid-cols-2", className)}>
      <Quote label={`AI answer · ${engine}`} bad>
        {quoteText(issue.ai_sentence)}
      </Quote>
      <Quote label="FDA label">{quoteText(issue.label_sentence)}</Quote>
    </div>
  );
}

function Quote({ label, bad = false, children }: { label: string; bad?: boolean; children: ReactNode }) {
  return (
    <blockquote className={cn("min-w-0 rounded-xl border px-4 py-3", bad ? "border-alert-line bg-alert-soft/60" : "border-lime bg-pass-soft")}>
      <p className="text-[12px] text-stone">{label}</p>
      <p className={cn("mt-1.5 text-[15px] leading-[1.5] break-words", bad ? "text-alert-ink" : "text-forest")}>{children}</p>
    </blockquote>
  );
}
