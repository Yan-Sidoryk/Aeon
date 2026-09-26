# CoverageSection spec

Reference: 7shifts home, section index 3 ("Works with the tools you already love"), extracted 2026-09-26 with
Playwright at 1440 / 1024 / 768 / 390 (mobile UA). Screenshots: `docs/design-references/coverage/`
(`7s-coverage-1440.jpg`, `-1024.jpg`, `-768.jpg`, `-390.jpg`, `-chip-hover.jpg`, `-after-chip-click.jpg`) and
`docs/design-references/7s-06-integrations.jpeg`.

Aeon component: `src/components/CoverageSection.tsx` → `export function CoverageSection()` (client component).

## Overview

A transparent section that lets the page's fixed background photo show through. Centered on it is a dark
translucent "glass" card: heading, category chips and a CTA on the left, and on the right two columns of white
120px logo tiles that scroll vertically forever in opposite directions. Clicking a chip swaps the tile set. Below
810px the card stacks, and a single horizontal row of tiles replaces the two columns. The card fades in once when
80% of it is on screen.

**Breakpoints are 7shifts' real ones.** Read from 7shifts' CSSOM: `md` = `(min-width: 810px)`, `lg` = 1024px,
`xl` = `(min-width: 1200px)`, `2xl` = 1374px. The shared theme now defines the same values, so the component uses
`md:` / `xl:` as 7shifts does. At 768 the 7shifts section is still in its mobile layout.

## DOM structure (7shifts → Aeon)

```
section.relative.flex.flex-row.px-5.pt-[76px].pb-[76px].md:!px-20.xl:pt-[100px].xl:pb-[100px]   (transparent)
└─ div.card  mx-auto w-full flex max-xl:flex-col rounded-[20px] bg-black/50 backdrop-blur-lg !p-0 max-md:!py-6
   │         !gap-5 md:!gap-10 xl:!gap-0 md:!flex-row md:!pr-7 md:!max-w-full xl:!max-w-[720px]
   │         transition-opacity duration-500 (!opacity-0 until revealed)
   ├─ div.left  flex flex-col gap-10 max-xl:items-start px-6 md:py-12 md:pl-12 md:w-[64%] xl:w-[52%]
   │  ├─ h2  (white, 36px)
   │  ├─ p   (empty, 0px tall, still takes a 40px gap slot → 80px between h2 and chips)
   │  ├─ div.chips  flex flex-row flex-wrap gap-2
   │  │  └─ button × 6
   │  └─ a.cta  mr-auto mt-auto max-xl:mx-auto (royal pill)
   └─ div.right  flex items-center justify-center md:w-[36%] xl:w-[48%]
      └─ div.window  flex gap-4 overflow-y-hidden max-md:w-full max-md:my-2 md:h-80 xl:h-96
         ├─ div.keen-slider (column A)  w-full md:max-w-[120px] max-md:!hidden   ← moves DOWN
         └─ div.keen-slider (column B)  w-full md:max-w-[120px]                  ← moves UP (LEFT on mobile)
            └─ div.slide × 2n  120×120 bg-white p-2 flex items-center rounded-xl (img 104px wide)
```

Aeon replaces the empty `<p>` with `mb-10` on the h2 (same 80px). Column tracks are CSS marquees (below) instead of
keen-slider. The tile columns are `aria-hidden`; a visually hidden `<ul>` lists the engines of the active chip.

## Computed styles

### Section
| prop | < 810 | 810–1199 | ≥ 1200 |
| --- | --- | --- | --- |
| padding | 76px 20px | 76px 80px | 100px 80px |
| display | flex row | flex row | flex row |
| background | transparent (fixed page photo shows through) | | |
| height (7shifts) | 696 @390 | 576 @1024 | 708 @1440 |

### Card
| prop | value |
| --- | --- |
| background | `rgba(0,0,0,0.5)` (`bg-black/50`) |
| backdrop-filter | `blur(16px)` (`backdrop-blur-lg`) |
| border-radius | 20px |
| border / shadow | none / none |
| width | 100% of section content; max 720px at ≥ 1200 (margin auto → x=360 at 1440) |
| direction | column < 810, row ≥ 810 |
| padding | `24px 0` < 810; `0 28px 0 0` ≥ 810 |
| gap | 20px < 810; 40px 810–1199; 0 ≥ 1200 |
| transition | `opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)` |
| size (7shifts) | 720×508 @1440, 864×424 @1024, 728×440 @768, 350×544 @390 |

### Left column
| prop | < 810 | ≥ 810 | ≥ 1200 |
| --- | --- | --- | --- |
| width | 100% (stretch) | 64% (flex-shrinks to 510.8 @1024) | 52% (359.8 @1440) |
| padding | 0 24px | 48px 24px 48px 48px | same |
| gap | 40px | 40px | 40px |
| align-items | flex-start | flex-start | normal (stretch) |

### Heading (h2)
`font-display` (7shifts "medium" 7sans → Geist), weight 500, 36px, white, `text-align: left`, letter-spacing normal.
Line-height **28px below 810** (lines overlap slightly, as on 7shifts) and **36px at ≥ 810**.
7shifts h2 box @1440: 288×108 (3 lines). Geist is about 4% wider than 7sans ("Works with the" is 252.6px vs 242px),
and "Tracks the engines" measures 316.6px, so Aeon's heading takes **4 lines (288×144)** in the same column. The
card grows 36px; nothing else moves.

### Chips (`button`)
| prop | value |
| --- | --- |
| container | `flex flex-row flex-wrap gap-2` (8px both axes) |
| height / padding | 40px / 0 16px |
| font | `font-display` 16px / 24px, weight 500, black, centered |
| background | `#fbfaf8` (`bg-offwhite`, 7shifts extra-light-gray) |
| radius | 9999px |
| transition | `all 150ms cubic-bezier(0.4, 0, 0.2, 1)` |
| focus-visible | `ring-2 ring-royal ring-offset-2 ring-offset-white`, outline none |

### CTA (`a`)
Shared pill: h 48, px 16, radius full, `font-display` 16/24 500, white on royal `#4570ff`, hover/active
`#3658c9`. Margin `mt-auto`; `mx-auto` (centered) below 1200, `mr-auto` (left) at ≥ 1200. Use `PillButton`.
7shifts CTA @1440: x=408 y=+412 in the card, 148×48 ("See integrations").

### Right column and tile window
| prop | < 810 | 810–1199 | ≥ 1200 |
| --- | --- | --- | --- |
| right column width | 100% | 36% | 48% |
| window size | card width × 120 (margin 8px 0) | 256 × 320 | 256 × 384 |
| window position | full card width, straight clip at card edges | centered in the column | centered (x=758 @1440) |
| columns shown | column B only, horizontal | A + B, vertical, 16px apart | A + B |

Tile: 120×120, `bg-white`, padding 8px, radius 12px (`rounded-xl`), overflow hidden, no border or shadow,
content vertically centered (7shifts: logo `<img>` 104px wide). Tile pitch 136px (16px spacing) on both axes.

**810 to about 890px quirk (reproduced):** the right column has a specified width (36%), so its flex minimum is that
width, not the 256px window. The window (a scroll container) shrinks to the column, and each tile column shrinks
to (width − 16) / 2. At 810 that is 223.9px and 103.95px, so the 120px tiles are clipped 16px on the right.
Aeon measures identically (358.09 / 223.91 / 103.95).
**Clip:** hard `overflow: hidden` edges. No mask, gradient or shadow anywhere in the section (checked on every
descendant).

## States and behaviors

### 1. Tile marquee (time-driven, continuous)
- **Trigger:** always running from page load (7shifts: keen-slider driven by JS; no pause on hover; drag disabled;
  cursor auto).
- **Measured:** constant linear speed **88.3 px/s** for every category (POS 88.18, Payroll 88.27, Hiring 88.26;
  mobile 88.54). Column A (left) content moves **down**; column B (right) moves **up**. Mobile row moves **left**.
- Column A lists the items in reverse DOM order (slide 0 at the bottom), so the two columns never show the same
  sequence side by side.
- **Aeon implementation:** each track renders its tile loop twice (second copy `aria-hidden`) and uses
  `animate-marquee-y` (0 → −50%), with `[animation-direction:reverse]` for column A, and `animate-marquee-x` for the
  mobile row. Each tile carries its 16px spacing as margin (`mb-4` / `mr-4`), so −50% is exactly one loop.
  Duration = `loopLength × 136px / 88.3px/s` (10.78s for 7 tiles, 9.24s for 6), set inline as
  `animation-duration`. A per-element `--marquee-duration` has no effect while `--animate-marquee-*` lives in a
  non-inline `@theme` block, because the variable is resolved at `:root`. Measured in the Aeon build: 88.0–88.5 px/s,
  column A down, column B up, mobile row left. Each loop repeats the category's engines until
  it has at least 6 tiles (816px, longer than the widest mobile window of 769px and the 384px desktop window), so
  the seam is never visible.
- Reduced motion: the global `prefers-reduced-motion` rule stops the tracks on a keyframe edge that looks
  identical to the start.

### 2. Chip hover
- **Trigger:** `:hover` (inside `@media (hover: hover)`).
- **Before → after:** `filter: none` → `filter: brightness(0.85)` (the chip turns light grey: #fbfaf8 → ~#d5d4d3).
- **Transition:** `all 150ms cubic-bezier(0.4, 0, 0.2, 1)`.

### 3. Chip click (filters tiles)
- **Trigger:** click.
- **After:** both columns swap to the category's tiles **instantly**. There is no fade (card opacity stays 1) and
  both tracks restart from their initial offset (keen re-init). Default category: the first chip.
- **Chip look:** 7shifts has **no active or pressed style**. The clicked chip looks exactly like the others once the
  mouse leaves (no `aria-pressed` either). Aeon keeps the identical look and adds `aria-pressed` and
  `aria-controls` for assistive tech. Aeon remounts the tracks with `key={category}` to restart the animation.
- 7shifts categories → Aeon categories (tile count per loop on 7shifts: 13 / 9 / 5 / 8 / 4 / 5 unique):

| 7shifts chip | Aeon chip | Aeon engines |
| --- | --- | --- |
| POS | General LLMs | ChatGPT, Claude, Gemini, Copilot, Meta AI, Grok, Mistral |
| Analytics | Clinical LLMs | OpenEvidence |
| Hiring | AI search | Perplexity, Google AI Overviews, Google AI Mode |
| Back Office | Label data | DailyMed, openFDA |
| Payroll | MLR workflow | Veeva PromoMats |
| Training | SEO data | Semrush, Ahrefs, Google Search Console |

### 4. In-view reveal (one-shot)
- **Trigger:** IntersectionObserver on the card. Measured at a 1440×900 viewport: the fade fired between card
  visibility 0.787 (no) and 0.807 (yes), so the **threshold is 0.8**. Never re-hides after scrolling away.
- **Before → after:** `opacity: 0` → `opacity: 1`, `transition: opacity 500ms cubic-bezier(0.4, 0, 0.2, 1)`.
- Aeon also reveals the card when its visible part covers 80% of the viewport height, so a card taller than a
  short landscape viewport still appears. Full-page screenshots must scroll the page first (as 7shifts' own
  capture does); otherwise the card is captured at opacity 0.

### 5. CTA hover
`#4570ff` → `#3658c9`, 150ms (shared `PillButton` primary).

## Aeon content mapping
| slot | 7shifts | Aeon |
| --- | --- | --- |
| h2 | Works with the tools you already love | Tracks the engines your audience actually asks |
| chips | POS · Analytics · Hiring · Back Office · Payroll · Training | General LLMs · Clinical LLMs · AI search · Label data · MLR workflow · SEO data |
| tiles | partner logo images | typographic wordmarks (below) |
| CTA | See integrations → /integrations/home/ | See coverage → `#faqs` |

### Wordmark tiles (no image files, no third-party artwork)
The lockup is centered in the 104px content box: a 10px dot in an Aeon palette color, a 6px gap, then the name in
`font-display` weight 600, `tracking-tight`, line-height 1.05, ink. Single-line names use 17px. Names that need two
or three lines are left-aligned in the lockup at 16px:
- One line: ChatGPT, Claude, Gemini, Copilot, Meta AI, Grok, Mistral, Perplexity, DailyMed, openFDA, Semrush, Ahrefs
- Several lines: Open / Evidence · Google AI / Overviews · Google AI / Mode · Veeva / PromoMats · Google / Search / Console

Dot colors rotate through royal, flame, mint, violet, navy, forest and ink, so neighbouring tiles differ. They are
accents, not brand colors.

## Assets
None. The background photo is the page-level fixed `/images/photos/pharmacy-night.webp` from `page.tsx`. Tiles are
text only.

## Responsive summary
| | 390 (mobile) | 768 (still mobile on 7shifts) | 1024 (md) | 1440 (xl) |
| --- | --- | --- | --- | --- |
| section padding | 76 / 20 | 76 / 20 | 76 / 80 | 100 / 80 |
| card | 350 wide, stacked, py 24, gap 20 | 728 wide, stacked | 864 wide, row, gap 40, pr 28 | 720 wide, row, gap 0, pr 28 |
| h2 | 36/28, left (Aeon: 4 lines) | 36/28 (Aeon: 2 lines) | 36/36, 2 lines | 36/36, 3 lines (Aeon: 4) |
| chips | wrap (Aeon: 3 rows) | wrap (Aeon: 2 rows) | 2 rows | 3 rows |
| CTA | centered | centered | centered in left column | left |
| tiles | one row moving left, full card width | same | 2 columns 256×320 | 2 columns 256×384 |
| section height, 7shifts → Aeon (measured) | 696 → 772 | 592 → 668 | 576 → 576 | 708 → 744 |

The page has no horizontal overflow from this section at 320–1024 (`documentElement.scrollWidth` equals the
viewport at 390).
