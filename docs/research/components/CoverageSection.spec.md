# CoverageSection spec

Reference: 7shifts home, section index 3 ("Works with the tools you already love"), extracted 2026-09-26 with
Playwright at 1440 / 1024 / 768 / 390 (mobile UA). Screenshots: `docs/design-references/coverage/`
(`7s-coverage-1440.jpg`, `-1024.jpg`, `-768.jpg`, `-390.jpg`, `-chip-hover.jpg`, `-after-chip-click.jpg`) and
`docs/design-references/7s-06-integrations.jpeg`.

Aeon component: `src/components/CoverageSection.tsx` → `export function CoverageSection()` (client component).

## Overview

The layout and behavior come from 7shifts, restyled light after user feedback ("hate the night pharmacy
background picture, don't need a picture" and "use logos of the brands you mention or the llms engines"). The page
no longer has a fixed photo. The section is a full-bleed **sand band**. The why section's rounded bottom and the
social section's rounded top sit over it, so sand shows behind both sets of corners. On the band sits a **white card**:
heading, category chips and a CTA on the left, and on the right two columns of 120px **logo tiles** that scroll
vertically forever in opposite directions. Clicking a chip swaps the tile set. Below 810px the card stacks and a
single horizontal row of tiles replaces the two columns. The card fades in once, when 80% of it is on screen.

**Breakpoints are 7shifts' real ones.** Read from 7shifts' CSSOM: `md` = `(min-width: 810px)`, `lg` = 1024px,
`xl` = `(min-width: 1200px)`, `2xl` = 1374px. The shared theme defines the same values. At 768 the section is still
in its mobile layout.

### Changes from the 7shifts original (and the first Aeon build)
| | 7shifts / first build | Now |
| --- | --- | --- |
| backdrop | transparent section over a fixed full-screen photo | sand `#f1f0ec` band, no image |
| card | `bg-black/50` + `backdrop-blur-lg`, white text | `bg-white`, soft shadow, ink text |
| chips | `#fbfaf8`, hover `brightness(.85)`, no selected look | sand, hover oat, **selected chip oat** (`aria-pressed`) |
| tiles | white, partner logo image (first build: text wordmark + dot) | offwhite, 1px oat border, brand logo + name |
| tile window edges | hard clip | 32px / 40px fade mask (hard edges looked like sliced tiles on white) |
| 810–890px | right column squeezes tiles to 104px (clipped) | right column `min-w-64`, tiles stay whole |

## DOM structure

```
section#coverage[data-section=coverage]  relative z-10 -mt-10 flex flex-row bg-sand
│        px-5 pt-[116px] pb-[116px] md:px-20 xl:pt-[140px] xl:pb-[140px]
└─ div.card  mx-auto w-full flex flex-col gap-5 rounded-[20px] bg-white py-6 shadow-[…]
   │         md:flex-row md:gap-10 md:py-0 md:pr-7  xl:max-w-[720px] xl:gap-0
   │         transition-opacity duration-500 (opacity-0 until revealed)
   ├─ div.left  flex flex-col items-start gap-10 px-6 md:w-[64%] md:py-12 md:pl-12 xl:w-[52%] xl:items-stretch
   │  ├─ h2#coverage-heading  (mb-10 stands in for 7shifts' empty <p> → 80px between h2 and chips)
   │  ├─ div[role=group][aria-label="Filter engines by category"]  flex flex-row flex-wrap gap-2
   │  │  └─ button[aria-pressed][aria-controls=coverage-engines] × 6
   │  └─ PillButton "See coverage"  mx-auto mt-auto xl:ml-0
   └─ div.right  flex items-center justify-center md:w-[36%] md:min-w-64 xl:w-[48%]
      ├─ ul#coverage-engines.sr-only[aria-label=<chip>][aria-live=polite]  names of the active category
      └─ div.window[aria-hidden]  my-2 flex w-full gap-4 overflow-hidden md:my-0 md:h-80 md:w-auto xl:h-96 + fade mask
         ├─ div (column A)  hidden w-[120px] md:block      ← track moves DOWN
         └─ div (column B)  w-full md:w-[120px]            ← track moves UP (LEFT below 810)
            └─ track: tile loop × 2 (animate-marquee-y / -x)
               └─ div.tile × 2n  120×120
```

## Computed styles

### Section (sand band)
| prop | < 810 | 810–1199 | ≥ 1200 |
| --- | --- | --- | --- |
| background | `#f1f0ec` (`bg-sand`), full bleed | | |
| margin-top | −40px (tucks under the why sheet's 40px rounded bottom) | | |
| padding | 116px 20px | 116px 80px | 140px 80px |
| visible sand above / below the card | 76px / 76px (7shifts' spacing) | 76 / 76 | 100 / 100 |
| stacking | `relative z-10` (why is `z-50`, social `z-20`, so both neighbours paint over the band) | | |

The extra 40px at the bottom is for the social section, which is planned as a white sheet with
`-mt-[40px] rounded-t-[40px] z-20`. Checked by injecting those styles: sand shows behind both of its top corners.
The why section (`-mt-[60px] rounded-[40px] z-50 bg-white`) shows sand behind its bottom corners.

### Card
| prop | value |
| --- | --- |
| background | `#fff` |
| shadow | `0 1px 2px rgba(0,0,0,.04), 0 12px 32px -16px rgba(0,0,0,.12)`; no border |
| border-radius | 20px |
| width | 100% of the section content; max 720px at ≥ 1200 (x=360 at 1440) |
| direction | column < 810, row ≥ 810 |
| padding | `24px 0` < 810; `0 28px 0 0` ≥ 810 |
| gap | 20px < 810; 40px 810–1199; 0 ≥ 1200 |
| transition | `opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)` |
| size (measured) | 720×508 @1440, 864×424 @1024, 650×556 @810, 700×508 @860, 728×488 @768, 350×592 @390, 280×716 @320 |

### Left column
| prop | < 810 | ≥ 810 | ≥ 1200 |
| --- | --- | --- | --- |
| width | 100% | 64% (flex-shrinks; 326px @810 because of the right column's 256px minimum) | 52% (359.8 @1440) |
| padding | 0 24px | 48px 24px 48px 48px | same |
| gap | 40px | 40px | 40px |
| align-items | flex-start | flex-start | stretch |

### Heading (h2)
"Tracks every engine your audience asks". `font-display` (Geist) 500, 36px, ink, left-aligned. Line-height **28px
below 810** (lines overlap slightly, as on 7shifts) and **36px from 810**. Lines: 4 @320, 3 @390, 1 @768, 3 @810,
2 @900 and 1024, 3 @1440 (288×108, the same box as 7shifts' heading).

### Chips (`button`)
| prop | value |
| --- | --- |
| container | `flex flex-row flex-wrap gap-2` (8px both axes) |
| height / padding | 40px / 0 16px (7shifts) |
| font | `font-display` 16px / 24px, weight 500, ink, centered (7shifts) |
| background | sand `#f1f0ec`; hover oat `#e2ded6` (inside `@media (hover: hover)`); selected (`aria-pressed=true`) oat |
| radius | 9999px |
| transition | `all 150ms cubic-bezier(0.4, 0, 0.2, 1)` |
| focus-visible | `ring-2 ring-royal ring-offset-2 ring-offset-white`, outline none |
| rows | 3 @390, 3 @1440, 2 @1024, 4 @810–850 (narrower left column) |

The selected look is an Aeon addition. On 7shifts the clicked chip looks like the others, which does not work for
a light filter group.

### CTA
Shared `PillButton` primary: h 48, px 16, radius full, `font-display` 16/24 500, white on royal `#4570ff`,
hover/active `#3658c9`, 150ms. `mt-auto`; centered below 1200, left-aligned from 1200. → `#faqs`.

### Right column and tile window
| prop | < 810 | 810–1199 | ≥ 1200 |
| --- | --- | --- | --- |
| right column width | 100% | 36%, min 256px | 48% |
| window size | card width × 120 (margin 8px 0) | 256 × 320 | 256 × 384 |
| columns shown | column B only, horizontal | A + B, vertical, 16px apart | A + B |
| fade mask | `linear-gradient(to right, transparent, #000 32px, #000 calc(100% − 32px), transparent)` | `to bottom`, 40px | same |

### Tile
| prop | value |
| --- | --- |
| box | 120×120 (border-box), `rounded-xl` (12px), `overflow-hidden`, pitch 136px (16px margin) on both axes |
| surface | `bg-offwhite` `#fbfaf8`, `border border-oat` (1px `#e2ded6`), no shadow |
| layout | `flex-col items-center gap-2 px-1.5 pt-7`. The logo sits at a fixed height (28px inside the border), so logos line up across the mobile row. A one-line name is centered (28px above and below the group). A two-line name grows downward (14px left at the bottom). |
| logo | `<BrandLogo id variant="color" size={40} alt="" />` (40×40) |
| name | `font-sans` (Inter Tight) 12px / 14px, weight 500, stone `#6e6d6c`, centered, `text-balance`; max text width 106px |
| wrapping | all names fit on one line (widest: Veeva PromoMats 96px, Google AI Mode 84px, Search Console 83px) except **Google AI Overviews** (114px), which breaks as "Google AI / Overviews" |

## States and behaviors

### 1. Tile marquee (time-driven, continuous)
- Always running, no pause on hover, no drag (as on 7shifts).
- **Speed 88.3 px/s** (7shifts' measured speed) for every category, both columns and the mobile row. Column A
  moves **down**, column B **up**, the mobile row **left**. Column A lists the loop in reverse order, so the two
  columns never show the same sequence side by side.
- Implementation: each track renders its loop twice. The track uses `animate-marquee-y` (0 → −50%), with
  `[animation-direction:reverse]` for column A, and `animate-marquee-x` for the mobile row. Each tile carries its 16px
  spacing as margin (`mb-4` / `mr-4`), so −50% is exactly one loop. Duration is
  `loopLength × 136px / 88.3px/s`, set per track as `--marquee-duration`. The theme's `--animate-marquee-*` tokens
  are `@theme inline`, so the variable is read at the element: 12.32s for General LLMs (8 tiles) and 9.24s for the
  rest (6 tiles).
- **Seam:** short categories repeat until the loop has at least 6 tiles (816px). That is longer than the widest
  mobile window (769px at 809) and the 384px desktop window, so the loop point never shows.
- Measured in Aeon (Playwright, 1s sample): column A +89.2 px/s, column B −89.2 px/s @1440; row −88.2 px/s @390.
- Reduced motion: the global `prefers-reduced-motion` rule ends the animation after 0.01ms. The tracks rest at
  translate 0, which looks the same as the start (measured 0 px/s).

### 2. Chip hover
`bg-sand` → `bg-oat`, 150ms. Only on devices with hover.

### 3. Chip click (filters tiles)
Both tracks swap to the category's tiles **instantly**, with no fade, and restart from their initial offset
(`key={category}` remounts them, as keen-slider re-inits on 7shifts). The chip gets `aria-pressed=true` and turns oat.
The visually hidden list (`aria-live=polite`) announces the new names. Default category: General LLMs.

### 4. In-view reveal (one-shot)
IntersectionObserver on the card with a 0.8 threshold, matching 7shifts (measured to fire between 0.787 and 0.807
visibility). `opacity 0 → 1`, 500ms. Also reveals once the card's visible part covers 80% of the viewport height,
for cards taller than a short landscape viewport. Never re-hides. Full-page screenshots must scroll the page first.

### 5. CTA hover
`#4570ff` → `#3658c9`, 150ms (shared `PillButton` primary).

## Content

| chip | tiles (logo · name) |
| --- | --- |
| General LLMs | ChatGPT · Claude · Gemini · Copilot · Meta AI · Grok · Mistral · DeepSeek |
| Clinical LLMs | OpenEvidence (monogram "OE") |
| AI search | Perplexity · Google "G" + **Google AI Overviews** · Google "G" + **Google AI Mode** |
| Label data | DailyMed (monogram "DM") · openFDA (monogram "FDA") |
| MLR workflow | Veeva PromoMats (monogram "V") |
| SEO data | Semrush · Ahrefs (monogram "a") · Search Console |

Names come from `BRANDS[id].name`, with a per-tile `label` override where one logo stands for a different product
name (the two Google tiles; Search Console). The same names fill the screen-reader list.

## Assets
- Logos: the shared `BrandLogo` component (`src/components/brand-logos.tsx`) → `/public/logos/<id>.svg` (LobeHub
  Icons, MIT; Simple Icons, CC0; see `third_party/LOGOS.md`). Brands with no open logo (OpenEvidence, DailyMed,
  openFDA, Veeva, Ahrefs) render as the component's colored monogram square. Nothing needs to be done here if a real
  logo is added to `BRANDS` later.
- No photos. The fixed `/images/photos/pharmacy-night.webp` page background has been removed from `page.tsx`.

## Responsive summary (measured)
| | 320 | 390 | 768 | 810 | 1024 | 1440 |
| --- | --- | --- | --- | --- | --- | --- |
| section padding (y / x) | 116 / 20 | 116 / 20 | 116 / 20 | 116 / 80 | 116 / 80 | 140 / 80 |
| card | 280×716 | 350×592 | 728×488 | 650×556 | 864×424 | 720×508 |
| layout | stacked | stacked | stacked | row | row | row, max 720 |
| h2 lines | 4 | 3 | 1 | 3 | 2 | 3 |
| tiles | row, moving left | row | row | 2 columns 256×320 | 2 columns 256×320 | 2 columns 256×384 |
| section height | 948 | 824 | 720 | 788 | 656 | 788 |
| `scrollWidth` = viewport | yes | yes | yes | yes | yes | yes |
