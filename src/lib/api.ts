import type {
  Answer,
  Company,
  Competitor,
  Draft,
  Engine,
  FixStart,
  Health,
  OnboardingStart,
  Product,
  ProductDetail,
  Report,
  SaveResult,
  Scan,
  ScanStart,
  SetupView,
} from "@/types/api";
import { getSessionId } from "./session";

// Contract: docs/architecture.md. Every call goes to the backend; the browser never talks to Firecrawl,
// openFDA or the AI engines directly.
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

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  /** Send X-Session-Id (browser only). Required by /api/onboarding and /api/orgs/save. */
  session?: boolean;
};

async function request<T>(path: string, { body, session, headers, ...init }: RequestOptions = {}): Promise<T> {
  const h = new Headers(headers);
  if (body !== undefined) h.set("Content-Type", "application/json");
  if (session) h.set("X-Session-Id", getSessionId());

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
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

/** Absolute URL of an SSE stream, for EventSource. */
export function streamUrl(path: string): string {
  return `${API_URL}${path}`;
}

export const api = {
  health: () => request<Health>("/api/health"),
  engines: () => request<Engine[]>("/api/engines"),

  startOnboarding: (url: string) =>
    request<OnboardingStart>("/api/onboarding", { method: "POST", body: { url }, session: true }),
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

  /** Idempotent: ~15s the first time (live), instant after. */
  buildSetup: (productId: number) => request<SetupView>(`/api/products/${productId}/setup`, { method: "POST" }),
  addCompetitor: (productId: number, brand: string) =>
    request<Competitor>(`/api/products/${productId}/competitors`, { method: "POST", body: { brand, molecule: "" } }),
  deleteCompetitor: (competitorId: number) =>
    request<{ ok: boolean }>(`/api/competitors/${competitorId}`, { method: "DELETE" }),

  /** 409 if setup hasn't run, 503 if no engine is configured. */
  startScan: (productId: number) => request<ScanStart>(`/api/products/${productId}/scans`, { method: "POST" }),
  scan: (id: number) => request<Scan>(`/api/scans/${id}`),
  setup: (productId: number) => request<SetupView>(`/api/products/${productId}/setup`),

  report: (id: string) => request<Report>(`/api/reports/${id}`),
  answers: (reportId: string, promptId: number, engine: string) =>
    request<Answer[]>(`/api/reports/${reportId}/answers?prompt_id=${promptId}&engine=${encodeURIComponent(engine)}`),
  /** 200 {draft_id} when the draft exists, 202 {job_id} while it's being drafted. */
  startFix: (reportId: string, fixKey: string) =>
    request<FixStart>(`/api/reports/${reportId}/fixes/${encodeURIComponent(fixKey)}`, { method: "POST" }),
  draft: (id: number) => request<Draft>(`/api/drafts/${id}`),

  save: (email: string) => request<SaveResult>("/api/orgs/save", { method: "POST", body: { email }, session: true }),
};
