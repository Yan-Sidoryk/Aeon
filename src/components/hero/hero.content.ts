// Copy for the hero and the AI-engine strip (docs/research/AEON_CONTENT.md §3–4).
// Numbers inside the overlay cards are illustrative product UI, not claims.

export type HeroEngine = {
  name: string;
};

export type HeroContent = {
  eyebrow: string;
  /** Desktop line 1; the swoosh phrase follows on its own line. */
  titleLead: string;
  /** Word(s) before the mobile swoosh phrase. */
  titleSwooshPrefix: string;
  /** Phrase underlined on every breakpoint. */
  titleSwoosh: string;
  subtitle: string;
  cta: string;
  micro: string;
  media: {
    src: string;
    poster: string;
    pauseLabel: string;
    playLabel: string;
  };
  cards: {
    visibility: {
      title: string;
      caption: string;
      rows: { label: string; value: number; tone: "brand" | "competitor" }[];
    };
    accuracy: {
      title: string;
      finding: string;
      sources: string;
      action: string;
    };
    scan: {
      title: string;
      label: string;
      done: number;
      total: number;
    };
  };
  engines: {
    label: string;
    mobileLine: string;
    hoverCaption: string;
    href: string;
    items: HeroEngine[];
  };
};

export const HERO_CONTENT: HeroContent = {
  eyebrow: "More than rank tracking",
  titleLead: "See how AI actually talks about",
  titleSwooshPrefix: "your",
  titleSwoosh: "pharma brand",
  subtitle:
    "Audit how ChatGPT, Claude, Gemini and Perplexity answer about your brand, by indication, market and audience.",
  cta: "Start your free report",
  micro: "Free first scan. No credit card required.",
  media: {
    src: "/videos/hero-loop.mp4",
    poster: "/videos/hero-poster.webp",
    pauseLabel: "Pause background video",
    playLabel: "Play background video",
  },
  cards: {
    visibility: {
      title: "AI visibility",
      caption: "Share of answers · last 7 days",
      rows: [
        { label: "You", value: 34, tone: "brand" },
        { label: "Competitor X", value: 71, tone: "competitor" },
      ],
    },
    accuracy: {
      title: "Accuracy check",
      finding: "2 answers state the wrong dose",
      sources: "ChatGPT · Perplexity",
      action: "View",
    },
    scan: {
      title: "Scanning…",
      label: "Reading answers",
      done: 128,
      total: 200,
    },
  },
  engines: {
    label: "Tracking answers across",
    mobileLine: "Tracking answers across ChatGPT, Claude, Gemini, Perplexity and more",
    hoverCaption: "How we sample it",
    href: "#faqs",
    items: [
      { name: "ChatGPT" },
      { name: "Claude" },
      { name: "Gemini" },
      { name: "Perplexity" },
      { name: "AI Overviews" },
      { name: "Copilot" },
    ],
  },
};
