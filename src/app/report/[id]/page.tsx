import type { Metadata } from "next";
import { cache } from "react";
import { ReportView } from "@/components/app/report/ReportView";
import { loadReport } from "@/lib/load-report";
import type { Report } from "@/types/api";

type Props = { params: Promise<{ id: string }> };

// generateMetadata and the page share one fetch per request.
const getReport = cache(loadReport);

/** Counts of checks, never percentages: "Claude names Opzelura in 6 of 6 unbranded questions, Google AI Overviews in 3 of 6. …" */
function describe(report: Report): string {
  const { brand } = report.product;
  const engines = report.engines
    .filter((e) => report.summary[e.name])
    .map((e, i) => {
      const { you, asked } = report.summary[e.name].unbranded;
      return i === 0 ? `${e.label} names ${brand} in ${you} of ${asked} unbranded questions` : `${e.label} in ${you} of ${asked}`;
    });
  const conflicts = new Set(report.accuracy_issues.map((i) => i.prompt_id)).size;
  const accuracy = conflicts
    ? `AI contradicts ${brand}'s FDA label on ${conflicts} of ${report.questions.length} questions.`
    : `No AI answer contradicted ${brand}'s FDA label.`;
  return engines.length ? `${engines.join(", ")}. ${accuracy}` : accuracy;
}

// The report link is the share link, so its preview carries the counts.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const report = await getReport((await params).id);
  const title = `${report.product.brand}: AI visibility report`;
  const description = describe(report);
  return {
    title: `${title} · Aeon`,
    description,
    openGraph: { title, description },
    twitter: { title, description },
    robots: { index: false },
  };
}

export default async function ReportPage({ params }: Props) {
  return <ReportView report={await getReport((await params).id)} />;
}
