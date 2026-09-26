"use client";

import { Check, Copy, Download, Lock, Zap } from "lucide-react";
import { useState } from "react";
import { PillButton } from "@/components/ui/pill-button";
import { RULE_LABEL, SEVERITY_RANK, plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Draft, PremlrFlag, Severity } from "@/types/api";
import { Badge, type Tone } from "../ui";

const LEVEL_TONE: Record<Severity, Tone> = { low: "lime", medium: "flame", high: "alert" };
const LEVEL_BAR: Record<Severity, string> = { low: "bg-mint-dark", medium: "bg-flame", high: "bg-alert" };
const LEVEL_LABEL: Record<Severity, string> = { low: "Low risk", medium: "Medium risk", high: "High risk" };
const DOT: Record<Severity, string> = { high: "bg-alert", medium: "bg-flame", low: "bg-taupe" };
const SOURCE_LABEL: Record<PremlrFlag["source"], string> = { rule: "FDA/OPDP rule", ai: "AI reviewer", system: "System" };

/** AI pre-MLR result: risk score, blocked / fast-track state, every flag with a suggested rewrite, and export. */
export function PremlrPanel({ draft }: { draft: Draft }) {
  const { premlr } = draft;
  const flags = [...premlr.flags].sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(`# ${draft.title}\n\n${draft.content_md}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function download() {
    const blob = new Blob([`# ${draft.title}\n\n${draft.content_md}\n`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${draft.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "draft"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <aside aria-label="Pre-MLR review" className="rounded-3xl border border-oat/70 bg-white p-6 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7.5rem)] lg:overflow-y-auto lg:overscroll-contain">
      <p className="text-[14px] font-medium text-stone">Pre-MLR review</p>
      <div className="mt-3 flex items-end gap-2">
        <span className="font-display text-[56px] leading-[0.85] font-medium tabular-nums">{premlr.risk_score}</span>
        <span className="text-[15px] text-stone">/ 100 risk</span>
        <Badge tone={LEVEL_TONE[premlr.risk_level]} className="mb-1 ml-auto">
          {LEVEL_LABEL[premlr.risk_level]}
        </Badge>
      </div>
      <span className="mt-4 block h-2 overflow-hidden rounded-full bg-sand">
        <span className={cn("block h-full rounded-full", LEVEL_BAR[premlr.risk_level])} style={{ width: `${Math.max(premlr.risk_score, 2)}%` }} />
      </span>

      {premlr.blocked && (
        <p className="mt-5 flex gap-2.5 rounded-xl border border-alert-line bg-alert-soft px-4 py-3 text-[14px] leading-[1.45] text-alert-ink">
          <Lock className="mt-0.5 size-4 shrink-0" />
          <span>
            <strong className="font-semibold">Blocked.</strong> A claim isn&apos;t traceable to the label. Fix it before
            this draft goes to review.
          </span>
        </p>
      )}
      {premlr.fast_track && (
        <Badge tone="lime" className="mt-5 h-7 px-3 text-[13px]">
          <Zap className="size-3.5" /> Fast-track eligible
        </Badge>
      )}

      <p className="mt-6 text-[14px] font-medium">{flags.length ? plural(flags.length, "flag") : "No flags"}</p>
      <ul className="mt-3 flex flex-col gap-2.5">
        {flags.map((flag, i) => (
          <li key={i} className="rounded-2xl bg-offwhite p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("size-2 rounded-full", DOT[flag.severity])} aria-hidden="true" />
              <span className="text-[14px] font-medium">{RULE_LABEL[flag.rule]}</span>
              <span className="text-[12px] text-stone capitalize">· {flag.severity}</span>
              <Badge tone="white" className="ml-auto">
                {SOURCE_LABEL[flag.source]}
              </Badge>
            </div>
            {flag.excerpt && (
              <p className="mt-2 line-clamp-3 border-l-2 border-oat pl-3 text-[13px] leading-[1.5] text-graphite">
                {flag.excerpt.replace(/\*\*/g, "")}
              </p>
            )}
            <p className="mt-2 text-[13px] leading-[1.5]">{flag.suggestion}</p>
          </li>
        ))}
      </ul>

      <div className="mt-6 grid grid-cols-2 gap-2">
        <PillButton variant="secondary" onClick={copy} disabled={premlr.blocked} className="h-11 px-3 text-[14px]">
          {copied ? <Check className="mr-1.5 size-4" /> : <Copy className="mr-1.5 size-4" />}
          {copied ? "Copied" : "Copy"}
        </PillButton>
        <PillButton variant="secondary" onClick={download} disabled={premlr.blocked} className="h-11 px-3 text-[14px]">
          <Download className="mr-1.5 size-4" /> Markdown
        </PillButton>
      </div>
      <p className="mt-4 text-[12px] leading-[1.5] text-stone">
        A first pass for your MLR team, not a replacement for it. Rules check FDA/OPDP basics; the AI reviewer reads the
        draft against the label.
      </p>
    </aside>
  );
}
