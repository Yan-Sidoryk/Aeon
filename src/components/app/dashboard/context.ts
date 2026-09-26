"use client";

import { createContext, use } from "react";
import type { Company, HistoryRow, Product, Report, Scan } from "@/types/api";
import type { Drug } from "./portfolio";

export type Dashboard = {
  productId: number;
  /** "/app/2": prefix for this drug's pages. */
  base: string;
  /** undefined while loading. */
  product: Product | undefined;
  company: Company | undefined;
  /** Finished scans, newest first. */
  history: HistoryRow[] | undefined;
  /** The latest report; null when the drug has no finished scan yet. */
  report: Report | null | undefined;
  /** A scan of this drug that is still running; null when none, undefined while loading. */
  runningScan: Scan | null | undefined;
  /** No questions yet (never set up), so a scan would be refused; undefined while checking. */
  needsSetup: boolean | undefined;
  /** Drugs with a dashboard, for the switcher. */
  drugs: Drug[] | undefined;
};

export const DashboardContext = createContext<Dashboard | null>(null);

export function useDashboard(): Dashboard {
  const value = use(DashboardContext);
  if (!value) throw new Error("useDashboard() must be used inside <DashboardShell>");
  return value;
}
