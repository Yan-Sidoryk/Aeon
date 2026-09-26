# ResourcesSection spec (7shifts SECTION index 8 → Aeon "Free resources")

Source: https://www.7shifts.com/, `.traffic-warden-root` child #8. Extracted with Playwright (computed styles,
hydrated DOM, stylesheet text, hover sampling). Raw captures: `scratchpad/tools/out/resources/resources-{1440,768,390}.json|png`.
References: `docs/design-references/7s-11-cta-resources.jpeg` (images loaded, 1440),
`docs/design-references/resources/7s-resources-1440-images-blocked.jpg` (exact geometry, images blocked by rate limit),
`docs/design-references/resources/7s-resources-link-hover-1440.jpg` (link hover), `docs/design-references/cta/7s-cta-resources-strip-1440.jpg`.

## Overview
White section tucked under the CTA panel and the footer: a header row (H2 left, "View more →" link right) and a
3-column grid of resource cards (cover image, colored tag pill, title, description, text link with arrow).
Cards are **not** whole-card links; only the bottom text link is clickable. No image zoom, no card hover.

## 7shifts breakpoints
`sm` 567 · `md` 810 · `lg` 1024 · `xl` 1200 (see FinalCtaSection.spec.md). Grid switches to 3 columns at 810.

## DOM structure
```
div.bg-white.px-[20px].pb-[100px].-mb-[100px].pt-[80px].-mt-[20px]          ← position static, no z-index
  div.flex.justify-between.max-w-[1200px].mx-auto                              ← header row
    div.flex.flex-col.justify-center   h2.text-[40px].leading-10 "Free resources"
    div.max-sm:w-1/2.flex.flex-col.justify-center
      a.group.relative.flex.w-fit.align-middle.cursor-pointer  href=/resources/
        p.text-[16px].font-medium "View more"
        svg(16×16 phosphor arrow-right).my-auto.ml-3.transition-all.duration-700.group-hover:animate-bounce-horizontal
        div.absolute.inset-x-0.bottom-0.h-px.bg-black.origin-left.scale-x-0.transition-transform.duration-300.group-hover:scale-x-100
  div.grid.grid-cols-1.md:grid-cols-3.mt-[20px].gap-x-[20px].max-w-[1200px].mx-auto
    div.col-span-1.mb-[50px]  × 3
      img.rounded-[10px].mb-4.md:max-h-[180px].object-cover.lg:max-h-[200px]  (width=1200 height=300 attrs, lazy)
      div.font-medium.w-fit.px-[20px].py-[9px].rounded-[20px]  style="background-color:#ebdcff|#c6ff94|#d6e0ff"  "Data study"
      h3.py-[20px].text-[18px].leading-[100%]  "What Restaurant Employees Want"
      p.text-[18px].leading-[1.5em]  description
      a.group.relative.flex.w-fit…  p "Read the study" + svg arrow + underline div   (same anatomy as "View more")
```

## Computed styles @1440 (exact)
| Element | Values |
| --- | --- |
| wrapper | `background:#fff; padding:80px 20px 100px; margin:-20px 0 -100px; position:static` → y=10007 |
| header row | `max-width:1200px; margin:0 auto; display:flex; justify-content:space-between` (x=120…1320, h=40) |
| h2 | `font:"medium" (→ Geist) 500 40px/40px; color:#000` (271px wide in 7sans; Geist "Free resources" = 277px) |
| "View more" link | `display:flex; position:relative; width:fit-content`; p `font:"medium" 500 16px/24px`; svg 16×16 `margin:auto 0 auto 12px`; underline div `position:absolute; left/right/bottom:0; height:1px; background:#000; transform-origin:left; scale:0 1` |
| grid | `margin-top:20px; column-gap:20px; grid-template-columns: 3 × 386.66px` (single column below 810) |
| card | `margin-bottom:50px` |
| image | `width:100% (386.66); height:auto → capped max-height 200px (lg) / 180px (md); object-fit:cover; border-radius:10px; margin-bottom:16px`. Loaded state renders 386.66×200 (7s-11 reference); unloaded placeholder uses the 1200×300 attr ratio (96.66px) |
| tag pill | `font:"medium" 500 16px/24px; padding:9px 20px; border-radius:20px; width:fit-content` → h 42px. Colors: `#EBDCFF` (lavender), `#C6FF94` (lime), `#D6E0FF` (periwinkle) |
| h3 | `font:"medium" 500 18px/18px; padding:20px 0` → h 58px |
| description | `font:interTight 400 18px/27px (1.5em); color:#000` (3 lines at 386px) |
| card link | same as "View more": p `500 16px/24px "medium"`, arrow 16px + 12px gap, 1px underline |

Vertical rhythm per card @1440 (loaded): image 200 + 16 → pill 42 → h3 58 → p 81 → link 24 → 50 margin.

## States & behaviors
- **Link hover** (header link and each card link; trigger `:hover` on `a.group`):
  - underline: `scale-x 0 → 1`, `transform-origin:left`, `transition: transform/scale 300ms cubic-bezier(0.4,0,0.2,1)`;
    spans the whole link width (text + gap + arrow), 1px black at the link's bottom edge (y = +23px).
  - arrow: `animation: bounce-horizontal 0.6s infinite` (ease) with keyframes `0%,100% { translate(0) } 50% { translate(2px) }`;
    base `transition: all 700ms cubic-bezier(0.4,0,0.2,1)`.
  - text color unchanged (#000).
- Image / card / title hover: no change (image transform/filter/opacity identical before/after, no underline on h3).

## Stacking / overlap
- Top: `-mt-[20px]` + CTA wrapper's `-mb-[40px]` → the CTA panel (z-50) covers the section's first 40px; `pt-[80px]`
  leaves 40px of visible white above the H2 (H2 top = CTA bottom + 40).
- Bottom: `pb-[100px] -mb-[100px]` → the footer (`relative z-50 rounded-t-[40px]`, #FBFAF8) slides 100px up over the
  section's padding; white shows behind the footer's rounded corners.

## Responsive (confirmed with the 768 / 390 captures)
| Width | Layout |
| --- | --- |
| ≥1024 | 3 columns (386.66px at ≥1200), image max-h 200 |
| 810–1023 | 3 columns (≈229px at 810), image max-h 180 |
| <810 | 1 column (728px @768, 350px @390), full-width images with no max-height (7shifts @390: first cover is square 1137×1137 → 350×350, the others ≈1.76:1 → 350×198), cards stacked with 50px bottom margin. Header row stays one row: H2 40px/40px on one line @768 |
| <567 | header-link column `width:50%` (`max-sm:w-1/2`); flex shrink leaves it ≈137px @390, H2 wraps to "Free / resources" (80px), link vertically centred |

Section height: 608px @1440 with images unloaded (97px); with loaded images (200px) = 711px, which is exactly the
Aeon build (measured 711px, every x/y/width/type metric identical after the image offset).

## Aeon content mapping
- H2 `Free resources` · header link `View all research` (href `#resources`).
- Cards (tag pill color via the same three tokens):
  1. `Playbook` (lavender) · `/images/covers/playbook.webp` · `The GEO Playbook 2026` · "Field-tested tactics for getting
     pharma brands cited accurately in AI answers, from source priorities to GEO in MLR." · `Download free` →
     `/research/geo-playbook-2026`
  2. `Index` (lime) · `/images/covers/index.webp` · `The Aeon Index` · "The first public ranking of pharma brand
     reputation in AI answers. Free to read, no login required." · `See the ranking` → `/aeon-index`
  3. `Guide` (periwinkle) · `/images/covers/guide.webp` · `GEO for pharma: the guide` · "What generative engine
     optimization means for Rx, OTC and biotech brands, and how it fits your MLR process." · `Read the guide` →
     `/research/geo-for-pharma`
- Card links get a visually hidden suffix with the card title so each accessible name is unique
  ("Download free: The GEO Playbook 2026").
- Link labels are `white-space: nowrap`: "View all research" (155px with arrow) is longer than 7shifts' "View more"
  (105px) and would otherwise wrap in the ≈137px `max-sm:w-1/2` column at 390. The header row therefore uses
  `flex-wrap justify-between gap-y-2` with the H2 column `grow basis-0` (instead of 7shifts' `max-sm:w-1/2` link
  column): at 390+ the H2 column shrinks ("Free / resources" beside a one-line link, as in 7shifts); below ~360px the
  link drops under the heading instead of overflowing (verified: document scrollWidth = viewport at 320–1440 for this
  section).
- Breakpoints use 7shifts' class names (`md:`, `lg:`, `max-sm:`); the Aeon theme sets sm/md/lg to 567/810/1024px.
- Arrow bounce keyframes live in `src/components/resources/resources.module.css` (also run on `:focus-visible`,
  and the underline also grows on `group-focus-visible`, for keyboard users).

## Assets
Covers are 1200×671 webp (ratio 1.788). With the same CSS (`width:100%; height:auto; max-h 200/180; object-cover`)
they render 386.66×200 at 1440 (cropped 8px top/bottom, like 7shifts' loaded state), 229×128 at 810–1023, full
width × auto below 810. next/image with `width={1200} height={671}` and `sizes` per breakpoint; lazy (below the fold).
