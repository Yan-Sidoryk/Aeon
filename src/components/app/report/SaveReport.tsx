"use client";

import { ArrowRight, Check, MailCheck } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { PillButton } from "@/components/ui/pill-button";
import { api, errorMessage } from "@/lib/api";
import { attachEmail } from "@/lib/auth";
import { inputClass } from "../ui";

type Saved = { email: string; confirm: boolean };

/**
 * Save gate: the first time we ask for anything. Attaches a work email to this browser's anonymous account; with
 * sign-in on, Supabase emails a confirmation link first.
 */
export function SaveReport({ brand }: { brand: string }) {
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState<Saved | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(event: FormEvent) {
    event.preventDefault();
    const value = email.trim();
    setBusy(true);
    setError(null);
    try {
      const outcome = await attachEmail(value);
      const result = await api.save(value);
      setSaved({ email: result.email, confirm: outcome === "confirm_email" });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="save-title" className="rounded-3xl bg-royal px-6 py-10 text-white md:px-12 md:py-14">
      <h2 id="save-title" className="font-display text-[30px] leading-[1.1] font-medium tracking-[-0.02em] md:text-[40px]">
        Save this report
      </h2>
      {saved?.confirm ? (
        <div aria-live="polite" className="mt-4 max-w-[560px]">
          <p className="flex items-center gap-2 text-[17px] font-medium">
            <MailCheck className="size-5 shrink-0" aria-hidden="true" /> Check your inbox
          </p>
          <p className="mt-2 text-[16px] leading-[1.55] text-white/85">
            We sent a confirmation link to {saved.email}. Open it to keep this report and everything you made before
            signing in.
          </p>
        </div>
      ) : saved ? (
        <div aria-live="polite" className="mt-4 flex flex-col items-start gap-5">
          <p className="flex items-center gap-2 text-[17px]">
            <Check className="size-5 shrink-0" aria-hidden="true" /> Saved to {saved.email}.
          </p>
          <PillButton href="/app" variant="dark" className="px-6">
            Open your dashboard <ArrowRight className="ml-2 size-4" aria-hidden="true" />
          </PillButton>
        </div>
      ) : (
        <>
          <p className="mt-3 max-w-[560px] text-[16px] leading-[1.55] text-white/85">
            Add your work email to keep it and track {brand} every week from your dashboard. The share link works
            either way.
          </p>
          <form onSubmit={save} className="mt-6 flex max-w-[560px] flex-col gap-3 sm:flex-row">
            <label className="flex-1">
              <span className="sr-only">Work email</span>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${inputClass} border-white bg-white text-black`}
              />
            </label>
            <PillButton type="submit" variant="dark" disabled={busy} className="px-6">
              {busy ? "Saving…" : "Save report"}
            </PillButton>
          </form>
          {error && (
            <p role="alert" className="mt-3 text-[14px] text-white">
              {error}
            </p>
          )}
          <p className="mt-4 text-[13px] text-white/70">
            Already saved? <Link href="/app" className="underline underline-offset-3 hover:text-white">Open your dashboard</Link>
          </p>
        </>
      )}
    </section>
  );
}
