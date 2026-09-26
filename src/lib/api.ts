import type {
  Answer,
  Company,
  Competitor,
  Draft,
  DraftSummary,
  Engine,
  FixStart,
  Health,
  HistoryRow,
  Me,
  OnboardingStart,
  Opportunities,
  Product,
  ProductDetail,
  Report,
  SaveResult,
  Scan,
  ScanStart,
  SetupStart,
  SetupView,
  Tracking,
} from "@/types/api";
import { accessToken, authHeaders } from "./auth";

// Contract: docs/architecture.md. Every call goes to the backend; the browser never talks to Anthropic, DataForSEO,
// Apify or openFDA directly.
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    /** 0 when the API couldn't be reached at all. */
    readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

/**
 * Where a request goes. The browser uses API_URL as is: on Vercel that's the relative "/api/backend", a service on the
 * same deployment. Server rendering can't fetch a relative URL, so there it calls back into this deployment by its
 * absolute URL, past Vercel's login protection with the bypass secret the deployment is given.
 */
function target(path: string): { url: string; headers: Record<string, string> } {
  if (typeof window !== "undefined" || /^https?:\/\//.test(API_URL)) return { url: `${API_URL}${path}`, headers: {} };
  const origin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET ?? process.env.PROTECTION_BYPASS_SECRET;
  return { url: `${origin}${API_URL}${path}`, headers: bypass ? { "x-vercel-protection-bypass": bypass } : {} };
}

async function request<T>(path: string, { body, headers, ...init }: RequestOptions = {}): Promise<T> {
  const h = new Headers(headers);
  if (body !== undefined) h.set("Content-Type", "application/json");
  for (const [k, v] of Object.entries(await authHeaders())) h.set(k, v);
  const { url, headers: routing } = target(path);
  for (const [k, v] of Object.entries(routing)) h.set(k, v);

  let res: Response;
  try {
    res = await fetch(url, {
      cache: "no-store",
      ...init,
      headers: h,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(`Can't reach the Aeon API at ${API_URL}.`, 0);
  }
  if (!res.ok) throw new ApiError(await errorDetail(res), res.status);
  return (await res.json()) as T;
}

// FastAPI errors are {"detail": "..."}, or a list of {msg} for validation errors.
async function errorDetail(res: Response): Promise<string> {
  try {
    const { detail } = (await res.json()) as { detail?: unknown };
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map((d: { msg?: string }) => d.msg ?? "Invalid input").join("; ");
  } catch {
    // not JSON
  }
  return `Request failed (${res.status})`;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

/** Absolute URL of an SSE stream. EventSource can't send headers, so the access token rides in the query. */
export async function streamUrl(path: string): Promise<string> {
  const token = await accessToken();
  return `${API_URL}${path}${token ? `${path.includes("?") ? "&" : "?"}access_token=${encodeURIComponent(token)}` : ""}`;
}

export const api = {
  health: () => request<Health>("/api/health"),
  me: () => request<Me>("/api/me"),
  engines: () => request<Engine[]>("/api/engines"),

  startOnboarding: (url: string) => request<OnboardingStart>("/api/onboarding", { method: "POST", body: { url } }),
  companies: () => request<Company[]>("/api/companies"),
  company: (id: number) => request<Company>(`/api/companies/${id}`),
  chooseLabeler: (companyId: number, labeler: string) =>
    request<Company>(`/api/companies/${companyId}/labeler`, { method: "POST", body: { labeler } }),
  /** 404 when no US FDA label exists for the brand. */
  addProduct: (companyId: number, brand: string) =>
    request<Product>(`/api/companies/${companyId}/products`, { method: "POST", body: { brand } }),
  setSelected: (productId: number, selected: boolean) =>
    request<{ ok: boolean }>(`/api/products/${productId}`, { method: "PATCH", body: { selected } }),
  setHero: (productId: number) => request<{ ok: boolean }>(`/api/products/${productId}/hero`, { method: "POST" }),
  product: (id: number) => request<ProductDetail>(`/api/products/${id}`),

  /** The setup when it exists, else the setup agent's job to follow. */
  startSetup: (productId: number) => request<SetupStart>(`/api/products/${productId}/setup`, { method: "POST" }),
  setup: (productId: number) => request<SetupView>(`/api/products/${productId}/setup`),
  addCompetitor: (productId: number, brand: string) =>
    request<Competitor>(`/api/products/${productId}/competitors`, { method: "POST", body: { brand, molecule: "" } }),
  deleteCompetitor: (competitorId: number) =>
    request<{ ok: boolean }>(`/api/competitors/${competitorId}`, { method: "DELETE" }),

  /** 409 if setup hasn't run, 503 if no engine is configured. */
  startScan: (productId: number) => request<ScanStart>(`/api/products/${productId}/scans`, { method: "POST" }),
  scan: (id: number) => request<Scan>(`/api/scans/${id}`),
  scans: (productId: number) => request<Scan[]>(`/api/products/${productId}/scans`),

  report: (id: string) => request<Report>(`/api/reports/${id}`),
  /** Every sample for one question × engine. */
  answers: (reportId: string, promptId: number, engine: string) =>
    request<Answer[]>(`/api/reports/${reportId}/answers?prompt_id=${promptId}&engine=${encodeURIComponent(engine)}`),
  /** 200 {draft_id} when the draft exists, 202 {job_id} while the fix agent works. */
  startFix: (reportId: string, fixKey: string) =>
    request<FixStart>(`/api/reports/${reportId}/fixes/${encodeURIComponent(fixKey)}`, { method: "POST" }),
  draft: (id: number) => request<Draft>(`/api/drafts/${id}`),
  reportDraft: (reportId: string, fixKey: string) =>
    request<Draft>(`/api/reports/${reportId}/drafts/${encodeURIComponent(fixKey)}`),

  history: (productId: number) => request<HistoryRow[]>(`/api/products/${productId}/history`),
  tracking: (productId: number) => request<Tracking>(`/api/products/${productId}/tracking`),
  setTracking: (productId: number, weekly: boolean) =>
    request<Tracking>(`/api/products/${productId}/tracking?weekly=${weekly}`, { method: "PUT" }),
  opportunities: (productId: number) => request<Opportunities>(`/api/products/${productId}/opportunities`),
  startOpportunities: (productId: number) =>
    request<{ job_id: string }>(`/api/products/${productId}/opportunities`, { method: "POST" }),
  draftOpportunity: (productId: number, key: string) =>
    request<FixStart>(`/api/products/${productId}/opportunities/${encodeURIComponent(key)}/draft`, { method: "POST" }),
  drafts: (productId: number) => request<DraftSummary[]>(`/api/products/${productId}/drafts`),

  save: (email: string) => request<SaveResult>("/api/orgs/save", { method: "POST", body: { email } }),
};
