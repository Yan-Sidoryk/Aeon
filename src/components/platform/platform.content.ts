// Copy for the platform section (docs/research/AEON_CONTENT.md §5). Visual panels come from ./PlatformMocks.

export type PlatformStepId = "track" | "verify" | "fix" | "review" | "measure";

export type PlatformStep = {
  id: PlatformStepId;
  /** Tab label, also rendered as the handwritten eyebrow on the card. */
  label: string;
  /** Doodle icon (transparent PNG, 240x240) shown in the tab (22px) and on the card (60px). */
  icon: string;
  title: string;
  body: string;
  checks: readonly [string, string, string];
  linkLabel: string;
  linkHref: string;
};

export type PlatformContent = {
  heading: string;
  sub: string;
  cta: string;
  steps: readonly PlatformStep[];
};

export const PLATFORM_CONTENT: PlatformContent = {
  heading: "From website to cross-LLM report in minutes",
  sub: "Aeon runs the whole loop: find the gaps in AI answers, draft the fix, and make it approval-ready before a reviewer ever opens it.",
  cta: "Start your free report",
  steps: [
    {
      id: "track",
      label: "Track",
      icon: "/images/doodles/doodle-track.png",
      title: "See who AI recommends, and why",
      body: "Run the questions patients, caregivers and HCPs actually ask across ChatGPT, Claude, Gemini, Perplexity and Google AI Overviews.",
      checks: [
        "Share of voice vs. named competitors",
        "Indication-level prompt libraries",
        "Citation map of the sources AI trusts",
      ],
      linkLabel: "Explore tracking",
      linkHref: "#platform",
    },
    {
      id: "verify",
      label: "Verify",
      icon: "/images/doodles/doodle-verify.png",
      title: "Catch answers that contradict the label",
      body: "Every answer is checked against your prescribing information for dose, indication, boxed warning and contraindications.",
      checks: [
        "Accuracy score next to share of voice",
        "AI sentence and label sentence, side by side",
        "Off-label and safety signals routed, not stored",
      ],
      linkLabel: "Explore accuracy checks",
      linkHref: "#platform",
    },
    {
      id: "fix",
      label: "Fix",
      icon: "/images/doodles/doodle-fix.png",
      title: "Draft label-grounded content that wins",
      body: "For every lost prompt, Aeon shows which page should win it and drafts what is missing, with every claim linked to an approved source.",
      checks: [
        "Direct-answer blocks, FAQs and schema",
        "Claims pulled from your approved library",
        "Unreferenced claims blocked, not flagged",
      ],
      linkLabel: "Explore content fixes",
      linkHref: "#platform",
    },
    {
      id: "review",
      label: "Review",
      icon: "/images/doodles/doodle-review.png",
      title: "Arrive at MLR approval-ready",
      body: "AI pre-review checks claims, fair balance, ISI and banned language before a human sees the draft. Reviewers review and sign off.",
      checks: [
        "Claim-to-source table and risk score",
        "Export to Veeva PromoMats",
        "Named sign-off with a full audit trail",
      ],
      linkLabel: "Explore pre-MLR review",
      linkHref: "#platform",
    },
    {
      id: "measure",
      label: "Measure",
      icon: "/images/doodles/doodle-measure.png",
      title: "Prove the lift on every fix",
      body: "Weekly re-scans show how AI answers change after a fix goes live, with sample size and confidence on every score.",
      checks: [
        "Before and after on the prompts you fixed",
        "Monday email on what changed in AI answers",
        "A methodology your MLR team can read",
      ],
      linkLabel: "Explore reporting",
      linkHref: "#platform",
    },
  ],
};
