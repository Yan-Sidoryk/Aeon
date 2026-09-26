import type { Metadata } from "next";
import { ReportView } from "@/components/app/report/ReportView";
import { loadReport } from "@/lib/load-report";

type Props = { params: Promise<{ id: string }> };

// The report link is the share link, so its preview carries the headline.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const report = await loadReport((await params).id);
  const { you, top_competitor: top } = report.headline;
  const description = `AI mentions ${report.product.brand} in ${you.score}% of answers${top.brand ? `; ${top.brand} in ${top.score}%` : ""}. ${report.accuracy_issues.length} statements contradict the FDA label.`;
  return {
    title: `${report.product.brand}: AI visibility report · Aeon`,
    description,
    openGraph: { title: `${report.product.brand}: AI visibility report`, description },
    robots: { index: false },
  };
}

export default async function ReportPage({ params }: Props) {
  return <ReportView report={await loadReport((await params).id)} />;
}
