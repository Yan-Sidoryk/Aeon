import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSessionId } from "./session";

// Anonymous first: with Supabase configured, the first visit signs in anonymously (no form), and the save gate
// adds a work email to the same user, so everything created before carries over. Without Supabase (demo, local)
// the browser's X-Session-Id identifies the caller instead.
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const authEnabled = Boolean(URL && ANON_KEY);

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient | null {
  if (!authEnabled || typeof window === "undefined") return null;
  client ??= createClient(URL, ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true } });
  return client;
}

let signingIn: Promise<string | null> | null = null;

/** The caller's Supabase access token, signing in anonymously on first use; null when auth is off. */
export async function accessToken(): Promise<string | null> {
  const sb = supabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  if (data.session) return data.session.access_token;
  signingIn ??= sb.auth.signInAnonymously().then(({ data: signedIn, error }) => {
    signingIn = null;
    if (error) throw new Error(`Sign-in failed: ${error.message}`);
    return signedIn.session?.access_token ?? null;
  });
  return signingIn;
}

/** Headers that identify the caller to the backend. */
export async function authHeaders(): Promise<Record<string, string>> {
  const token = await accessToken();
  if (token) return { Authorization: `Bearer ${token}`, "X-Session-Id": getSessionId() };
  return typeof window === "undefined" ? {} : { "X-Session-Id": getSessionId() };
}

/** Save gate: attach a work email to the (anonymous) account. Supabase emails a confirmation link. */
export async function attachEmail(email: string): Promise<"confirm_email" | "saved"> {
  const sb = supabase();
  if (!sb) return "saved";
  const { error } = await sb.auth.updateUser({ email });
  if (error) throw new Error(error.message);
  return "confirm_email";
}
