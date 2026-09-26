import Image from "next/image";
import { PillButton, START_HREF, WALKTHROUGH_HREF } from "@/components/ui/pill-button";

// Layout, type and motion follow 7shifts' final CTA panel (docs/research/components/FinalCtaSection.spec.md).
// md/lg/xl are 7shifts' breakpoints (810 / 1024 / 1200px, set in the theme), so the classes mirror theirs 1:1.

type StatCard = { value: string; label: string; icon: string };

// "in\u00a0the" keeps the lime phrase from leaving a lone "in" at the end of a line.
const HEADLINE = { lead: "Explore your brand", highlight: "in\u00a0the AI search era" } as const;
const CTA_LABELS = { start: "Start your free report", walkthrough: "Book a walkthrough" } as const;

// Product facts only (no ratings, review counts or platform logos).
const STAT_CARDS: readonly StatCard[] = [
  { value: "5 min", label: "to your first report", icon: "/images/doodles/doodle-track.png" },
  { value: "7+", label: "AI engines tracked", icon: "/images/doodles/doodle-phone.png" },
  { value: "40", label: "prompts in your first scan", icon: "/images/doodles/doodle-faq.png" },
  { value: "0", label: "claims without a source", icon: "/images/doodles/doodle-verify.png" },
  { value: "100%", label: "human sign-off before publish", icon: "/images/doodles/doodle-review.png" },
];

/*
 * Stat marquee, one list for every breakpoint (7shifts swaps markup in JS; the geometry here is identical):
 * - <1200: horizontal strip, cards 320 (384 from 1024) wide, 90deg edge fade (7shifts `.horizontal-shadow`).
 * - ≥1200: vertical column in a 450×440 clip, cards 384×128, hard-clipped by the panel edges.
 * Speed matches 7shifts (≈19.4px/s horizontal at phone width, 19.95px/s vertical). Each track ends with a
 * gap-sized padding so translate(-50%) lands exactly on the duplicate set: a seamless loop (7shifts jumps).
 * Durations = one set / speed: 5×(320+6)=1630px → 84.1s, 5×(384+6)=1950px → 100.6s, 5×(128+6)=670px → 33.6s.
 * animation-duration is set directly because --animate-marquee-* resolve var(--marquee-duration) at :root.
 */
const VIEWPORT_CLASSES =
  "relative w-full overflow-hidden [mask-image:linear-gradient(90deg,transparent_0%,#000_12.5%,#000_87.5%,transparent_100%)] xl:h-[440px] xl:max-w-[450px] xl:[mask-image:none]";
const TRACK_CLASSES =
  "flex w-max animate-marquee-x gap-[6px] pr-[6px] will-change-transform [animation-duration:84.1s] lg:[animation-duration:100.6s] xl:w-auto xl:animate-marquee-y xl:flex-col xl:pr-0 xl:pb-[6px] xl:[animation-duration:33.6s]";

function StatCardItem({ card, duplicate = false }: { card: StatCard; duplicate?: boolean }) {
  return (
    <li
      aria-hidden={duplicate || undefined}
      className="flex w-80 shrink-0 items-center gap-3 rounded-[20px] bg-white p-7 lg:w-96"
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="font-display text-5xl font-medium">{card.value}</p>
        <p className="text-stone max-md:leading-4">{card.label}</p>
      </div>
      <Image src={card.icon} alt="" width={56} height={56} className="size-10 shrink-0 lg:size-14" />
    </li>
  );
}

export function FinalCtaSection() {
  return (
    <div data-section="cta" className="relative z-50 -my-[40px] rounded-[40px]">
      {/* pb-[80px] below xl: the footer sheet now overlaps this panel's last 40px (the resources section used to sit
          between them), so the horizontal stat strip needs that much extra room to stay fully visible. */}
      <section aria-labelledby="final-cta-heading" className="rounded-[40px] bg-royal p-[40px] pb-[80px] xl:py-0">
        <div className="mx-auto max-w-[1200px] xl:flex">
          <div className="xl:flex xl:w-1/2 xl:flex-col xl:justify-center xl:py-[40px]">
            <h2
              id="final-cta-heading"
              className="mb-[24px] font-display text-[48px] leading-none font-medium tracking-[-0.03em] text-white md:text-[64px]"
            >
              {HEADLINE.lead} <span className="text-lime">{HEADLINE.highlight}</span>
            </h2>
            {/* flex-wrap: Aeon's longer labels (386px) exceed the 310px phone column; 7shifts' fit on one row. */}
            <div className="flex flex-wrap gap-[10px]">
              <PillButton href={START_HREF} variant="secondary">
                {CTA_LABELS.start}
              </PillButton>
              <PillButton href={WALKTHROUGH_HREF} variant="outline">
                {CTA_LABELS.walkthrough}
              </PillButton>
            </div>
          </div>

          <div className="mt-[40px] xl:mt-0 xl:flex xl:w-1/2 xl:justify-end">
            <div className={VIEWPORT_CLASSES}>
              <ul className={TRACK_CLASSES}>
                {STAT_CARDS.map((card) => (
                  <StatCardItem key={card.value} card={card} />
                ))}
                {STAT_CARDS.map((card) => (
                  <StatCardItem key={`duplicate-${card.value}`} card={card} duplicate />
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
