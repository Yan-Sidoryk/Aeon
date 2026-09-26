import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { FixWorkspace } from "@/components/app/fix/FixWorkspace";
import { decodeEscapes } from "@/components/app/report/report-utils";
import { api } from "@/lib/api";
import { loadReport } from "@/lib/load-report";
import type { Draft } from "@/types/api";

type Props = { params: Promise<{ id: string; key: string }> };

// generateMetadata and the page share one fetch per request.
const getReport = cache(loadReport);

async function load(params: Props["params"]) {
  const { id, key } = await params;
  const report = await getReport(id);
  const fix = report.fixes.find((f) => f.key === key);
  if (!fix) notFound();
  return { report, fix };
}

/** The finished draft, public with the report link; null while none exists (or the API can't say). */
async function existingDraft(reportId: string, key: string): Promise<Draft | null> {
  try {
    return await api.reportDraft(reportId, key);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { fix } = await load(params);
  return { title: `Fix: ${decodeEscapes(fix.title)} · Aeon`, robots: { index: false } };
}

export default async function FixPage({ params }: Props) {
  const { report, fix } = await load(params);
  const draft = await existingDraft(report.id, fix.key);
  return <FixWorkspace reportId={report.id} fix={fix} brand={report.product.brand} initialDraft={draft} />;
}
