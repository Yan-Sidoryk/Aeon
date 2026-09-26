import type { Draft } from "@/types/api";
import { Markdown } from "../Markdown";
import { Badge } from "../ui";
import { ClaimsTable } from "./ClaimsTable";
import { draftBody } from "./draft-utils";
import { PremlrPanel } from "./PremlrPanel";

/**
 * A finished "Fix this" draft: the content, its claim-to-label table, and the pre-MLR checklist with the fix
 * agent's rounds and exports. Used by the report's fix page and the dashboard's Content page. Layout follows the
 * space it gets (container queries, so a dashboard sidebar doesn't squeeze it): two columns when wide enough, the
 * checklist first when not.
 */
export function DraftView({ draft, brand }: { draft: Draft; brand: string }) {
  return (
    <div className="@container">
      <div className="grid items-start gap-6 @min-[52rem]:grid-cols-[minmax(0,1fr)_352px] @5xl:grid-cols-[minmax(0,1fr)_380px]">
        <PremlrPanel
          draft={draft}
          brand={brand}
          className="@min-[52rem]:sticky @min-[52rem]:top-24 @min-[52rem]:col-start-2 @min-[52rem]:row-start-1 @min-[52rem]:max-h-[calc(100dvh-7.5rem)] @min-[52rem]:overflow-y-auto @min-[52rem]:overscroll-contain"
        />
        <div className="@container flex min-w-0 flex-col gap-4 @min-[52rem]:col-start-1 @min-[52rem]:row-start-1">
          <article className="rounded-3xl border border-oat/70 bg-white p-5 @min-[36rem]:p-10">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="white">{brand ? `Draft for ${brand}` : "Draft"}</Badge>
              <Badge tone="periwinkle">Written from the FDA label</Badge>
            </div>
            <h2 className="mt-5 font-display text-[24px] leading-[1.18] font-medium tracking-[-0.02em] text-balance @min-[36rem]:text-[30px]">
              {draft.title}
            </h2>
            <Markdown className="mt-6">{draftBody(draft)}</Markdown>
          </article>
          <ClaimsTable claims={draft.claims} premlr={draft.premlr} brand={brand} />
        </div>
      </div>
    </div>
  );
}
