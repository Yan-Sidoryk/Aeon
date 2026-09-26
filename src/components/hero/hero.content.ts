// Copy for the hero, its product preview and the AI-engine strip (docs/research/AEON_CONTENT.md §3–4,
// onboarding flow in docs/user-journey-pharma-onboarding.md). Brand, competitor and every number inside the
// product preview are illustrative placeholders, not results.
import type { BrandId } from "@/components/brand-logos";

export type Audience = "Patient" | "Caregiver" | "HCP";

/** What one engine said for one prompt: recommends you, recommends the competitor, neither, or states a wrong fact. */
export type MockCell = "you" | "comp" | "none" | "wrong";

export type MockRow = {
  prompt: string;
  audience: Audience;
  /** One result per engine, in `mock.engines` order. */
  cells: readonly [MockCell, MockCell, MockCell, MockCell, MockCell];
};

/** A sentence with one highlighted phrase. */
export type Quote = { before: string; highlight: string; after: string };

export type HeroEngine = {
  id: BrandId;
  /** Shown as the brand icon + this name (engines without a wordmark file); otherwise the wordmark is used. */
  name?: string;
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
  form: {
    label: string;
    placeholder: string;
    /** Query parameter the /start onboarding flow reads. */
    param: string;
    submit: string;
    micro: string;
    walkthrough: string;
  };
  mock: {
    /** Screen-reader summary of the decorative product preview. */
    description: string;
    brand: string;
    brandInitial: string;
    indication: string;
    tabs: readonly string[];
    scanning: string;
    complete: string;
    share: string;
    title: string;
    meta: string;
    audiences: readonly string[];
    counters: {
      answers: { label: string; value: number };
      you: { label: string; value: number };
      competitor: { label: string; value: number };
      accuracy: { label: string; value: number; note: string };
    };
    promptHeader: string;
    engines: readonly { id: BrandId; name: string }[];
    rows: readonly MockRow[];
    cellLabels: Record<MockCell, string>;
    report: {
      eyebrow: string;
      building: string;
      you: { label: string; value: number };
      competitor: { label: string; value: number };
      takeaway: string;
      accuracy: {
        title: string;
        aiSource: string;
        aiQuote: Quote;
        labelSource: string;
        labelQuote: Quote;
      };
      fixesTitle: string;
      fixes: readonly string[];
      fixCta: string;
    };
    /** Mobile: the reading-answers line shown while the grid fills. */
    reading: string;
  };
  engines: {
    label: string;
    mobileLine: string;
    hoverCaption: string;
    href: string;
    items: readonly HeroEngine[];
  };
};

export const HERO_CONTENT: HeroContent = {
  eyebrow: "More than rank tracking",
  titleLead: "See how AI actually talks about",
  titleSwooshPrefix: "your",
  titleSwoosh: "pharma brand",
  subtitle:
    "Audit how ChatGPT, Claude, Gemini and Perplexity answer about your brand, by indication, market and audience.",
  form: {
    label: "Your company website",
    placeholder: "acmepharma.com",
    param: "website",
    submit: "Scan my brands",
    micro: "Free first scan. No credit card required.",
    walkthrough: "or book a walkthrough",
  },
  mock: {
    description:
      "Product preview: Aeon's first scan reads 200 AI answers about Brand A across ChatGPT, Claude, Gemini, Perplexity and Google AI Overviews, then reports a visibility score of 34 against Competitor X's 71, flags two answers that state the wrong dose, and lists the top fixes.",
    brand: "Brand A",
    brandInitial: "A",
    indication: "Atopic dermatitis",
    tabs: ["Overview", "Prompts", "Accuracy", "Fixes"],
    scanning: "Scanning",
    complete: "Scan complete",
    share: "Share",
    title: "First scan",
    meta: "40 prompts · 5 engines · US · English",
    audiences: ["All", "Patient", "Caregiver", "HCP"],
    counters: {
      answers: { label: "Answers read", value: 200 },
      you: { label: "Mentions of you", value: 34 },
      competitor: { label: "Competitor X", value: 71 },
      accuracy: { label: "Accuracy issues", value: 2, note: "Checked against the label" },
    },
    promptHeader: "Prompt",
    engines: [
      { id: "chatgpt", name: "ChatGPT" },
      { id: "claude", name: "Claude" },
      { id: "gemini", name: "Gemini" },
      { id: "perplexity", name: "Perplexity" },
      { id: "google", name: "AI Overviews" },
    ],
    rows: [
      { prompt: "Best treatment for moderate eczema?", audience: "Patient", cells: ["comp", "comp", "you", "comp", "comp"] },
      { prompt: "How is [brand] dosed?", audience: "HCP", cells: ["wrong", "you", "you", "you", "none"] },
      { prompt: "[Brand] vs Competitor X", audience: "Patient", cells: ["comp", "you", "comp", "comp", "comp"] },
      { prompt: "Is [brand] safe long-term?", audience: "Caregiver", cells: ["you", "you", "comp", "you", "none"] },
      { prompt: "Can teens use [brand]?", audience: "Caregiver", cells: ["none", "comp", "none", "you", "comp"] },
      { prompt: "Top biologic for atopic dermatitis?", audience: "HCP", cells: ["comp", "comp", "comp", "you", "comp"] },
    ],
    cellLabels: { you: "You", comp: "Comp. X", none: "—", wrong: "Wrong dose" },
    report: {
      eyebrow: "AI visibility report",
      building: "Building your report…",
      you: { label: "You", value: 34 },
      competitor: { label: "Competitor X", value: 71 },
      takeaway: "AI recommends Competitor X twice as often.",
      accuracy: {
        title: "2 answers state the wrong dose",
        aiSource: "ChatGPT says",
        aiQuote: { before: "“Take [brand] ", highlight: "200 mg twice daily", after: ".”" },
        labelSource: "FDA label",
        labelQuote: { before: "“The recommended dose is ", highlight: "100 mg once daily", after: ".”" },
      },
      fixesTitle: "Top fixes",
      fixes: ["Correct the dose in 2 answers", "Win “best treatment” prompts", "Answer teen-use questions"],
      fixCta: "Fix this",
    },
    reading: "Reading answers",
  },
  engines: {
    label: "Tracking answers across",
    mobileLine: "Tracking answers across ChatGPT, Claude, Gemini, Perplexity and more",
    hoverCaption: "How we sample it",
    href: "#faqs",
    items: [
      { id: "chatgpt", name: "ChatGPT" },
      { id: "claude" },
      { id: "gemini" },
      { id: "perplexity" },
      { id: "google", name: "AI Overviews" },
      { id: "copilot" },
    ],
  },
};
