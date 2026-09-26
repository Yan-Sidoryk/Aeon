import { notFound } from "next/navigation";
import type { Report } from "@/types/api";
import { ApiError, api } from "./api";

/** Server-side report fetch for /report routes: a missing report is a 404 page, anything else an error page. */
export async function loadReport(id: string): Promise<Report> {
  try {
    return await api.report(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
}
