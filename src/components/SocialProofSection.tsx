import { AnswerStack } from "@/components/social/AnswerStack";
import { FeatureCards, type FeatureCard } from "@/components/social/FeatureCards";
import { TaMarquee, type TherapeuticArea } from "@/components/social/TaMarquee";

type Stat = { value: string; label: string; source: string };

type SocialProofContent = {
  heading: { before: string; hand: string; after: string };
  stats: readonly Stat[];
  cardsHeading: string;
  cards: readonly FeatureCard[];
  areasLabel: string;
  areas: readonly TherapeuticArea[];
};

const CONTENT: SocialProofContent = {
  heading: { before: "HCPs and patients are", hand: "asking AI", after: "first" },
  // Third-party statistics: every number shows its source.
  stats: [
    { value: "2 in 3", label: "US HCPs use AI tools daily", source: "American Medical Association, 2025" },
    { value: "1 in 5", label: "HCPs use GenAI for diagnosis and treatment choices", source: "The Guardian, 2025" },
    { value: "70%", label: "of US HCPs find AI helpful for diagnosis", source: "Talker Research, 2025" },
    { value: "1 in 3", label: "American patients use AI to manage their health", source: "Talker Research, 2025" },
  ],
  cardsHeading: "Built for every team that touches the brand",
  // Teams, not testimonials: no names, no quotes, no customer claims. Screens are illustrative placeholders.
  cards: [
    {
      title: "Win back lost prompts",
      role: "Brand & digital marketing",
      detail: "See where competitors are recommended and you are not, then ship the fix.",
      href: "#faqs",
      panel: "bg-periwinkle",
      mock: "prompts",
    },
    {
      title: "Catch wrong doses",
      role: "Medical affairs",
      detail: "AI sentence next to the label sentence, routed to medical information.",
      href: "#faqs",
      panel: "bg-lavender",
      mock: "dose",
    },
    {
      title: "Review, don't rewrite",
      role: "Regulatory & MLR",
      detail: "Drafts arrive claim-referenced with a pre-MLR risk score.",
      href: "#faqs",
      panel: "bg-lime",
      mock: "review",
    },
    {
      title: "Run every client brand",
      role: "Agencies",
      detail: "One website-in flow per client, one multi-brand overview.",
      href: "#faqs",
      panel: "bg-oat",
      mock: "brands",
    },
  ],
  areasLabel: "Therapeutic areas",
  areas: [
    { label: "Obesity", icon: "/images/doodles/ta-obesity.png" },
    { label: "Immunology", icon: "/images/doodles/ta-immunology.png" },
    { label: "Oncology", icon: "/images/doodles/ta-oncology.png" },
    { label: "Neurology", icon: "/images/doodles/ta-neurology.png" },
    { label: "Cardiology", icon: "/images/doodles/ta-cardiology.png" },
    { label: "Women's health", icon: "/images/doodles/ta-womens-health.png" },
    { label: "Dermatology", icon: "/images/doodles/ta-dermatology.png" },
  ],
};

// 7shifts' band moves 1340.36px (half its track) per 30s = 44.68 px/s. Aeon's half track (7 items + 7 × 56px gaps)
// measures 1470.34px, so one loop takes 1470.34 / 44.68 = 32.91s for the same speed.
const MARQUEE_SECONDS = 32.91;

/**
 * White sheet with 40px top corners that slides over the sand coverage band: AI-answer card stack + handwritten
 * headline, sourced stats, one product card per team, and the lime therapeutic-area band.
 */
// Orange text on this white sheet uses #E85D04 (3.5:1) instead of the flame token #FF6808 (2.9:1) for AA large-text contrast.
export function SocialProofSection() {
  const { heading } = CONTENT;
  return (
    <section
      data-section="social"
      id="personas"
      aria-labelledby="social-heading"
      className="relative z-20 -mt-[40px] overflow-x-clip rounded-t-[40px] bg-white pb-[40px] text-ink"
    >
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-10 px-5 pt-12 pb-20 sm:px-10 md:pt-16">
        <div className="flex w-full flex-col items-center gap-2 md:flex-row md:gap-10">
          <AnswerStack className="md:shrink-0" />
          {/* One h2 restyled per breakpoint: three centered lines below 810px, one inline heading above. */}
          <h2
            id="social-heading"
            className="flex flex-col items-center gap-2.5 text-center font-display leading-[1.1] font-medium text-pretty md:block md:text-left md:text-[52px]"
          >
            <span className="text-[36px] md:text-[52px]">{heading.before}</span>{" "}
            <span className="-my-5 font-hand text-[72px] font-normal tracking-[-0.04em] whitespace-nowrap text-[#E85D04] md:relative md:top-[0.1em] md:my-0">
              {heading.hand}
            </span>{" "}
            <span className="text-[36px] md:text-[52px]">{heading.after}</span>
          </h2>
        </div>

        <ul className="grid w-full grid-cols-2 gap-x-10 gap-y-8 md:grid-cols-4 md:pb-10">
          {CONTENT.stats.map((stat) => (
            <li key={stat.value + stat.label} className="flex flex-col gap-2 md:text-center">
              <p className="font-display text-[36px] leading-[1.1] font-medium text-[#E85D04]">{stat.value}</p>
              <p className="font-display text-[18px] leading-[1.5] text-ink">{stat.label}</p>
              <p className="-mt-1 text-[12px] leading-[1.5] text-stone">
                <span className="sr-only">Source: </span>
                {stat.source}
              </p>
            </li>
          ))}
        </ul>

        <div className="flex w-full flex-col items-start gap-5 pt-2.5 pb-5">
          <h3 className="self-stretch text-center font-display text-[28px] leading-8 font-medium md:pb-4 md:text-[44px] md:leading-[110%]">
            {CONTENT.cardsHeading}
          </h3>
          <FeatureCards cards={CONTENT.cards} />
        </div>
      </div>

      <TaMarquee label={CONTENT.areasLabel} areas={CONTENT.areas} duration={MARQUEE_SECONDS} />
    </section>
  );
}
