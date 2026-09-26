"use client";

import { Check, CircleCheck, Copy, Download, FileText, Lock, TriangleAlert } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { CheckCircleIcon, XCircleIcon } from "@/components/icons";
import { PillButton } from "@/components/ui/pill-button";
import { RULE_LABEL, plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Draft, PremlrFlag, PremlrStatus, Severity } from "@/types/api";
import { quoteText } from "../report/report-utils";
import { Badge } from "../ui";
import { STATUS_LABEL, downloadText, draftMarkdown, fileSlug, mlrPackage, roundsSummary } from "./draft-utils";
import { RoundsTimeline } from "./RoundsTimeline";

const STATUS_BOX: Record<PremlrStatus, string> = {
  ready: "border-lime bg-pass-soft text-forest",
  needs_changes: "border-flame/30 bg-flame/8 text-[#a84300]",
  blocked: "border-alert-line bg-alert-soft text-alert-ink",
};

const STATUS_NOTE: Record<PremlrStatus, string> = {
  ready: "Every check passes. Send it to your MLR team as a first pass.",
  needs_changes: "Some checks still fail. Fix what's flagged below before it goes to review.",
  blocked: "A claim isn't traceable to the label, so export is off until it is.",
};

const SEVERITIES: Severity[] = ["high", "medium", "low"];
const SEVERITY_HEADING: Record<Severity, string> = { high: "High", medium: "Medium", low: "Low" };
const DOT: Record<Severity, string> = { high: "bg-alert", medium: "bg-flame", low: "bg-taupe" };
const SOURCE_LABEL: Record<PremlrFlag["source"], string> = { rule: "FDA/OPDP rule", ai: "AI reviewer", system: "System" };

function StatusIcon({ status }: { status: PremlrStatus }) {
  if (status === "ready") return <CircleCheck className="size-6 shrink-0" aria-hidden="true" />;
  if (status === "blocked") return <Lock className="size-5 shrink-0" aria-hidden="true" />;
  return <TriangleAlert className="size-5 shrink-0" aria-hidden="true" />;
}

/** The excerpt with the banned phrase a rule matched highlighted. */
function Excerpt({ flag }: { flag: PremlrFlag }) {
  const text = quoteText(flag.excerpt);
  const at = flag.match ? text.toLowerCase().indexOf(flag.match.toLowerCase()) : -1;
  return (
    <p className="mt-2 line-clamp-4 border-l-2 border-oat pl-3 text-[13px] leading-[1.5] text-graphite">
      {at === -1 || !flag.match ? (
        text
      ) : (
        <>
          {text.slice(0, at)}
          <mark className="rounded-sm bg-alert/20 px-0.5 text-alert-ink">{text.slice(at, at + flag.match.length)}</mark>
          {text.slice(at + flag.match.length)}
        </>
      )}
    </p>
  );
}

/**
 * Pre-MLR checklist for a draft: status (Ready for MLR review, Needs changes, Blocked), the six yes/no checks with
 * what failed, the fix agent's rounds, reviewer notes by severity, and exports. No risk score.
 */
export function PremlrPanel({ draft, brand, className }: { draft: Draft; brand: string; className?: string }) {
  const { premlr } = draft;
  const blocked = premlr.status === "blocked";
  const passed = premlr.checks.filter((c) => c.passed).length;
  const summary = roundsSummary(draft.rounds, premlr.status);
  const groups = SEVERITIES.map((s) => [s, premlr.flags.filter((f) => f.severity === s)] as const).filter(([, list]) => list.length);
  const [copied, setCopied] = useState<"ok" | "failed" | null>(null);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(null), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(draftMarkdown(draft));
      setCopied("ok");
    } catch {
      setCopied("failed");
    }
  }

  return (
    <aside aria-label="Pre-MLR checklist" className={cn("rounded-3xl border border-oat/70 bg-white p-5 md:p-6", className)}>
      <p className="text-[14px] font-medium text-stone">Pre-MLR checklist</p>

      <div className={cn("mt-3 rounded-2xl border px-4 py-3.5", STATUS_BOX[premlr.status])}>
        <p className="flex items-center gap-2.5 font-display text-[22px] leading-tight font-medium tracking-[-0.01em]">
          <StatusIcon status={premlr.status} />
          {STATUS_LABEL[premlr.status]}
        </p>
        <p className="mt-1.5 text-[14px] leading-[1.45]">{STATUS_NOTE[premlr.status]}</p>
      </div>

      <p className="mt-3 text-[14px] text-stone">
        <span className="font-medium text-black">
          {passed} of {premlr.checks.length} checks pass
        </span>
        {summary && ` · ${summary}`}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <PillButton variant="secondary" onClick={copy} disabled={blocked} className="h-11 px-2 text-[14px]">
          {copied === "ok" ? <Check className="mr-1.5 size-4 shrink-0" aria-hidden="true" /> : <Copy className="mr-1.5 size-4 shrink-0" aria-hidden="true" />}
          <span aria-live="polite">{copied === "ok" ? "Copied" : copied === "failed" ? "Couldn't copy" : "Copy Markdown"}</span>
        </PillButton>
        <PillButton
          variant="secondary"
          onClick={() => downloadText(`${fileSlug(draft.title)}.md`, draftMarkdown(draft))}
          disabled={blocked}
          className="h-11 px-2 text-[14px]"
        >
          <Download className="mr-1.5 size-4 shrink-0" aria-hidden="true" /> Download .md
        </PillButton>
        <PillButton
          onClick={() => downloadText(`${fileSlug(draft.title)}-mlr-package.md`, mlrPackage(draft, brand))}
          disabled={blocked}
          className="col-span-2 h-11 px-3 text-[14px]"
        >
          <FileText className="mr-1.5 size-4 shrink-0" aria-hidden="true" /> MLR package (.md)
        </PillButton>
      </div>
      <p className="mt-2.5 text-[12px] leading-[1.5] text-stone">
        {blocked
          ? "Export is off while a claim can't be traced to the label."
          : `The MLR package adds a references table: each of the ${plural(draft.claims.length, "claim")} with its label section and verbatim quote.`}
      </p>

      <Block title="Checklist">
        <ul className="mt-3 flex flex-col gap-2">
          {premlr.checks.map((check) => (
            <li key={check.id} className={cn("rounded-xl px-3.5 py-3", check.passed ? "bg-offwhite" : "bg-alert-soft")}>
              <p className="flex items-start gap-2.5 text-[14px] leading-[1.4] font-medium">
                {check.passed ? (
                  <CheckCircleIcon checkColor="#244f47" className="mt-px size-[18px] shrink-0 text-lime" />
                ) : (
                  <XCircleIcon className="mt-px size-[18px] shrink-0 text-alert" />
                )}
                <span>
                  {check.label}
                  <span className="sr-only">{check.passed ? ": passes" : ": fails"}</span>
                </span>
              </p>
              {!check.passed && check.detail && <p className="mt-1.5 pl-[28px] text-[13px] leading-[1.5] text-alert-ink">{check.detail}</p>}
            </li>
          ))}
        </ul>
      </Block>

      {draft.rounds.length > 0 && (
        <Block title={`Review rounds · ${draft.rounds.length}`}>
          <RoundsTimeline rounds={draft.rounds} className="mt-3" />
        </Block>
      )}

      <Block title={premlr.flags.length ? `Reviewer notes · ${premlr.flags.length}` : "Reviewer notes"}>
        {groups.length === 0 ? (
          <p className="mt-2 text-[14px] text-stone">The reviewers had nothing to add.</p>
        ) : (
          groups.map(([severity, flags]) => (
            <div key={severity} className="mt-3">
              <p className="flex items-center gap-2 text-[12px] font-medium tracking-[0.02em] text-stone uppercase">
                <span className={cn("size-2 rounded-full", DOT[severity])} aria-hidden="true" />
                {SEVERITY_HEADING[severity]} · {flags.length}
              </p>
              <ul className="mt-2 flex flex-col gap-2">
                {flags.map((flag, i) => (
                  <li key={i} className="rounded-2xl bg-offwhite p-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[14px] font-medium">{RULE_LABEL[flag.rule] ?? flag.rule}</span>
                      <Badge tone="white" className="ml-auto h-5 px-2 text-[11px] leading-none">
                        {SOURCE_LABEL[flag.source]}
                      </Badge>
                    </div>
                    {flag.excerpt && <Excerpt flag={flag} />}
                    <p className="mt-2 text-[13px] leading-[1.5]">{flag.suggestion}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </Block>

      <p className="mt-5 border-t border-oat/70 pt-4 text-[12px] leading-[1.5] text-stone">
        A first pass for your MLR team, not a replacement for it. Rules check FDA/OPDP basics; the AI reviewer reads the
        draft against the label.
      </p>
    </aside>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-6 border-t border-oat/70 pt-5">
      <p className="text-[14px] font-medium">{title}</p>
      {children}
    </div>
  );
}
