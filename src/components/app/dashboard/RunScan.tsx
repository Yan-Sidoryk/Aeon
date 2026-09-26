"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PillButton, type PillButtonVariant } from "@/components/ui/pill-button";
import { api, errorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useDashboard } from "./context";

/**
 * Starts a scan of this drug and opens the live grid (/start/scan). A live scan costs real money, so while one is
 * already running this becomes a link to watch it instead of starting a second. A drug that was never set up has no
 * questions to ask, so it links to setup instead.
 */
export function RunScanButton({
  label = "Run scan now",
  variant = "dark",
  className,
}: {
  label?: string;
  variant?: PillButtonVariant;
  className?: string;
}) {
  const { productId, product, company, runningScan, needsSetup } = useDashboard();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const { scan_id } = await api.startScan(productId);
      router.push(`/start/scan?scan=${scan_id}`);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className={cn("flex flex-col items-start gap-2 sm:items-end", className)}>
      {needsSetup && company ? (
        <PillButton href={`/start/hero?company=${company.id}`} variant={variant} className="h-11 px-5 text-[15px]">
          Set up {product?.brand ?? "this drug"}
        </PillButton>
      ) : runningScan ? (
        <PillButton href={`/start/scan?scan=${runningScan.id}`} variant="secondary" className="h-11 gap-2 px-5 text-[15px]">
          <span aria-hidden="true" className="size-3.5 animate-spin rounded-full border-2 border-royal border-t-transparent" />
          Scan running · Watch live
        </PillButton>
      ) : (
        <PillButton
          variant={variant}
          onClick={run}
          disabled={busy || runningScan === undefined || needsSetup === undefined}
          className="h-11 gap-2 px-5 text-[15px]"
        >
          <RefreshCw className={cn("size-4", busy && "animate-spin")} strokeWidth={2.25} />
          {busy ? "Starting…" : label}
        </PillButton>
      )}
      {error && (
        <p role="alert" className="max-w-[320px] text-[13px] leading-[1.4] text-alert-ink sm:text-right">
          {error}
        </p>
      )}
    </div>
  );
}
