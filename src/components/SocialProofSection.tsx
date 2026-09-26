import { PersonaCards, type Persona } from "@/components/social/PersonaCards";
import { PolaroidStack, type PolaroidPhoto } from "@/components/social/PolaroidStack";
import { TaMarquee, type TherapeuticArea } from "@/components/social/TaMarquee";

type Stat = { value: string; label: string; source: string };

type SocialProofContent = {
  polaroids: readonly [back: PolaroidPhoto, middle: PolaroidPhoto, front: PolaroidPhoto];
  sticker: string;
  heading: { before: string; hand: string; after: string };
  stats: readonly Stat[];
  personasHeading: string;
  personas: readonly Persona[];
  areasLabel: string;
  areas: readonly TherapeuticArea[];
};

const CONTENT: SocialProofContent = {
  polaroids: [
    { src: "/images/photos/persona-medical.webp", alt: "", position: "object-[50%_20%]" },
    { src: "/images/photos/hero-marketer.webp", alt: "", position: "object-[70%_50%]" },
    {
      src: "/images/photos/hcp-phone.webp",
      alt: "Physician in a white coat checking his phone in a hospital corridor",
      position: "object-[50%_12%]",
    },
  ],
  sticker: "/images/doodles/doodle-phone.png",
  heading: { before: "HCPs and patients are", hand: "asking AI", after: "first" },
  // Third-party statistics: every number shows its source.
  stats: [
    { value: "2 in 3", label: "US HCPs use AI tools daily", source: "American Medical Association, 2025" },
    { value: "1 in 5", label: "HCPs use GenAI for diagnosis and treatment choices", source: "The Guardian, 2025" },
    { value: "70%", label: "of US HCPs find AI helpful for diagnosis", source: "Talker Research, 2025" },
    { value: "1 in 3", label: "American patients use AI to manage their health", source: "Talker Research, 2025" },
  ],
  personasHeading: "Built for every team that touches the brand",
  // Roles, not testimonials: no names, no quotes, no customer claims.
  personas: [
    {
      title: "Win back lost prompts",
      role: "Brand & digital marketing",
      detail: "See where competitors are recommended and you are not, then ship the fix.",
      image: "/images/photos/persona-brand.webp",
      alt: "Brand marketer standing in an office in front of a wall of campaign charts",
      href: "#faqs",
    },
    {
      title: "Catch wrong doses",
      role: "Medical affairs",
      detail: "AI sentence next to the label sentence, routed to medical information.",
      image: "/images/photos/persona-medical.webp",
      alt: "Medical affairs scientist in a lab coat holding a tablet in a lab",
      href: "#faqs",
    },
    {
      title: "Review, don't rewrite",
      role: "Regulatory & MLR",
      detail: "Drafts arrive claim-referenced with a pre-MLR risk score.",
      image: "/images/photos/persona-regulatory.webp",
      alt: "Regulatory reviewer reading printed documents at her desk",
      href: "#faqs",
    },
    {
      title: "Run every client brand",
      role: "Agencies",
      detail: "One website-in flow per client, one multi-brand overview.",
      image: "/images/photos/persona-agency.webp",
      alt: "Two agency teammates talking in front of a mood board",
      href: "#faqs",
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

/** Black social-proof sheet: polaroid + handwritten headline, sourced stats, persona cards, therapeutic-area band. */
export function SocialProofSection() {
  const { heading } = CONTENT;
  return (
    <section
      data-section="social"
      id="personas"
      aria-labelledby="social-heading"
      className="relative z-20 overflow-x-clip rounded-[20px] bg-ink pb-[40px] text-paper"
    >
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-10 px-[40px] pt-10 pb-20">
        <div className="flex w-full flex-col md:flex-row md:items-center md:gap-10">
          <div className="flex justify-center md:shrink-0 md:justify-start">
            <PolaroidStack photos={CONTENT.polaroids} sticker={CONTENT.sticker} />
          </div>
          <div className="mt-[5px] md:mt-0">
            {/* 7shifts renders three centered h2s below 810px and one inline h2 above; one h2 restyled per breakpoint. */}
            <h2
              id="social-heading"
              className="flex flex-col items-center gap-2.5 text-center font-display leading-[1.1] font-medium text-pretty text-paper md:block md:text-left md:text-[52px]"
            >
              <span className="text-[36px] md:text-[52px]">{heading.before}</span>{" "}
              <span className="-my-5 font-hand text-[72px] font-normal tracking-[-0.04em] whitespace-nowrap text-flame md:relative md:top-[0.1em] md:my-0">
                {heading.hand}
              </span>{" "}
              <span className="text-[36px] md:text-[52px]">{heading.after}</span>
            </h2>
          </div>
        </div>

        <ul className="grid w-full grid-cols-2 gap-x-10 gap-y-8 md:grid-cols-4 md:pb-10">
          {CONTENT.stats.map((stat) => (
            <li key={stat.value + stat.label} className="flex flex-col gap-2 md:text-center">
              <p className="font-display text-[36px] leading-[1.1] font-medium text-flame">{stat.value}</p>
              <p className="font-display text-[18px] leading-[1.5] text-paper">{stat.label}</p>
              <p className="-mt-1 text-[12px] leading-[1.5] text-paper/50">
                <span className="sr-only">Source: </span>
                {stat.source}
              </p>
            </li>
          ))}
        </ul>

        <div className="flex w-full flex-col items-start gap-5 pt-2.5 pb-5">
          <h3 className="self-stretch text-center font-display text-[28px] leading-8 font-medium text-paper md:pb-4 md:text-[44px] md:leading-[110%]">
            {CONTENT.personasHeading}
          </h3>
          <PersonaCards personas={CONTENT.personas} />
        </div>
      </div>

      <TaMarquee label={CONTENT.areasLabel} areas={CONTENT.areas} duration={MARQUEE_SECONDS} />
    </section>
  );
}
