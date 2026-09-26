import Image from "next/image";
import { FaqAccordion, type FaqItem } from "@/components/faq/FaqAccordion";

// Anatomy, spacing, type and states follow 7shifts' FAQ section (section#faqs); values are documented in
// docs/research/components/FaqSection.spec.md. Copy: docs/research/AEON_CONTENT.md §10.
// Breakpoints are 7shifts' own: "md" switches at 810px (min-[810px]: / max-[810px]:), "lg" at 1024px (lg:).
// Below lg 7shifts applies its `container` (max-width 376 / 400 / 567 / 810px at 376 / 400 / 567 / 810px).

const HEADING = "Frequently asked questions";

const FAQS: readonly FaqItem[] = [
  {
    question: "What is GEO for pharma?",
    answer:
      "Generative engine optimization is the work of making sure AI engines like ChatGPT, Gemini and Perplexity mention your brand and describe it accurately. For pharma it also means checking every answer against the label and making every fix MLR-ready.",
  },
  {
    question: "Which AI engines does Aeon track?",
    answer:
      "ChatGPT, Claude, Gemini, Perplexity, Google AI Overviews and AI Mode, Copilot and Meta AI. Each prompt is sampled several times per engine, by market and language.",
  },
  {
    question: "Does Aeon publish content for us?",
    answer:
      "No. Aeon drafts and never publishes. It produces MLR-ready drafts and exports them for review, including to Veeva PromoMats. Nothing goes live without human sign-off.",
  },
  {
    question: "How do you handle off-label questions?",
    answer:
      "Prompts outside the approved indication are monitor-only. They show up as signals for medical affairs and are never used to generate content.",
  },
  {
    question: "What happens if an AI answer describes an adverse event?",
    answer:
      "Possible adverse events found in monitoring are routed to your pharmacovigilance inbox under your SOP. Aeon does not store patient PHI.",
  },
  {
    question: "How reliable are the visibility scores?",
    answer:
      "AI answers vary by model, region and time, so every score shows its sample size and confidence interval, and our methodology is published.",
  },
  {
    question: "Is the first report really free?",
    answer:
      "Yes. The first scan needs only your company website. We ask for a work email when you want to save the report and track it weekly.",
  },
];

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

export function FaqSection() {
  return (
    <section
      id="faqs"
      data-section="faqs"
      aria-labelledby="faqs-heading"
      className="relative z-50 flex justify-center rounded-t-[40px] bg-sand px-5"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD).replace(/</g, "\\u003c") }}
      />
      <div className="flex max-w-[1000px] gap-5 py-14 max-lg:w-full max-[810px]:flex-col min-[376px]:max-lg:max-w-[376px] min-[400px]:max-lg:max-w-[400px] min-[567px]:max-lg:max-w-[567px] min-[810px]:mx-20 min-[810px]:items-start min-[810px]:gap-20 min-[810px]:py-40 min-[810px]:max-lg:max-w-[810px]">
        <div className="flex flex-col gap-3 min-[810px]:w-1/3 min-[810px]:max-w-80">
          <Image
            src="/images/doodles/doodle-faq.png"
            alt=""
            width={54}
            height={54}
            className="block h-[54px] w-[54px] max-w-full"
          />
          <h2
            id="faqs-heading"
            className="font-display text-4xl leading-[33px] font-medium tracking-[-1.08px] min-[810px]:text-5xl min-[810px]:leading-[43px] min-[810px]:tracking-[-1.44px]"
          >
            {HEADING}
          </h2>
        </div>
        <FaqAccordion items={FAQS} />
      </div>
    </section>
  );
}
