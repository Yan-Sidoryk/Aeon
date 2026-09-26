# SocialProofSection spec (7shifts "Proud to be in the pockets of…" → Aeon "HCPs and patients are asking AI first")

## Overview
- **Target files:** `src/components/SocialProofSection.tsx` (export `SocialProofSection`, server component, owns the
  typed copy), `src/components/social/PolaroidStack.tsx` (client: in-view drop-in), `src/components/social/PersonaCards.tsx`
  (client: hover/focus accordion), `src/components/social/TaMarquee.tsx` (lime band), `src/components/social/social.module.css`
  (drop-in keyframes + spring easing).
- **7shifts source:** `.traffic-warden-root` child #4, `section.bg-black.text-white.rounded-[20px].pb-[40px].relative.z-20`
  (styled-jsx scope `jsx-960aa606ea9a2420`). Height 1376 at 1440 / 1200 / 1280, 1403 at 1024, 1478 at 810, 2520 at 768,
  2672 at 390.
- **Aeon root:** `<section data-section="social" id="personas">` (the footer links to `#personas`).
- **Interaction model:** (1) in-view drop-in of the polaroid stack + sticker (once); (2) desktop card row is a hover
  accordion (flex-grow) that reveals a hidden block; (3) time-driven lime marquee. Stats are static (no count-up, verified
  frame by frame while scrolling in). Cards have no link/click on 7shifts (`cursor: default`, no `a`/`button`/`tabindex`).
- **Breakpoints:** 7shifts' `--breakpoint-md: 810px` (this section only uses `md:`). Below 810 (so also at 768) the
  mobile layout is used. The Aeon theme now uses the same scale, so classes are copied as-is (`md:` = 810px).
- **References** (`docs/design-references/social/`):
  - `7s-social-1440-top.jpg`, `7s-social-1440-cards.jpg`: 1440 viewport captures with media loaded.
  - `7s-social-1440-hover-card1.jpg`, `7s-social-1440-hover-card4.jpg`: hover states of card 1 and card 4.
  - `7s-social-1200.jpg`, `7s-social-810.jpg`, `7s-social-768.jpg`, `7s-social-390.jpg`: full section at each width.
  - `7s-social-polaroid-assets.jpg`: the three pre-rotated polaroid PNGs + the bento sticker on gray (frame, tilt, shadow).
  - Older full-page crops: `docs/design-references/7s-07-social-proof-a.jpeg`, `7s-08-testimonials.jpeg`.

## DOM structure (7shifts, exact classes)
```
section.bg-black.text-white.rounded-[20px].pb-[40px].relative.z-20
  div.mx-auto.w-full.max-w-[1200px].px-[40px].pt-10.pb-20.flex.flex-col.items-center.gap-10          (container)
    div.flex.flex-col.md:flex-row.md:items-center.md:gap-10.w-full                                     (top row)
      div.flex.justify-center.md:justify-start.md:shrink-0
        div.relative.w-96.h-96                                                                         (polaroid stack, 384×384)
          div.absolute.w-80 style="left:27.83px;top:27.36px"  > img.w-80.h-auto  polaroid-3.png (back)
          div.absolute.w-80 style="left:61.83px;top:0px"      > img.w-80.h-auto  polaroid-2.png (middle)
          div.absolute.w-80 style="left:27.83px;top:17.67px"  > img.w-80.h-auto  polaroid-1.png (front)
          div.absolute style="left:273.1px;top:202.82px;transform-origin:left top" > img.w-36.h-auto bento-box-icon.png
      div.mt-[5px].md:mt-0
        div.flex.flex-col.items-center.gap-2.5.md:hidden                                               (mobile heading)
          h2.text-center.text-white.text-[36px].leading-[1.1].text-pretty          "Proud to be in the pockets of"
          h2.text-center.text-[#FF6808].text-[72px].font-nanumPenScript.leading-[1.1].tracking-[-0.04em].-my-5  "1.5 million"
          h2.text-center.text-white.text-[36px].leading-[1.1].text-pretty          "restaurant pros"
        h2.hidden.md:block.text-left.text-white.text-[52px].leading-[1.1].text-pretty                  (desktop heading)
          "Proud to be in the pockets of " span.text-[#FF6808].font-nanumPenScript.text-[72px].tracking-[-0.04em].relative.top-[0.1em] "1.5 million" " restaurant pros"
    div.w-full.grid.grid-cols-2.md:grid-cols-4.gap-x-10.gap-y-8.md:pb-10                               (stats)
      4 × div.flex.flex-col.gap-2
            p.text-[#FF6808].text-[36px].font-medium.leading-[1.1].md:text-center                   "55K+"
            p.text-white.text-[18px].leading-[1.5].[font-family:'Universal_Sans_Display',…].md:text-center.md:font-normal
    div.w-full.flex.flex-col.items-start.gap-5.pt-2.5.pb-5
      h3.self-stretch.text-center.text-white.text-[28px].leading-8.[font-family:…].md:text-[44px].md:leading-[110%].md:pb-4
      div.md:hidden.self-stretch.flex.flex-col.gap-2.5.py-2.5                                          (mobile cards: only 3!)
        3 × div.relative.min-h-[463px].rounded-[10px].overflow-hidden
              img.object-cover (absolute, 100%×100%, object-position 75% center | center)
              div.absolute.inset-0.bg-gradient-to-b.from-black/0.to-black/80
              div.absolute.inset-0.px-7.py-10.flex.flex-col.justify-end.gap-4
                p.text-white.text-[18px].font-medium.leading-[1]                                  title
                p.text-white.text-[18px].leading-[1.5]                                            quote
                p.text-white.text-[18px].leading-[1.5] > span(700) name <br> span(400) role
      div.hidden.md:flex.flex-row.gap-[10px].self-stretch.h-[463px]                                   (desktop row: 4 cards)
        4 × div.relative.rounded-[10px].overflow-hidden.cursor-default.min-w-0  style="flex:1 1 0px;transition:flex-grow .5s ease-in-out"
              img.object-cover
              div.absolute.inset-0.bg-gradient-to-b.from-black/0.to-black/80
              div.absolute.inset-0.px-7.py-10.flex.flex-col.justify-end.gap-3.overflow-hidden
                p.text-white.text-[18px].font-medium.leading-[1].whitespace-nowrap.overflow-hidden.text-ellipsis   title
                div.flex.flex-col.gap-3.overflow-hidden style="max-height:0;opacity:0;transition:max-height .4s ease-in-out,opacity .3s ease-in-out"
                  p.text-white.text-[16px].leading-[1.5]                                          quote
                  p.text-white.text-[16px].leading-[1.5] > span(700) name <br> span role
  div.relative.z-20.w-full.overflow-hidden.bg-[#C6FF94].py-[10px].mt-[0px]                            (lime band, full bleed)
    div.flex.w-max.animate-built-for-marquee.gap-[56px].pr-[56px]                                        (7 items × 2)
      div.flex.items-center.gap-[10px].shrink-0
        img.w-10.h-10.shrink-0 (256×256 SVG doodle)
        span.text-black.text-[28px].font-nanumPenScript.font-normal.leading-[1].whitespace-nowrap.[text-box-trim:trim-both].[text-box-edge:cap_alphabetic]
```

## Computed styles (exact; 1440 unless noted)
Fonts: 7shifts "medium" (7sans) → Aeon `font-display` (Geist). "Universal Sans Display" is **not loaded** on 7shifts (renders
the `-apple-system/system-ui` fallback); Aeon maps it to `font-display` like `SiteHeader.spec.md` does. "interTight" →
`font-sans`. "nanumPenScript" → `font-hand`. Note 7shifts' `font-medium` utility sets font-family "medium" (and wins over
the arbitrary family), so every `font-medium` element below is 7sans/Geist 500.

| Element | Values |
| --- | --- |
| section | bg #000; color #fff; radius 20px (all corners); padding 0 0 40px; position relative; z-index 20; no margins. Top corners show the fixed page photo (the section above is transparent); bottom corners sit over the white GetStarted section, which is pulled up under it by its own −60px margin |
| container | max-width 1200px; margin 0 auto; padding 40px 40px 80px; flex column; align-items center; gap 40px |
| top row | ≥810: flex row, align-items center, gap 40px (polaroid col 384 + heading 696 at 1440). <810: flex column, no gap |
| polaroid col | ≥810: justify-start, shrink 0. <810: justify-center (stack centered; at 390 the 384px stack shrinks to 310px, the polaroids keep their px offsets and overflow to the right, clipped at the viewport edge) |
| stack | 384×384, position relative |
| heading wrapper | margin-top 5px (<810) / 0 |
| h2 desktop | Geist 500 52px / 57.2px (1.1); left; white; `text-wrap: pretty`; 696px wide at 1440 (520 at 1024, 306 at 810); 2 lines at 1440 (136.4px tall: line 2 is 79.2px because of the 72px span) |
| hand span (desktop) | Nanum Pen Script 72px, line-height 79.2px (inherits 1.1), letter-spacing −0.04em (−2.88px); color #FF6808; position relative; top 0.1em (7.2px) |
| h2 mobile | flex column centered, gap 10px. Lines 1 and 3: Geist 500 36px / 39.6px, center, pretty. Line 2: Nanum 72px / 79.2px, −0.04em, #FF6808, margin −20px 0 |
| stats grid | 4 cols (250px at 1440) ≥810 / 2 cols <810; column gap 40px; row gap 32px; padding-bottom 40px ≥810 |
| stat item | flex column; gap 8px |
| stat number | Geist 500 36px / 39.6px; #FF6808; center ≥810, left <810 |
| stat label | 18px / 27px, 400; white; center ≥810, left <810 |
| personas block | flex column; align-items start; gap 20px; padding 10px 0 20px |
| h3 | 500; white; center; 28px / 32px (<810); 44px / 48.4px + padding-bottom 16px (≥810) |
| desktop card row | flex row; gap 10px; height 463px; cards 272.5px each at 1440 (1090 / 4) |
| card | radius 10px; overflow hidden; position relative; `flex: 1 1 0px`; `transition: flex-grow 0.5s ease-in-out`; cursor default |
| card image | absolute; 100%×100%; object-fit cover; object-position 75% center (cards 1, 3) or center (2, 4) |
| card gradient | absolute inset 0; `linear-gradient(to bottom, rgb(0 0 0 / 0), rgb(0 0 0 / .8))` |
| card content | absolute inset 0; padding 40px 28px; flex column; justify-content flex-end; gap 12px (desktop) / 16px (mobile); overflow hidden (desktop) |
| card title | Geist 500 18px / 18px; white; desktop: nowrap + overflow hidden + ellipsis (216.5px wide at rest, so long titles truncate: "Managing employees acr…") |
| reveal block (desktop) | flex column; gap 12px; overflow hidden; max-height 0; opacity 0; `transition: max-height .4s ease-in-out, opacity .3s ease-in-out` |
| quote | Inter Tight 400 16px / 24px (desktop), 18px / 27px (mobile); white |
| attribution | same size as quote; name 700 then `<br>`, role 400 |
| mobile card | min-height 463px; radius 10px; stacked with 10px gap, padding 10px 0 around the list; full content width (310 at 390, 688 at 768) |
| lime band | full section width; bg #C6FF94; padding 10px 0; height 60px; overflow hidden; position relative; z-index 20; directly after the container, followed by the section's 40px bottom padding (black) |
| marquee track | flex; width max-content (2680.7px); gap 56px; padding-right 56px; `animation: built-for-marquee 30s linear infinite` with `0% {transform: translate(0)} 100% {transform: translate(-50%)}` |
| marquee item | flex; align-items center; gap 10px; shrink 0. Icon 40×40. Label Nanum Pen Script 400 28px / 28px, black, nowrap, text-box trimmed to cap/alphabetic (18.9px tall) |

### Polaroid stack geometry (measured from the PNGs; rendered scale 320/384 = 0.8333)
Each PNG is a pre-rotated white polaroid on a transparent canvas. Fitted edges (natural px → rendered px):

| | front (polaroid-1) | middle (polaroid-2) | back (polaroid-3) |
| --- | --- | --- | --- |
| DOM order / z | last (top) | 2nd | first (bottom) |
| box in stack | left 27.83, top 17.67 (320×314.2) | left 61.83, top 0 (320×322.5) | left 27.83, top 27.36 (320×297.5) |
| rotation | −7.04° | +4.51° | −7.04° |
| frame (unrotated) | 344.0×335.9 → 286.7×279.9 | 307.1×276.0 → 255.9×230.0 | 303.3×272.5 → 252.8×227.0 |
| frame center in stack | (187.41, 174.34) | (221.33, 160.75) | (187.41, 173.03) |
| → unrotated top-left | (44.08, 34.38) | (93.39, 45.77) | (61.03, 59.51) |
| border t / sides / bottom | 8 / 8.3 / 33.5 → 6.7 / 6.9 / 27.9 | 6.3 / 7.3 / ≈33 → 5.3 / 6.1 / 27.5 | 7.2 / 7.6 / 35 → 6.0 / 6.3 / 29.2 |
| corner radius | ≈3 → 2.5px | ≈3 → 2.5px | ≈3 → 2.5px |
| shadow | none (crisp edge) | soft black, ≈9% at the edge, σ≈10 → `0 2px 17px rgb(0 0 0 / .18)` | same |

At rest only the front polaroid, a right-hand strip of the middle one (≈20–40px wide, upper two thirds) and a sliver of
its top-left corner are visible; the back polaroid is completely covered (it only shows during the drop-in).

**Sticker:** `div.absolute` at left 273.1px, top 202.82px, no width (shrink-to-fit) → width = min(144px, stack − 273.1px):
110.9px on desktop and 768, 36.9px at 390 (the stack is 310 there). The bento ink is 49%×64% of its square canvas,
centered at (50.6%, 48.8%) → ≈55×71px of visible ink on desktop, straddling the front polaroid's bottom-right corner
(photo corner + frame + ≈14px of black background). The bento has a solid white fill, so it reads on black.

## States & behaviors

### 1. Polaroid drop-in (in view, once)
- **Trigger:** 50% of the 384×384 stack visible (measured: fired between section-top 700px → 660px in a 900px viewport,
  i.e. stack visibility 42% → 52%). framer-motion `whileInView`, once (stays after scrolling away).
- **Before:** each of the 4 elements `opacity: 0; transform: translateY(-60px)`.
- **After:** `opacity: 1; transform: none`.
- **Transition:** framer spring rendered as WAAPI with duration **550ms** and easing
  `linear(0 0%, 0.0125 1.85%, 0.0463 3.70%, … 1.0533 48.15% …, 1 94.44%, 1 100%)` (peak 1.0533 → the y value overshoots to
  +3.2px, then settles). Same curve for opacity (clamped at 1) and y.
- **Stagger:** back 0ms, middle 200ms, front 400ms, sticker 600ms (all started by one trigger).
- Aeon: `IntersectionObserver` (threshold 0.5) sets `data-inview` on the stack; CSS keyframes animate `opacity` and the
  individual `translate` property (so the `rotate` on the same element is untouched) with the exact `linear()` curve.
  Hidden initial state only under `(scripting: enabled) and (prefers-reduced-motion: no-preference)`.

### 2. Card accordion (desktop ≥810, hover)
- **Trigger:** `mouseenter` on a card; `mouseleave` resets (moving onto another card switches directly).
- **Rest:** all cards `flex: 1 1 0px` → 272.5px; reveal block `max-height: 0; opacity: 0` (0px tall); title 216.5px wide,
  top at card bottom − 70px.
- **Hovered card:** `flex: 2.5 1 0px` → 633.7px; reveal block `max-height: 300px; opacity: 1` (content 132px tall with a
  3-line quote); the title is pushed up by the revealed block (justify-end): 592.9 → 460.9 (−132px) at 1440.
- **Other cards:** `flex: 0.6 1 0px` → 152.1px; their titles truncate with an ellipsis ("20% drop …").
- **Transitions:** `flex-grow 0.5s ease-in-out`; `max-height 0.4s ease-in-out`; `opacity 0.3s ease-in-out` (CSS
  keyword ease-in-out = cubic-bezier(.42,0,.58,1)); identical on the way out. No image zoom, no gradient change, no arrow.
- **Click:** nothing (no link, URL unchanged). Not focusable.
- Aeon: same classes/values; each card is an `<a href="#faqs">` (the brief's default), so it is also keyboard-focusable:
  `focus` expands exactly like hover, `blur` collapses, with a visible focus ring (2px white, inset 4px).
- Aeon titles (orchestrator request: no title cut off at rest at 1024 / 810): at rest titles wrap (`text-wrap: balance`,
  2 lines at 810–1199px where the rest width is 119–173px); from the moment a card opens until 500ms after the row
  returns to rest they use 7shifts' nowrap + ellipsis, so collapsed cards never reflow into tall titles mid-transition.
  At ≥1200 every title fits on one line, so the behavior is identical to 7shifts there.

### 3. Lime marquee (time)
- Moves left continuously: `translate(0) → translate(-50%)`, 30s, linear, infinite, starts on load, **does not pause on
  hover**. Measured speed 44.63 px/s (1340.36px per 30s = 44.68 px/s).
- Aeon: shared `animate-marquee-x` (same keyframes) with `--marquee-duration` computed from Aeon's half-track width so
  the band moves at the same 44.68 px/s: half track 1470.34px (7 TA items + 7 × 56px) → 32.91s; measured 44.61 px/s.
  Duplicate copy `aria-hidden`. Band clips its track (`overflow-hidden`), so the page never gets wider than the
  viewport (`scrollWidth` 390 at 390 mobile).

### 4. Stats
- Static text, no count-up, no fade (verified per animation frame while scrolling in).

## Responsive
| | 1440 | 810–1199 (desktop layout) | 768 / <810 (mobile layout) | 390 |
| --- | --- | --- | --- | --- |
| top row | polaroid 384 + heading 696, centered vertically | same, heading column narrows (520 at 1024, 306 at 810) | stack centered above a centered 3-line heading | stack 310 wide (overflows right, clipped) |
| h2 | 52px, 2 lines, left | 52px, 3–6 lines | 36 / 72 / 36px centered | same |
| stats | 4 × 250px, centered text | 4 cols (152.5px at 810), labels wrap | 2 cols, left | 2 × 135px |
| h3 | 44px, 1 line | 44px (2 lines at 810) | 28px / 32px | 2 lines |
| cards | accordion row, h 463 | same (182px cards at 810) | stacked cards, content always visible | 310×463 |
| band | 60px | 60px | 60px | 60px |
| section height | 1376 | 1403 (1024), 1478 (810) | 2520 | 2672 |

## Aeon content mapping
| 7shifts | Aeon |
| --- | --- |
| polaroid-1 photo (man with phone) | `/images/photos/hcp-phone.webp` (physician with phone), cropped to the 272.9×245.3 photo window |
| polaroid-2 photo (team) | `/images/photos/hero-marketer.webp` (decorative, only a strip visible) |
| polaroid-3 photo (kitchen crew) | `/images/photos/persona-medical.webp` (decorative, only visible during the drop-in) |
| bento-box sticker | `/images/doodles/doodle-phone.png`, sized so its ink matches the bento's ink (height 63.67% of the sticker box, ink centered on the same point), with a white fill traced from the doodle's own silhouette (the PNG's phone body is transparent and would vanish on black; the bento is white-filled) |
| "Proud to be in the pockets of" / "[1.5 million] restaurant pros" | "HCPs and patients are" / "[asking AI] first" ("asking AI" = the 72px hand span; kept on one line with nowrap) |
| 55K+ / 1 in 10 / $1B+ / 4.7★ + labels | 2 in 3 · US HCPs use AI tools daily · American Medical Association, 2025 / 1 in 5 · HCPs use GenAI for diagnosis and treatment choices · The Guardian, 2025 / 70% · of US HCPs find AI helpful for diagnosis · Talker Research, 2025 / 1 in 3 · American patients use AI to manage their health · Talker Research, 2025 |
| (none) | **Deliberate addition:** source line under each label: Inter Tight 12px / 18px, white at 50% opacity, 4px below the label (screen readers get a "Source:" prefix) |
| "Hear from the teams using 7shifts every day" | "Built for every team that touches the brand" |
| testimonial cards (title / quote / name + role) | persona cards: title / detail line (quote slot, no quote marks) / role label (bold name slot). Win back lost prompts · See where competitors are recommended and you are not, then ship the fix. · Brand & digital marketing (`persona-brand.webp`); Catch wrong doses · AI sentence next to the label sentence, routed to medical information. · Medical affairs (`persona-medical.webp`) (orchestrator shortened it from "Catch wrong-dose answers", which truncated at 1440); Review, don't rewrite · Drafts arrive claim-referenced with a pre-MLR risk score. · Regulatory & MLR (`persona-regulatory.webp`); Run every client brand · One website-in flow per client, one multi-brand overview. · Agencies (`persona-agency.webp`). Photos use `object-position: 50% 15%` so faces stay in frame when a card is wider than tall (expanded, or 688px wide at 768) |
| restaurant categories + doodles | Obesity, Immunology, Oncology, Neurology, Cardiology, Women's health, Dermatology with `/images/doodles/ta-*.png` (240×240 PNG at 40×40) |

## Deliberate deviations
- Cards are links to `#faqs` (brief default) → `cursor: pointer` and keyboard focus/expand; 7shifts' cards are inert.
- Card titles wrap at rest instead of truncating (see behavior 2); 7shifts truncates at every width (all four at 810).
- Mobile shows all four persona cards (7shifts drops its 4th testimonial below 810); every persona is an audience.
- One `h2` restyled per breakpoint instead of 7shifts' four `h2`s (three mobile + one desktop) — same pixels, one heading.
- One set of cards restyled per breakpoint instead of two duplicated sets.
- Source lines under the stats (third-party stats must show their source).
- White fill behind the phone doodle (see mapping).
- Section gets `overflow-x: clip` so the mobile polaroid overflow is clipped at the section edge instead of relying on a
  page-level clip (7shifts clips at the viewport).
