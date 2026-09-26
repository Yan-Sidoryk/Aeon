"use client";

import { Check, Link2 } from "lucide-react";
import { useState } from "react";
import { PillButton } from "@/components/ui/pill-button";

/** The report URL is the share link: anyone with it can read the report (no sign-in yet). */
export function ShareButton() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", window.location.href);
    }
  }

  return (
    <PillButton variant="secondary" onClick={copy} className="h-11 w-fit shrink-0 px-5 text-[15px]">
      {copied ? <Check className="mr-2 size-4" /> : <Link2 className="mr-2 size-4" />}
      {copied ? "Link copied" : "Share report"}
    </PillButton>
  );
}
