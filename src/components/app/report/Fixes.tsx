import { PillButton } from "@/components/ui/pill-button";
import { FIX_KIND_LABEL, plural } from "@/lib/format";
import type { Report } from "@/types/api";
import { Badge, SectionTitle } from "../ui";
import { KIND_TONE, decodeEscapes, fixHref } from "./report-utils";

/** 5. Top fixes, each with "Fix this": a label-grounded draft that goes through the pre-MLR checklist. */
export function Fixes({ report }: { report: Report }) {
  if (report.fixes.length === 0) return null;
  return (
    <section aria-labelledby="fixes-title">
      <SectionTitle>
        <span id="fixes-title">Top {report.fixes.length} fixes</span>
      </SectionTitle>
      <p className="mt-1.5 max-w-[720px] text-[15px] leading-[1.5] text-stone">
        Each one drafts content from {report.product.brand}&apos;s FDA label and revises it until it passes the pre-MLR
        checklist, before you see it.
      </p>
      <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {report.fixes.map((fix, i) => (
          <article key={fix.key} className="flex flex-col rounded-2xl border border-oat/70 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="font-display text-[28px] leading-none font-medium text-oat">{i + 1}</span>
              <Badge tone={KIND_TONE[fix.kind]}>{FIX_KIND_LABEL[fix.kind]}</Badge>
            </div>
            <h3 className="mt-4 font-display text-[18px] leading-[1.3] font-medium">{decodeEscapes(fix.title)}</h3>
            <p className="mt-2 line-clamp-5 text-[14px] leading-[1.55] text-graphite">{decodeEscapes(fix.why)}</p>
            {fix.target_prompts.length > 0 && (
              <p className="mt-3 text-[13px] text-stone">Answers {plural(fix.target_prompts.length, "question")} from the scan</p>
            )}
            <div className="mt-auto pt-5">
              <PillButton href={fixHref(report.id, fix.key)} className="h-11 w-full">
                Fix this
              </PillButton>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
