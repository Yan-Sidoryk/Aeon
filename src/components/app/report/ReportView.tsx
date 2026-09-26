import { CircleCheck, ExternalLink, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { PillButton } from "@/components/ui/pill-button";
import { AUDIENCE_SINGULAR, FIX_KIND_LABEL, ISSUE_LABEL, engineLabel, formatDate, plainText, plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AccuracyIssue, AccuracyIssueType, FixKind, Report, Severity, Share } from "@/types/api";
import { Badge, Eyebrow, PageTitle, Panel, Screen, SectionTitle, type Tone } from "../ui";
import { ReportGrid } from "./ReportGrid";
import { ReportSections } from "./ReportSections";
import { SaveReport } from "./SaveReport";
import { ShareButton } from "./ShareButton";

/** Screen 6, "Your AI visibility report". Sections follow the journey doc: headline, red box, where you lose, why, fixes. */
export function ReportView({ report }: { report: Report }) {
  const { product } = report;
  const engines = [...new Set(report.grid.map((c) => c.engine))];
  const molecule = product.molecule && product.molecule.toLowerCase() !== product.brand.toLowerCase() ? product.molecule : "";

  return (
    <Screen className="max-w-[1120px]">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <Eyebrow>Your AI visibility report</Eyebrow>
          <PageTitle>
            {product.brand}
            {molecule && <span className="ml-3 text-[0.55em] font-normal tracking-normal text-stone">{molecule}</span>}
          </PageTitle>
          <p className="mt-3 text-[15px] text-stone">
            {[report.company?.name, formatDate(report.created_at), `${plural(report.grid.length, "AI answer")} from ${engines.map(engineLabel).join(", ")}`]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <ShareButton />
      </div>

      <ReportSections
        sections={{
          headline: <Headline report={report} />,
          accuracy: <AccuracyBox report={report} />,
          lost: <WhereYouLose report={report} />,
          sources: <Sources report={report} />,
          fixes: <Fixes report={report} />,
        }}
      />

      <div className="mt-16 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <CompetitorScores report={report} />
        <Panel>
          <SectionTitle className="text-[20px] md:text-[20px]">How we measured</SectionTitle>
          <p className="mt-3 text-[15px] leading-[1.6] text-graphite">{report.methodology}</p>
          <p className="mt-3 text-[15px] leading-[1.6] text-graphite">
            AI answers change from one run to the next, so read these numbers as a snapshot. Label checks compare each
            answer with the current FDA label and are a starting point for your medical and regulatory review.
          </p>
        </Panel>
      </div>

      <ReportGrid report={report} />

      <SaveReport />
    </Screen>
  );
}

// ---- 1. Headline --------------------------------------------------------------

function overlaps(a: [number, number], b: [number, number]): boolean {
  return a[0] <= b[1] && b[0] <= a[1];
}

function Headline({ report }: { report: Report }) {
  const { you, top_competitor: top, scope } = report.headline;
  const brand = report.product.brand;
  const all = report.all_prompts.you;

  return (
    <Panel className="p-6 md:p-10">
      <p className="text-[14px] font-medium text-stone">{scope === "unbranded" ? "Visibility on unbranded questions" : "Visibility"}</p>
      <p className="mt-3 max-w-[820px] font-display text-[28px] leading-[1.15] font-medium tracking-[-0.02em] text-balance md:text-[40px]">
        AI mentions {brand} in <span className="text-royal-dark">{you.score}%</span> of answers.
        {top.brand ? (
          <>
            {" "}
            {top.brand}: <span className="text-graphite">{top.score}%</span>.
          </>
        ) : (
          " No competitor was named."
        )}
      </p>
      <div className="mt-8 flex max-w-[760px] flex-col gap-3">
        <ScoreBar label={brand} share={you} you />
        {top.brand && <ScoreBar label={top.brand} share={top} />}
      </div>
      <p className="mt-6 max-w-[820px] text-[13px] leading-[1.6] text-stone">
        {scope === "unbranded" && "Unbranded questions don't name any drug, so AI chooses what to recommend. "}
        Based on {plural(you.n, "answer")}. 95% intervals: {brand} {you.ci95[0]}–{you.ci95[1]}
        {top.brand && `, ${top.brand} ${top.ci95[0]}–${top.ci95[1]}`}.
        {top.brand && overlaps(you.ci95, top.ci95) && " At this sample size the two scores are within each other's margin of error."}
        {scope === "unbranded" && ` Across all ${all.n} answers, including questions that name ${brand}: ${all.score}%.`}
      </p>
    </Panel>
  );
}

function ScoreBar({ label, share, you = false }: { label: string; share: Share; you?: boolean }) {
  return (
    <div className="grid grid-cols-[minmax(80px,140px)_1fr_48px] items-center gap-3">
      <span className={cn("truncate text-[15px]", you && "font-medium")}>{label}</span>
      <span className="h-3 overflow-hidden rounded-full bg-sand">
        <span className={cn("block h-full rounded-full", you ? "bg-royal" : "bg-taupe")} style={{ width: `${share.score}%` }} />
      </span>
      <span className="text-right font-display text-[20px] font-medium tabular-nums">{share.score}</span>
    </div>
  );
}

// ---- 2. Red box: label conflicts ----------------------------------------------

const SEVERITY_TONE: Record<Severity, Tone> = { high: "alert", medium: "flame", low: "sand" };

function AccuracyBox({ report }: { report: Report }) {
  const issues = report.accuracy_issues;
  if (issues.length === 0) {
    return (
      <Panel className="flex items-center gap-3 border-lime bg-pass-soft">
        <CircleCheck className="size-6 shrink-0 text-forest" />
        <p className="text-[16px]">No AI answer in this scan contradicted {report.product.brand}&apos;s FDA label.</p>
      </Panel>
    );
  }

  const answers = new Set(issues.map((i) => `${i.engine}|${i.prompt}`)).size;
  const byType = issues.reduce<Partial<Record<AccuracyIssueType, number>>>((acc, i) => ({ ...acc, [i.type]: (acc[i.type] ?? 0) + 1 }), {});
  const [top, rest] = [issues.slice(0, 3), issues.slice(3)];

  return (
    <section aria-labelledby="accuracy-title" className="rounded-3xl border border-alert-line bg-alert-soft p-5 md:p-8">
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-alert text-white">
          <TriangleAlert className="size-5" strokeWidth={2.25} />
        </span>
        <div>
          <SectionTitle className="text-alert-ink">
            <span id="accuracy-title">
              {plural(issues.length, "statement")} in {plural(answers, "AI answer")} contradict your label
            </span>
          </SectionTitle>
          <p className="mt-1.5 text-[15px] text-graphite">
            Each answer that names {report.product.brand} is checked against the FDA label, sentence by sentence. Review
            these with medical affairs before acting on them.
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {(Object.entries(byType) as [AccuracyIssueType, number][]).map(([type, n]) => (
          <Badge key={type} tone="white" className="h-7 px-3 text-[13px]">
            {ISSUE_LABEL[type]} · {n}
          </Badge>
        ))}
      </div>
      <div className="mt-6 flex flex-col gap-3">
        {top.map((issue, i) => (
          <IssueCard key={i} issue={issue} />
        ))}
      </div>
      {rest.length > 0 && (
        <details className="group mt-3">
          <summary className="inline-flex h-10 cursor-pointer list-none items-center rounded-full bg-white px-4 text-[14px] font-medium">
            <span className="group-open:hidden">Show all {issues.length}</span>
            <span className="hidden group-open:inline">Show fewer</span>
          </summary>
          <div className="mt-3 flex flex-col gap-3">
            {rest.map((issue, i) => (
              <IssueCard key={i} issue={issue} />
            ))}
          </div>
        </details>
      )}
    </section>
  );
}

function IssueCard({ issue }: { issue: AccuracyIssue }) {
  return (
    <article className="rounded-2xl bg-white p-4 md:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={SEVERITY_TONE[issue.severity]} className="capitalize">
          {issue.severity}
        </Badge>
        <Badge tone="white">{ISSUE_LABEL[issue.type]}</Badge>
        <span className="text-[13px] leading-[1.4] text-stone">
          {engineLabel(issue.engine)} · “{issue.prompt}”
        </span>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <Quote label={`AI answer · ${engineLabel(issue.engine)}`} bad>
          {plainText(issue.ai_sentence)}
        </Quote>
        <Quote label="FDA label">{plainText(issue.label_sentence)}</Quote>
      </div>
      <p className="mt-3 text-[14px] leading-[1.55] text-graphite">{issue.explanation}</p>
    </article>
  );
}

function Quote({ label, bad = false, children }: { label: string; bad?: boolean; children: ReactNode }) {
  return (
    <blockquote
      className={cn(
        "rounded-xl border px-4 py-3",
        bad ? "border-alert-line bg-alert-soft/60" : "border-lime bg-pass-soft"
      )}
    >
      <p className="text-[12px] text-stone">{label}</p>
      <p className={cn("mt-1.5 text-[15px] leading-[1.5]", bad ? "text-alert-ink" : "text-forest")}>{children}</p>
    </blockquote>
  );
}

// ---- 3. Where you lose -----------------------------------------------------------

function WhereYouLose({ report }: { report: Report }) {
  const lost = report.lost_prompts;
  return (
    <section aria-labelledby="lost-title">
      <SectionTitle>
        <span id="lost-title">Where you lose</span>
      </SectionTitle>
      <p className="mt-1.5 text-[15px] text-stone">Questions where AI recommends a competitor and not {report.product.brand}.</p>
      {lost.length === 0 ? (
        <Panel className="mt-5 text-[15px]">Whenever AI named a competitor, it named {report.product.brand} too.</Panel>
      ) : (
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {lost.map((lp) => (
            <Panel key={lp.prompt_id} className="flex flex-col gap-4">
              <Badge className="w-fit">{AUDIENCE_SINGULAR[lp.audience]} question</Badge>
              <p className="font-display text-[18px] leading-[1.3] font-medium">“{lp.prompt}”</p>
              <div className="mt-auto">
                <p className="text-[13px] text-stone">Recommended instead</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {lp.competitors.map((c) => (
                    <Badge key={c} className="bg-stone/12">
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </section>
  );
}

// ---- 4. Why: sources ------------------------------------------------------------

function Sources({ report }: { report: Report }) {
  const sources = report.competitor_only_sources;
  return (
    <section aria-labelledby="sources-title">
      <SectionTitle>
        <span id="sources-title">Why: the sources AI cites for your competitors</span>
      </SectionTitle>
      <p className="mt-1.5 text-[15px] text-stone">
        Sites cited in answers that recommended a competitor and not {report.product.brand}.
      </p>
      {sources.length === 0 ? (
        <Panel className="mt-5 text-[15px]">No citations came with those answers.</Panel>
      ) : (
        <Panel className="mt-5 p-0 md:p-0">
          <ul>
            {sources.map((s) => (
              <li
                key={s.domain}
                className="grid gap-2 border-t border-oat/60 px-5 py-4 first:border-t-0 md:grid-cols-[1.2fr_120px_1.4fr] md:items-center md:px-6"
              >
                <a
                  href={`https://${s.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-fit items-center gap-1.5 text-[16px] font-medium underline-offset-4 hover:underline"
                >
                  {s.domain}
                  <ExternalLink className="size-3.5 text-stone" />
                </a>
                <span className="text-[14px] text-stone">{plural(s.citations, "citation")}</span>
                <span className="flex flex-wrap gap-1.5">
                  {s.competitors.map((c) => (
                    <Badge key={c} className="bg-stone/12">
                      {c}
                    </Badge>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </section>
  );
}

// ---- 5. Top fixes ------------------------------------------------------------------

const KIND_TONE: Record<FixKind, Tone> = {
  accuracy_correction: "alert",
  on_page_content: "periwinkle",
  faq: "lavender",
  off_page: "flame",
};

function Fixes({ report }: { report: Report }) {
  return (
    <section aria-labelledby="fixes-title">
      <SectionTitle>
        <span id="fixes-title">Top {report.fixes.length} fixes</span>
      </SectionTitle>
      <p className="mt-1.5 text-[15px] text-stone">
        Each one drafts content from the FDA label and runs it through AI pre-MLR review before you see it.
      </p>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {report.fixes.map((fix, i) => (
          <article key={fix.key} className="flex flex-col rounded-2xl border border-oat/70 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="font-display text-[28px] leading-none font-medium text-oat">{i + 1}</span>
              <Badge tone={KIND_TONE[fix.kind]}>{FIX_KIND_LABEL[fix.kind]}</Badge>
            </div>
            <h3 className="mt-4 font-display text-[18px] leading-[1.3] font-medium">{fix.title}</h3>
            <p className="mt-2 line-clamp-5 text-[14px] leading-[1.55] text-graphite">{fix.why}</p>
            <div className="mt-auto pt-5">
              <PillButton href={`/report/${report.id}/fix/${encodeURIComponent(fix.key)}`} className="h-11 w-full">
                Fix this
              </PillButton>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// ---- Detail: everyone's score -----------------------------------------------------

function CompetitorScores({ report }: { report: Report }) {
  const rows = [
    { name: report.product.brand, share: report.headline.you, you: true },
    ...Object.entries(report.competitors).map(([name, share]) => ({ name, share, you: false })),
  ].sort((a, b) => b.share.score - a.share.score);

  return (
    <Panel>
      <SectionTitle className="text-[20px] md:text-[20px]">Everyone&apos;s score</SectionTitle>
      <p className="mt-1 text-[14px] text-stone">
        Share of {report.headline.scope === "unbranded" ? "unbranded " : ""}answers that mention each drug.
      </p>
      <div className="mt-5 flex flex-col gap-2.5">
        {rows.map((row) => (
          <ScoreBar key={row.name} label={row.name} share={row.share} you={row.you} />
        ))}
      </div>
    </Panel>
  );
}
