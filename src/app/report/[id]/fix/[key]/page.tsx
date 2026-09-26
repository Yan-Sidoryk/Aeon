import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FixWorkspace } from "@/components/app/fix/FixWorkspace";
import { loadReport } from "@/lib/load-report";

type Props = { params: Promise<{ id: string; key: string }> };

async function load(params: Props["params"]) {
  const { id, key } = await params;
  const report = await loadReport(id);
  const fix = report.fixes.find((f) => f.key === key);
  if (!fix) notFound();
  return { report, fix };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { fix } = await load(params);
  return { title: `Fix: ${fix.title} · Aeon`, robots: { index: false } };
}

export default async function FixPage({ params }: Props) {
  const { report, fix } = await load(params);
  return <FixWorkspace reportId={report.id} fix={fix} brand={report.product.brand} />;
}
