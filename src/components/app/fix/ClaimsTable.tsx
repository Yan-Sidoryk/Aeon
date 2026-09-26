import { TriangleAlert } from "lucide-react";
import { CheckCircleIcon, XCircleIcon } from "@/components/icons";
import { plural } from "@/lib/format";
import type { DraftClaim, Premlr } from "@/types/api";
import { Badge, Panel, SectionTitle } from "../ui";
import { sectionLabel } from "./draft-utils";

/**
 * Claim-to-label table: every claim in the draft next to the verbatim FDA label passage behind it, with the rule
 * check's verdict (a claim whose quote isn't in the label blocks export). Sized by container queries: render it inside
 * an `@container` (DraftView does).
 */
export function ClaimsTable({ claims, premlr, brand }: { claims: DraftClaim[]; premlr: Premlr; brand: string }) {
  if (claims.length === 0) return null;
  const traceCheck = premlr.checks.find((c) => c.id === "claims_traced");
  const untraced = new Set(
    premlr.flags.filter((f) => f.rule === "unsupported_claim" && f.source === "rule").map((f) => f.excerpt.trim())
  );
  const missing = claims.filter((c) => untraced.has(c.text.trim())).length;

  return (
    <Panel className="p-0 md:p-0">
      <div className="px-5 pt-6 @min-[40rem]:px-8">
        <SectionTitle className="text-[20px] leading-[1.2] md:text-[20px]">Every claim, traced to the label</SectionTitle>
        <p className="mt-1 text-[14px] leading-[1.5] text-stone">
          {plural(claims.length, "claim")} in the draft, each next to the text in {brand ? `${brand}'s` : "the"} FDA label that
          supports it.
        </p>
        {traceCheck && (
          <p className="mt-3 flex items-center gap-2 text-[14px] font-medium">
            {missing === 0 && traceCheck.passed ? (
              <>
                <CheckCircleIcon checkColor="#244f47" className="size-[18px] shrink-0 text-lime" />
                Every quote found word for word in the label
              </>
            ) : (
              <>
                <XCircleIcon className="size-[18px] shrink-0 text-alert" />
                <span className="text-alert-ink">
                  {missing > 0 ? `${plural(missing, "quote")} not found in the label` : "Not every claim traces to the label"}
                </span>
              </>
            )}
          </p>
        )}
      </div>
      <ol className="mt-4">
        {claims.map((claim, i) => (
          <li key={i} className="grid gap-3 border-t border-oat/60 px-5 py-4 @min-[40rem]:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] @min-[40rem]:gap-6 @min-[40rem]:px-8">
            <p className="flex gap-3 text-[15px] leading-[1.5]">
              <span className="w-5 shrink-0 text-right font-display text-[14px] leading-[1.6] text-taupe tabular-nums">{i + 1}</span>
              <span className="min-w-0">{claim.text}</span>
            </p>
            <div className="min-w-0 pl-8 @min-[40rem]:pl-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge tone="periwinkle">Label · {sectionLabel(claim.label_section)}</Badge>
                {untraced.has(claim.text.trim()) && (
                  <Badge tone="alert">
                    <TriangleAlert className="size-3" strokeWidth={2.5} aria-hidden="true" /> Not found in the label
                  </Badge>
                )}
              </div>
              <p className="mt-2 text-[14px] leading-[1.5] break-words text-graphite italic">“{claim.label_quote}”</p>
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
