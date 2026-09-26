import type { DraftClaim } from "@/types/api";
import { Badge, Panel, SectionTitle } from "../ui";

const SECTION_LABEL: Record<string, string> = {
  indications: "Indications",
  dosage: "Dosage",
  boxed_warning: "Boxed warning",
  contraindications: "Contraindications",
  warnings: "Warnings",
  adverse_reactions: "Adverse reactions",
};

/** Claim-to-source table: every claim in the draft next to the verbatim FDA label passage behind it. */
export function ClaimsTable({ claims }: { claims: DraftClaim[] }) {
  if (claims.length === 0) return null;
  return (
    <Panel className="mt-4 p-0 md:p-0">
      <div className="px-6 pt-6 md:px-8">
        <SectionTitle className="text-[20px] md:text-[20px]">Every claim, traced to the label</SectionTitle>
        <p className="mt-1 text-[14px] text-stone">Each claim in the draft with the verbatim label text that supports it.</p>
      </div>
      <ul className="mt-4">
        {claims.map((claim, i) => (
          <li key={i} className="grid gap-2 border-t border-oat/60 px-6 py-4 md:grid-cols-[1fr_1.2fr] md:gap-6 md:px-8">
            <p className="text-[15px] leading-[1.5]">{claim.text}</p>
            <div>
              <Badge tone="periwinkle">Label · {SECTION_LABEL[claim.label_section] ?? claim.label_section}</Badge>
              <p className="mt-2 text-[14px] leading-[1.5] text-graphite italic">“{claim.label_quote}”</p>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
