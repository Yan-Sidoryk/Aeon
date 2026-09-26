import { EngineStrip } from "@/components/hero/EngineStrip";
import { HERO_CONTENT } from "@/components/hero/hero.content";
import { HeroForm } from "@/components/hero/HeroForm";
import { ProductMock } from "@/components/hero/ProductMock";
import { UnderlineSwoosh } from "@/components/icons";

// Layout, type scale and spacing from 7shifts' hero (docs/research/components/Hero.spec.md).
// Breakpoints are 7shifts' (globals.css): md = 810px, xl = 1200px.
// Product-led: the CTA is onboarding Screen 1 (website in, "Scan my brands") and the media frame shows the product.
// The whole hero is server-rendered; the preview's motion is CSS-only.

const C = HERO_CONTENT;

export function Hero() {
  return (
    <section data-section="hero" aria-labelledby="hero-title" className="relative z-50 overflow-x-clip rounded-b-[40px] bg-white">
      <div className="mx-auto max-w-[1200px] px-5 pt-20 pb-10 md:px-10 xl:pt-[140px]">
        <div>
          <p className="text-center font-hand text-[28px] leading-none font-normal">{C.eyebrow}</p>

          <h1
            id="hero-title"
            className="text-center font-display text-[length:min(48px,13.4vw)] leading-[1.1] font-medium tracking-[-0.03em] md:text-[64px] md:leading-[0.9]"
          >
            <span className="md:block md:text-balance">{C.titleLead}</span>{" "}
            {/* Swoosh under "your pharma brand" where it fits on one line (>=480px), else under "pharma brand". */}
            <span className="min-[480px]:relative min-[480px]:inline-block">
              {C.titleSwooshPrefix}{" "}
              <span className="relative inline-block">
                {C.titleSwoosh}
                <span aria-hidden="true" className="absolute -bottom-2 left-0 block h-2 w-full min-[480px]:hidden">
                  <UnderlineSwoosh className="block h-full w-full text-flame" />
                </span>
              </span>
              <span
                aria-hidden="true"
                className="absolute -bottom-2 left-0 hidden h-2 w-full min-[480px]:block md:-bottom-4 md:h-[10px]"
              >
                <UnderlineSwoosh className="block h-full w-full text-flame" />
              </span>
            </span>
          </h1>

          <p className="py-10 text-center font-display text-[16px] leading-none font-medium">{C.subtitle}</p>

          <div className="mb-10">
            <HeroForm />
          </div>
        </div>

        <ProductMock />

        <EngineStrip />
      </div>
    </section>
  );
}
