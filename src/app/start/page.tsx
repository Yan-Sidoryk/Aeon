import { StartScreen } from "@/components/app/StartScreen";
import { api } from "@/lib/api";
import type { SearchParams } from "@/lib/params";

export default async function StartPage({ searchParams }: { searchParams: SearchParams }) {
  const { url } = await searchParams;
  const sampleReportId = await api.health().then((h) => h.sample_report_id ?? null, () => null);
  return <StartScreen initialUrl={typeof url === "string" ? url : ""} sampleReportId={sampleReportId} />;
}
