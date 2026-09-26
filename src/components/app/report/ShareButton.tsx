"use client";

import { Check, Link2 } from "lucide-react";
import { useEffect, useState } from "react";
import { PillButton } from "@/components/ui/pill-button";

/** The report URL is the share link: anyone with it can read the report, no sign-in. */
export function ShareButton() {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    const url = window.location.href.split("#")[0];
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.prompt("Copy this link", url);
    }
  }

  return (
    <PillButton variant="secondary" onClick={copy} className="h-11 w-fit shrink-0 px-5 text-[15px]">
      {copied ? <Check className="mr-2 size-4" aria-hidden="true" /> : <Link2 className="mr-2 size-4" aria-hidden="true" />}
      <span aria-live="polite">{copied ? "Link copied" : "Share report"}</span>
    </PillButton>
  );
}
