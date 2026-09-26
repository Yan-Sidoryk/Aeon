import { BrandLogo, BRANDS, type BrandId } from "@/components/brand-logos";
import { HERO_CONTENT } from "@/components/hero/hero.content";

// 7shifts: div.pt-[40px].md:pt-[80px] > p.md:hidden (mobile line) + ul of six 120x112 logo items that turn
// full-opacity with a stone-100 background and reveal a "Read their story" caption on hover.
// Aeon: the AI engines Aeon samples, as their real logos (wordmark where the brand has one, icon + name otherwise),
// black artwork at 55% opacity like 7shifts' grey customer logos; full ink on hover. Caption links to #faqs.

const { engines } = HERO_CONTENT;

/** Wordmark heights, balanced by eye (each artwork has different built-in padding); shrink below ~390px. */
const WORDMARK_HEIGHT: Partial<Record<BrandId, string>> = {
  claude: "h-[min(22px,5.7vw)]",
  gemini: "h-[min(24px,6.2vw)]",
  perplexity: "h-[min(21px,5.4vw)]",
  copilot: "h-[min(25px,6.4vw)]",
};

function EngineLogo({ id, name }: { id: BrandId; name?: string }) {
  if (name) {
    return (
      <span className="flex items-center gap-[min(6px,1.5vw)]">
        <BrandLogo id={id} variant="mono" size={20} alt="" className="size-[min(20px,5.2vw)]" />
        <span className="font-display text-[length:min(17px,4.4vw)] leading-none font-semibold tracking-[-0.03em] whitespace-nowrap text-black">
          {name}
        </span>
      </span>
    );
  }
  return <BrandLogo id={id} variant="wordmark" size={24} alt={BRANDS[id].name} className={`w-auto ${WORDMARK_HEIGHT[id] ?? "h-6"}`} />;
}

export function EngineStrip() {
  return (
    <div className="pt-10 md:pt-[56px]">
      {/* 7shifts' "55K+ restaurants…" line: mobile only. */}
      <p className="mb-5 text-center font-display text-[18px] leading-none font-medium md:hidden">{engines.mobileLine}</p>
      {/* Desktop label sits inside 7shifts' 80px top padding (56 + 16.5 + 7.5) so the row keeps its y. */}
      <p className="hidden text-center text-[11px] leading-[1.5em] text-stone md:mb-[7.5px] md:block">{engines.label}</p>
      <ul className="grid w-full grid-cols-3 items-start justify-items-center gap-5 py-[10px] md:flex md:flex-nowrap md:justify-center">
        {engines.items.map((engine) => (
          <li
            key={engine.id}
            className="group flex h-28 w-[120px] min-w-0 flex-col items-center justify-center gap-2 rounded-lg p-2 opacity-55 transition-[background-color,opacity] duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] focus-within:bg-[#f5f5f4] focus-within:opacity-100 hover:bg-[#f5f5f4] hover:opacity-100 min-[900px]:shrink-0"
          >
            <a
              href={engines.href}
              className="flex flex-col items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-royal"
            >
              <span className="flex h-11 items-center justify-center">
                <EngineLogo id={engine.id} name={engine.name} />
              </span>
              <span className="inline-flex items-center justify-center rounded-[100px] px-0.5 py-0.5 opacity-0 transition-opacity duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] group-focus-within:opacity-100 group-hover:opacity-100">
                <span className="block font-display text-xs leading-3 font-medium whitespace-nowrap text-black">
                  {engines.hoverCaption}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
