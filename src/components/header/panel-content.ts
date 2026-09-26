import {
  Columns2,
  FileCheck2,
  FileSearch,
  FileText,
  Library,
  Lightbulb,
  ListChecks,
  LockKeyhole,
  Network,
  PenLine,
  ScanSearch,
  Send,
  ShieldAlert,
  Stamp,
  Table2,
  type LucideIcon,
} from "lucide-react";
import { START_HREF } from "@/components/ui/pill-button";

// Mega-menu panel content (server-rendered). Mirrors the 7shifts Platform / Built for / Resources panels
// with Aeon copy from docs/research/AEON_CONTENT.md.

// ---------------------------------------------------------------- Platform

export type PlatformLink = { label: string; href: string; icon: LucideIcon };
export type PlatformColumn = {
  /** Handwritten verb on the coloured card (7shifts "Hire", "Train", ...). */
  title: string;
  description: string;
  href: string;
  /** Full Tailwind class so the scanner sees it; same colour order as 7shifts. */
  colorClass: string;
  links: PlatformLink[];
};

export const PLATFORM_TITLE = "Run the whole loop in one place";

export const PLATFORM_COLUMNS: PlatformColumn[] = [
  {
    title: "Track",
    description: "Share of voice across ChatGPT, Claude, Gemini and Perplexity",
    href: "#platform",
    colorClass: "bg-sand",
    links: [
      { label: "Visibility tracking", href: "#platform", icon: ScanSearch },
      { label: "Prompt libraries", href: "#platform", icon: ListChecks },
      { label: "Citation map", href: "#platform", icon: Network },
    ],
  },
  {
    title: "Verify",
    description: "Catch answers that contradict your prescribing information",
    href: "#platform",
    colorClass: "bg-lavender",
    links: [
      { label: "Accuracy vs. label", href: "#platform", icon: FileCheck2 },
      { label: "Side-by-side view", href: "#platform", icon: Columns2 },
      { label: "Safety signals", href: "#platform", icon: ShieldAlert },
    ],
  },
  {
    title: "Fix",
    description: "Label-grounded drafts that win lost prompts",
    href: "#platform",
    colorClass: "bg-mint",
    links: [
      { label: "Content fixes", href: "#platform", icon: PenLine },
      { label: "Recommendations", href: "#platform", icon: Lightbulb },
      { label: "Claims library", href: "#platform", icon: Library },
    ],
  },
  {
    title: "Review",
    description: "Approval-ready before a human opens the draft",
    href: "#platform",
    colorClass: "bg-lime",
    links: [
      { label: "AI pre-MLR review", href: "#platform", icon: Stamp },
      { label: "Claim-to-source", href: "#platform", icon: Table2 },
      { label: "Veeva export", href: "#platform", icon: Send },
    ],
  },
  {
    title: "Audit",
    description: "Pharma checks for ISI, PDFs, HCP gates and schema",
    href: "#platform",
    colorClass: "bg-periwinkle",
    links: [
      { label: "Technical SEO", href: "#platform", icon: FileSearch },
      { label: "ISI & PDF checks", href: "#platform", icon: FileText },
      { label: "HCP gate checks", href: "#platform", icon: LockKeyhole },
    ],
  },
];

// ---------------------------------------------------------------- Built for

export type BuiltForItem = { title: string; description: string; href: string; icon: string };

export const BUILT_FOR_TITLE = "Built for every team that touches the brand";

export const BUILT_FOR_ITEMS: BuiltForItem[] = [
  {
    title: "Brand & digital marketing",
    description: "See where competitors are recommended and you are not, then ship the fix.",
    href: "#personas",
    icon: "/images/doodles/doodle-track.png",
  },
  {
    title: "Medical affairs",
    description: "AI sentence next to the label sentence, routed to medical information.",
    href: "#personas",
    icon: "/images/doodles/doodle-verify.png",
  },
  {
    title: "Regulatory & MLR reviewers",
    description: "Drafts arrive claim-referenced with a pre-MLR risk score.",
    href: "#personas",
    icon: "/images/doodles/doodle-review.png",
  },
  {
    title: "Agencies",
    description: "One website-in flow per client, one multi-brand overview.",
    href: "#personas",
    icon: "/images/doodles/doodle-measure.png",
  },
  {
    title: "Rx, OTC & biotech brands",
    description: "Indication-level analysis, label accuracy and MLR-ready output.",
    href: "#personas",
    icon: "/images/doodles/ta-immunology.png",
  },
];

// ---------------------------------------------------------------- Research

export type ResearchItem = { title: string; description: string; href: string; icon: string };
export type ResearchCard = ResearchItem & { colorClass: string };

export const RESEARCH_TITLE = "Research on AI answers in pharma";

export const RESEARCH_ITEMS: ResearchItem[] = [
  {
    title: "Research hub",
    description: "Everything we publish on AI answers in pharma",
    href: "#resources",
    icon: "/images/doodles/doodle-track.png",
  },
  {
    title: "AEO for pharma",
    description: "Win citations on the prompts patients and HCPs ask",
    href: "#resources",
    icon: "/images/doodles/doodle-phone.png",
  },
  {
    title: "Methodology",
    description: "How we sample AI answers and score confidence",
    href: "#resources",
    icon: "/images/doodles/doodle-fix.png",
  },
  {
    title: "The Aeon Index",
    description: "The first public ranking of pharma brands in AI answers",
    href: "/aeon-index",
    icon: "/images/doodles/doodle-measure.png",
  },
];

/** The two coloured cards (7shifts "Templates and Tools" sky-blue and "Food Runner" lime). */
export const RESEARCH_CARDS: ResearchCard[] = [
  {
    title: "GEO for pharma: the guide",
    description: "What GEO means for Rx, OTC and biotech brands, and how it fits your MLR process",
    href: "#resources",
    icon: "/images/doodles/doodle-faq.png",
    colorClass: "bg-periwinkle",
  },
  {
    title: "Free AI visibility report",
    description: "Your first report in about 5 minutes. No credit card required.",
    href: START_HREF,
    icon: "/images/doodles/doodle-verify.png",
    colorClass: "bg-lime",
  },
];

export const RESEARCH_FEATURE = {
  tag: "Playbook",
  title: "The GEO Playbook 2026",
  description:
    "Field-tested tactics for getting pharma brands cited accurately in AI answers, from source priorities to GEO in MLR.",
  link: "Download free",
  href: "#resources",
  image: "/images/covers/playbook.webp",
} as const;
