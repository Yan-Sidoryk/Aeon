import { HERO_CONTENT } from "@/components/hero/hero.content";

// 7shifts: div.pt-[40px].md:pt-[80px] > p.md:hidden (mobile line) + ul of six 120x112 logo items that turn
// full-opacity with a stone-100 background and reveal a "Read their story" caption on hover.
// Aeon: grayscale text wordmarks of the AI engines Aeon samples (no third-party logo files), caption links to #faqs.

const { engines } = HERO_CONTENT;

export function EngineStrip() {
  return (
    <div className="pt-10 md:pt-[56px]">
      {/* 7shifts' "55K+ restaurants…" line: mobile only. */}
      <p className="mb-5 text-center font-display text-[18px] leading-none font-medium md:hidden">
        {engines.mobileLine}
      </p>
      {/* Desktop label sits inside 7shifts' 80px top padding (56 + 16.5 + 7.5) so the row keeps its y. */}
      <p className="hidden text-center text-[11px] leading-[1.5em] text-stone md:mb-[7.5px] md:block">
        {engines.label}
      </p>
      <ul className="grid w-full grid-cols-3 items-start justify-items-center gap-5 py-[10px] md:flex md:flex-nowrap md:justify-center">
        {engines.items.map((engine) => (
          <li
            key={engine.name}
            className="group flex h-28 w-[120px] min-w-0 flex-col items-center justify-center gap-2 rounded-lg p-2 opacity-70 mix-blend-luminosity transition-colors duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] focus-within:bg-[#f5f5f4] focus-within:opacity-100 focus-within:mix-blend-normal hover:bg-[#f5f5f4] hover:opacity-100 hover:mix-blend-normal min-[900px]:shrink-0"
          >
            <a href={engines.href} className="block rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-royal">
              <span className="flex h-11 items-center justify-center font-display text-[length:min(20px,5.34vw)] leading-none font-semibold tracking-[-0.03em] whitespace-nowrap text-[#333] transition-colors duration-150 group-hover:text-black">
                {engine.name}
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
