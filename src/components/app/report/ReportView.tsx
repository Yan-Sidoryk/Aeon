import { formatDate, plural } from "@/lib/format";
import type { Report } from "@/types/api";
import { Badge, Eyebrow, PageTitle, Panel, Screen, SectionTitle } from "../ui";
import { AccuracyBox } from "./AccuracyBox";
import { Fixes } from "./Fixes";
import { LostQuestions } from "./LostQuestions";
import { Mentions } from "./Mentions";
import { ReportGrid } from "./ReportGrid";
import { ReportSections } from "./ReportSections";
import { SaveReport } from "./SaveReport";
import { ShareButton } from "./ShareButton";
import { Sources } from "./Sources";
import { Changes, Visibility } from "./Visibility";

/**
 * Screen 6, "Your AI visibility report". Checks, not scores: every line is a yes/no check or a count of them.
 * Sections follow the journey doc (where AI recommends you, the red box, where you lose, why, fixes), ordered by
 * the reader's role, then the detail: everyone's mentions, every answer, how we checked.
 */
export function ReportView({ report }: { report: Report }) {
  const { product } = report;
  const molecule = product.molecule && product.molecule.toLowerCase() !== product.brand.toLowerCase() ? product.molecule : "";
  const weekly = report.scan.kind === "weekly";

  return (
    <Screen className="max-w-[1120px]">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <Eyebrow>Your AI visibility report</Eyebrow>
          <PageTitle>
            {product.brand}
            {molecule && <span className="ml-3 text-[0.55em] font-normal tracking-normal text-stone">{molecule}</span>}
          </PageTitle>
          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2 text-[15px] text-stone">
            {weekly && <Badge tone="periwinkle">Weekly scan</Badge>}
            <span>{[report.company.name, formatDate(report.created_at), plural(report.questions.length, "question")].filter(Boolean).join(" · ")}</span>
          </p>
          <ul aria-label="AI engines" className="mt-3 flex flex-wrap gap-1.5">
            {report.engines.map((e) => (
              <li key={e.name}>
                <Badge tone="white">
                  <span className="size-1.5 rounded-full bg-mint-dark" aria-hidden="true" />
                  {e.label}
                  {e.samples > 1 && <span className="text-taupe">asked {e.samples}×</span>}
                </Badge>
              </li>
            ))}
            {report.coming_soon.map((e) => (
              <li key={e.name}>
                <Badge className="border border-dashed border-oat bg-transparent text-taupe">
                  {e.label} · coming soon
                </Badge>
              </li>
            ))}
          </ul>
        </div>
        <ShareButton />
      </div>

      <ReportSections
        lead={weekly && report.changes?.length ? "changes" : undefined}
        sections={{
          visibility: <Visibility report={report} />,
          changes: report.changes ? <Changes report={report} /> : null,
          accuracy: <AccuracyBox report={report} />,
          lost: <LostQuestions report={report} />,
          sources: <Sources report={report} />,
          fixes: report.fixes.length ? <Fixes report={report} /> : null,
        }}
      />

      <div className="mt-16 flex flex-col gap-16">
        <Mentions report={report} />
        <ReportGrid
          id={report.id}
          brand={product.brand}
          questions={report.questions}
          engines={report.engines}
          coming_soon={report.coming_soon}
        />
        <Panel>
          <SectionTitle className="text-[20px] leading-[1.2] md:text-[20px]">How we checked</SectionTitle>
          <p className="mt-3 max-w-[820px] text-[15px] leading-[1.6] text-graphite">{report.methodology}</p>
          <p className="mt-3 max-w-[820px] text-[15px] leading-[1.6] text-graphite">
            Every result is a yes/no check with the answer behind it, and summaries are counts of checks. AI answers
            change from one run to the next, so this is a snapshot of one scan. Label checks compare each answer with
            the current FDA label and are a starting point for your medical and regulatory review.
          </p>
        </Panel>
        <SaveReport brand={product.brand} />
      </div>
    </Screen>
  );
}
