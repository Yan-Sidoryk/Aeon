import { ArrowDown, ArrowRight } from "lucide-react";
import Link from "next/link";
import { AUDIENCE_SINGULAR } from "@/lib/format";
import type { Report } from "@/types/api";
import { Badge, Panel, SectionTitle } from "../ui";
import { engineLabeler, fixHref, fixesFor } from "./report-utils";

/** 3. "Where you lose": unbranded questions where an engine recommends a competitor and not you. */
export function LostQuestions({ report }: { report: Report }) {
  const brand = report.product.brand;
  const label = engineLabeler(report);
  const lost = report.lost_questions;

  return (
    <section aria-labelledby="lost-title">
      <SectionTitle>
        <span id="lost-title">Where you lose</span>
      </SectionTitle>
      <p className="mt-1.5 text-[15px] text-stone">Unbranded questions where AI recommends a competitor and not {brand}.</p>
      {lost.length === 0 ? (
        <Panel className="mt-5 text-[15px]">Whenever AI named a competitor on an unbranded question, it named {brand} too.</Panel>
      ) : (
        <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {lost.map((lq) => {
            const cells = report.questions.find((q) => q.id === lq.prompt_id)?.cells ?? {};
            const winning = Object.entries(cells)
              .filter(([, cell]) => cell.state === "you")
              .map(([engine]) => label(engine));
            const fix = fixesFor(report, lq.prompt)[0];
            return (
              <Panel key={lq.prompt_id} className="flex flex-col gap-4">
                <Badge className="w-fit">{AUDIENCE_SINGULAR[lq.audience]} question</Badge>
                <p className="font-display text-[18px] leading-[1.3] font-medium">“{lq.prompt}”</p>
                <div className="mt-auto flex flex-col gap-3">
                  <div>
                    <p className="text-[13px] text-stone">Recommended instead</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {lq.competitors.map((c) => (
                        <Badge key={c} className="bg-stone/12">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[13px] text-stone">Lost on</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {lq.engines.map((e) => (
                        <Badge key={e} tone="white">
                          {label(e)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {winning.length > 0 && (
                    <p className="text-[13px] leading-[1.45] text-stone">
                      Names {brand} here: <span className="text-royal-dark">{winning.join(", ")}</span>
                    </p>
                  )}
                  {fix ? (
                    <Link
                      href={fixHref(report.id, fix.key)}
                      className="inline-flex w-fit items-center gap-1.5 text-[14px] font-medium text-royal-dark underline-offset-4 hover:underline"
                    >
                      Fix this <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  ) : (
                    <a
                      href="#every-answer"
                      className="inline-flex w-fit items-center gap-1.5 text-[14px] font-medium text-stone underline-offset-4 hover:text-black hover:underline"
                    >
                      Read the answers <ArrowDown className="size-4" aria-hidden="true" />
                    </a>
                  )}
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </section>
  );
}
