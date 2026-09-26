"use client";

import { Check } from "lucide-react";
import { useState, type FormEvent } from "react";
import { PillButton } from "@/components/ui/pill-button";
import { api, errorMessage } from "@/lib/api";
import { inputClass } from "../ui";

/** Save gate: the first time we ask for anything. Attaches a work email to this browser's anonymous session. */
export function SaveReport() {
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setSaved((await api.save(email.trim())).email);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="save-title" className="mt-16 rounded-3xl bg-royal px-6 py-10 text-white md:px-12 md:py-14">
      <h2 id="save-title" className="font-display text-[30px] leading-[1.1] font-medium tracking-[-0.02em] md:text-[40px]">
        Save this report
      </h2>
      {saved ? (
        <p className="mt-4 flex items-center gap-2 text-[17px]">
          <Check className="size-5" /> Saved to {saved}.
        </p>
      ) : (
        <>
          <p className="mt-3 max-w-[560px] text-[16px] leading-[1.55] text-white/85">
            Add your work email to keep it. The share link works either way.
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
          {error && <p className="mt-3 text-[14px] text-white">{error}</p>}
        </>
      )}
    </section>
  );
}
