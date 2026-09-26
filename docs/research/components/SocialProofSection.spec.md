# SocialProofSection spec: "HCPs and patients are asking AI first" (light, product-led)

## Overview
- **Why it changed:** user feedback: no sudden black section and no people photos. The section keeps 7shifts' social
  proof skeleton (stack + handwritten headline, four stats, a hover accordion of four cards, lime marquee band) but
  is now a white sheet, and every picture is product UI.
- **Target files:** `src/components/SocialProofSection.tsx` (export `SocialProofSection`, server component, owns the
  section copy), `src/components/social/AnswerStack.tsx` (client: in-view drop-in, owns its mock copy),
  `src/components/social/FeatureCards.tsx` (client: hover/focus accordion), `src/components/social/FeatureMocks.tsx`
  (the four product screens + their screen-reader summaries), `src/components/social/TaMarquee.tsx` (lime band),
  `src/components/social/social.module.css` (drop-in keyframes + spring easing).
- **Root:** `<section data-section="social" id="personas">` (the footer and the header's "Built for" panel link to
  `#personas`).
- **Neighbours:** above is the sand (`#F1F0EC`) coverage band, which leaves ~40px of bottom padding for this sheet to
  overlap; below is the white get-started block (`relative z-10 -my-[60px] py-[60px]`), which slides under this
  section's bottom padding.
- **Breakpoints:** theme `sm` 567, `md` 810, `lg` 1024. Top row and stats switch at `md`; the card accordion starts at
  `lg` (see Responsive).
- **Reference (original layout and motion):** `docs/design-references/social/` (7shifts captures). Values below that
  are unchanged from 7shifts (drop-in spring, accordion timings, marquee speed) were measured there.

## Section shell
| Element | Values |
| --- | --- |
| section | `relative z-20 -mt-[40px] rounded-t-[40px] bg-white pb-[40px] text-ink overflow-x-clip`. The 40px top corners sit on the sand band above (stacked-sheet look, like the hero's `rounded-b-[40px]` and the footer's `rounded-t-[40px]`). Bottom corners are square: the white get-started block continues underneath |
| container | max-width 1200; `px-5` (<567) / `px-10`; `pt-12` (<810) / `pt-16`; `pb-20`; flex column, centered, gap 40px |
| top row | ≥810: flex row, centered, gap 40px (stack 384 + heading). <810: column, gap 8px |
| h2 | unchanged 7shifts type (Geist 500 52px/1.1 desktop; 36/72/36px centered lines below 810) in **ink**; "asking AI" is the Nanum Pen Script 72px span in flame, −0.04em, `top: 0.1em` on desktop |
| stats | 4 cols ≥810 / 2 cols; gap 40 × 32; number Geist 500 36px flame; label Geist 18px/1.5 ink; source Inter Tight 12px/1.5 stone, 4px under the label, "Source:" prefix for screen readers |
| h3 | "Built for every team that touches the brand", Geist 500, ink, 28px/32px (<810) or 44px/1.1 + 16px bottom padding |
| lime band | unchanged: full width, `bg-lime`, 10px vertical padding, 40px doodles + Nanum 28px labels; followed by the section's 40px white bottom padding |

Contrast note: flame `#FF6808` on white is 2.9:1 (the stat numbers and the handwritten span are ≥36px, where
AA asks for 3:1). The token was kept on purpose to match the rest of the page.

## Answer-card stack (replaces the polaroid stack)
- **Slot:** same 384×384 box as the polaroids (`w-96 aspect-square`, `max-w-full`). It is a size container and the
  inner stage sets `--spacing: calc(100cqw / 384)`, so every spacing utility, radius and font size inside is a stage
  unit (1px at 384). On a phone the whole composition scales down to the content width (350px at 390) instead of
  overflowing.
- **Cards** (white, radius 16u, padding 14u, `ring-1 ring-black/6`, shadow `0 1px 2px /6%, 0 14px 36px -10px /22%`):

| | back | middle | front |
| --- | --- | --- | --- |
| engine | Gemini (`BrandLogo` 16u + name 13u) | Perplexity | ChatGPT |
| box | left 14, top 62, 236 × 160, rotate −8°, `bg-offwhite` | left 126, top 34, 244 × 168, rotate +6° | left 40, top 112, width 300, auto height (~215), rotate −3°, padding 16u |
| visible at rest | header on the left | header + red "[Brand] missing" chip on the right | whole card |
| content | header + 3 sand skeleton bars | header, one ink/70 line "Competitor X is the most prescribed option for…", 2 bars | header; right-aligned sand question bubble "What's the best treatment for moderate eczema in adults?" (12u/1.35, radius 14u with a 4u bottom-right corner); answer 12.5u/1.6 ink/80 naming **Competitor X** (sand chip, ink rank badge 1) first and **[Brand]** (periwinkle chip, royal rank badge 2) second; "Sources: 4" sand pill with a link icon + 4 overlapping favicon dots |

- **Sticker:** `/images/doodles/doodle-phone.png` in a 110u box at left 284, top 240 (straddles the front card's
  bottom-right corner), with the white fill traced from the doodle's silhouette so it reads as a cut-out sticker.
- **Drop-in (unchanged motion):** IntersectionObserver at 50% of the stack, once. Each card and the sticker animate
  `opacity 0 → 1` and `translate: 0 -60px → 0` over 550ms on 7shifts' framer spring (`linear()` curve in
  `social.module.css`, peak 1.0533), staggered back 0ms, middle 200ms, front 400ms, sticker 600ms. `translate` is
  animated so the cards' `rotate` stays untouched. Hidden start state only under `(scripting: enabled) and
  (prefers-reduced-motion: no-preference)`.
- **A11y:** stage is `aria-hidden`; a `sr-only` paragraph summarises it ("Example: asked for the best treatment for
  moderate eczema in adults, ChatGPT names Competitor X first and [Brand] second, citing 4 sources…").

## Feature cards (replace the persona photo cards)
Content (titles/roles/details unchanged; screens are illustrative placeholders):

| Title | Role | Detail | Panel | Screen |
| --- | --- | --- | --- | --- |
| Win back lost prompts | Brand & digital marketing | See where competitors are recommended and you are not, then ship the fix. | periwinkle | "Share of voice" + "Eczema" tag; bars You 34 (royal) / Competitor X 71 (ink); "3 prompts lost" (flame dot) with 3 offwhite rows: engine logo (ChatGPT, Perplexity, Gemini) + truncated prompt + "Comp. X" pill |
| Catch wrong doses | Medical affairs | AI sentence next to the label sentence, routed to medical information. | lavender | Gemini header + red "Wrong dose" chip; red "AI answer" box "Take [Brand] ~~300 mg twice daily~~"; mint "Label · PI §2.1" box "Take [Brand] **150 mg once daily**" (forest); footer "Routed to Medical Information" |
| Review, don't rewrite | Regulatory & MLR | Drafts arrive claim-referenced with a pre-MLR risk score. | lime | "Draft: [Brand] dosing FAQ" / "Pre-MLR check"; "Risk score" row with mint "Risk: Low" pill; 3 forest check items (4/4 claims referenced, Fair balance included, Safety info included); "Comment" outline + royal "Approve" buttons |
| Run every client brand | Agencies | One website-in flow per client, one multi-brand overview. | oat | "All client brands" / "Visibility"; rows Brand A 62, Brand B 48, Brand C 71 (tinted monogram, royal bar, score); dashed "Add a client website" row |

- **Screen window:** white, `rounded-xl`, padding 14px, min-height 226px (footers pinned to the bottom so all four
  line up), Inter Tight 9–12px, shadow `0 1px 2px /5%, 0 12px 30px -10px /20%`. Width `w-full` between 188px and
  288px, `mx-auto`: centered in wide cards, and in cards narrower than 228px it keeps 188px and bleeds off the right
  edge (clipped by the card), which is what the collapsed accordion cards show. Rows never wrap between those widths,
  so the accordion resizes them smoothly (the dose sentences may wrap to two lines at 188px).
- **Card:** `rounded-[10px]`, panel colour, `overflow-hidden`; the whole card is an `<a href="#faqs">`. Text block
  (px 24, pt 16, pb 28, gap 8): role 13px/1.3 500 ink/60 → title Geist 500 20px/1.15 ink → detail 16px/1.5 ink/75.
- **Accordion (≥1024, same behavior and timings as before):** row height 463px, gap 10px, cards `flex: 1 1 0`
  (`transition: flex-grow .5s ease-in-out`). Hover or keyboard focus: that card → `flex-grow 2.5`, the others → 0.6;
  its detail block goes `max-height 0 → 160px` (.4s ease-in-out) and `opacity 0 → 1` (.3s). The screen area is the
  remaining height above the text, with the screen vertically centered (`align-items: safe center`), so it glides up
  as the detail slides in. Role and title wrap (`text-wrap: balance`) while the row is at rest and switch to
  nowrap + ellipsis from the moment a card opens until 500ms after the row returns to rest. At 1440: rest 272.5px,
  open 633.7px, collapsed 152.1px.
- **Below 1024:** grid, 2 columns from 567px, 1 column below; everything visible (screen on top, then role, title,
  detail); no hover behavior.
- **A11y:** screens are `aria-hidden`; each card has a `sr-only` summary of its screen (outside the link, so the link
  name stays role + title + detail). Focus ring: 2px ink outline inset 4px. No testimonials, names, quotes or
  customer claims anywhere.

## Responsive
| | ≥1200 | 1024 | 810 | 768 | 390 |
| --- | --- | --- | --- | --- | --- |
| top row | stack 384 + heading (2 lines) | same, heading narrower | same (heading 306 wide) | stack centered above the 3-line heading | stack scaled to 350 |
| stats | 4 cols | 4 cols | 4 cols | 2 cols | 2 cols |
| cards | accordion, rest 272.5 | accordion, rest 228.5 | 2 × 2 grid | 2 × 2 grid | 1 column |

`scrollWidth` equals the viewport at 320, 390, 768 and 1440 (the band clips its own track; the stack scales).

## Deliberate deviations from 7shifts
- White sheet with 40px top corners instead of a black 20px-radius block; ink text.
- Product UI instead of photos (answer-card stack; four product screens on light panels).
- Accordion starts at 1024 instead of 810 (the 175px cards at 810 were too narrow for a product screen).
- Role shown at rest above the title; detail revealed on hover/focus.
- Cards are links to `#faqs`, keyboard-focusable, and expand on focus.
- Source lines under the stats (third-party stats must show their source).
