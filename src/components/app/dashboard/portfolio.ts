import { api } from "@/lib/api";
import type { Company, HistoryRow, Product } from "@/types/api";

/** A drug with a dashboard: set up as a hero, or scanned at least once. */
export type Drug = { product: Product; company: Company; latest: HistoryRow | null; scans: number };

export type Portfolio = { companies: Company[]; drugs: Drug[] };

/**
 * The caller's companies, plus the drugs that have a dashboard. Only heroes get set up during onboarding, and a
 * product's scans only show in its history, so each launched, in-house product's history is asked for (a few
 * small GETs), heroes first, then the most recently scanned.
 */
export async function loadPortfolio(): Promise<Portfolio> {
  const companies = await api.companies();
  const candidates = companies.flatMap((company) =>
    company.products.filter((p) => !p.pipeline && !p.partner).map((product) => ({ company, product }))
  );
  const withHistory = await Promise.all(
    candidates.map(async (c) => ({ ...c, history: await api.history(c.product.id).catch((): HistoryRow[] => []) }))
  );
  const drugs = withHistory
    .filter((d) => d.product.is_hero || d.history.length > 0)
    .sort(
      (a, b) =>
        Number(b.product.is_hero) - Number(a.product.is_hero) ||
        (b.history[0]?.finished_at ?? "").localeCompare(a.history[0]?.finished_at ?? "")
    )
    .map(({ company, product, history }) => ({ company, product, latest: history[0] ?? null, scans: history.length }));
  return { companies, drugs };
}
