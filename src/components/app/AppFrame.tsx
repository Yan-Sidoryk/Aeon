import type { ReactNode } from "react";
import { api, API_URL } from "@/lib/api";
import type { Health } from "@/types/api";
import { AppHeader } from "./AppHeader";

/** Shell for the product screens (/start/*, /report/*): header plus a banner when the API is in demo mode or down. */
export async function AppFrame({ children }: { children: ReactNode }) {
  let health: Health | null = null;
  try {
    health = await api.health();
  } catch {
    // shown below
  }

  return (
    <div className="min-h-dvh bg-offwhite">
      <AppHeader />
      {health === null && (
        <p role="alert" className="bg-alert-soft px-4 py-2.5 text-center text-[14px] leading-[1.4] text-alert-ink">
          Can&apos;t reach the Aeon API at {API_URL}.
          {process.env.NODE_ENV === "development" && (
            <>
              {" "}
              Start it with <code className="font-mono text-[13px]">npm run dev:api:demo</code>.
            </>
          )}
        </p>
      )}
      {health?.demo_mode && (
        // A replay must never pass for a real scan of the site someone typed in.
        <p className="bg-lime px-4 py-2.5 text-center text-[14px] leading-[1.4] text-forest">
          <strong className="font-semibold">Demo mode.</strong> Every website replays one recorded live scan
          {health.demo_domain ? ` of ${health.demo_domain}` : ""}. Results shown are not for the site you enter.
        </p>
      )}
      <main>{children}</main>
    </div>
  );
}
