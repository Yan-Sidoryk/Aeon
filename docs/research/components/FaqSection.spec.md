# FaqSection spec (`section#faqs`)

Reference: https://www.7shifts.com/ — `section#faqs` (`.traffic-warden-root` child #6), y ≈ 8772, height 874 at 1440px
(all rows closed). Extracted with Playwright: computed styles at 1440 / 1280 / 1024 / 768 / 390, hover, click
open/close sampled every ~25ms, keyboard focus, sticky check, CSSOM media rules.
Screenshots: `docs/design-references/faqs/7s-faqs-1440.jpg`, `7s-faqs-1440-open.jpg` (row 1 open),
`7s-faqs-1440-hover-row.jpg`, `7s-faqs-1440-not-sticky.jpg` (scrolled 250px: the heading scrolls away),
`7s-faqs-768.jpg`, `7s-faqs-390.jpg`, `7s-faqs-390-open.jpg`, plus `docs/design-references/7s-10-faq-cta.jpeg`.
(7shifts' lazy doodle image did not load in the headless captures, so its alt text shows; the loaded image is 65×54.)

Implementation: `src/components/FaqSection.tsx` (server: layout, doodle, heading, JSON-LD) +
`src/components/faq/FaqAccordion.tsx` (client: rows and state).

## Overview
Sand sheet with 40px rounded top corners that overlaps the bottom 60px of the white "get started" wrapper (z-50).
Left column: hand-drawn question-bubble doodle and a large H2. Right column: seven off-white rounded question rows
with a plus at the right. Clicking a row toggles its answer below the pill; rows are independent. Nothing animates on
scroll and the left column is not sticky.

## 7shifts breakpoints (CSSOM)
`md` = 810px, `lg` = 1024px, `xl` = 1200px; `container` steps: max-width 376 (≥376), 400 (≥400), 567 (≥567),
810 (≥810), 1024 … Aeon uses `min-[810px]:` / `max-[810px]:` for 7shifts' `md` / `max-md`, `lg:` / `max-lg:` for
`lg`, and spells out 7shifts' `max-lg:container` as `max-lg:w-full` plus the stepped `max-w-[376/400/567/810px]`.

## DOM structure (7shifts → Aeon)
```
section#faqs.flex.relative.justify-center.px-5.bg-[#F1F0EC].rounded-t-[40px].z-50      → section#faqs[data-section="faqs"]
├ (Aeon only) script[type="application/ld+json"]  FAQPage
└ div.max-w-[1000px].md:mx-20.py-14.gap-5.md:py-40.flex.md:gap-20.md:items-start.max-md:flex-col.max-lg:container
  ├ div.md:w-1/3.flex.flex-col.gap-3.md:max-w-80
  │ ├ img (next/image 65×54, lazy, aria-hidden)                                       → next/image doodle-faq.png 54×54, alt=""
  │ └ h2.text-4xl.md:text-5xl.font-medium.leading-[33px].md:leading-[43px].-tracking-[1.08px].md:-tracking-[1.44px]
  ├ div.flex.gap-4.md:hidden.sticky.top-20 … .hidden   (category tabs, display:none at every width → not reproduced)
  └ ul.md:w-2/3.flex.flex-col.gap-2.lg:mt-16
    └ 7 × li.relative.flex.flex-col
      ├ button[aria-expanded].text-left.w-full.rounded-2.5xl.focus-visible:ring-2 …   → h3 > button[aria-expanded][aria-controls]
      │ └ h3.bg-extra-light-gray.relative.lg:leading-[18px].md:hover:bg-light-gray.transition-all.cursor-pointer.pl-5.pr-14.py-5.text-lg.font-medium.rounded-2.5xl (+ !bg-medium-gray when open)
      │   └ svg (react-icons AiOutlinePlus, 1024 grid) .absolute.top-1/2.-translate-y-1/2.right-5.transition-all.z-20.rotate-0|rotate-45
      └ div[inert when closed].transition-all.ease-in.px-[15px].-tracking-[0.32px].max-h-0|max-h-96.p-[15px].overflow-y-hidden.flex.flex-col.gap-5
        └ div > p (> span)                                                             → div[role=region][aria-labelledby] > p
```

## Computed styles (7shifts)
| Element | Value |
| --- | --- |
| Section | bg #F1F0EC; padding 0 20px; border-radius 40px 40px 0 0; position relative; z-index 50; flex, justify-content center |
| Container <810 | flex column; gap 20px; padding 56px 0; width 100%; max-width 376px (≥376) / 400px (≥400) / 567px (≥567) |
| Container 810–1023 | flex row; align-items flex-start; gap 80px; padding 160px 0; margin 0 80px; max-width 810px |
| Container ≥1024 | as above with max-width 1000px (width = min(1000, viewport − 200)): 1000 @1440/1280, 824 @1024 |
| Left column | flex column; gap 12px; ≥810: width 33.33% (flex-shrunk to 306.67 @1440, 248 @1024), max-width 320px; position static (not sticky) |
| Doodle | 65×54, display block, max-width 100% |
| H2 | 7sans "medium" → **Geist**; weight 500; #000; left; 36px/33px, letter-spacing -1.08px (<810) · 48px/43px, -1.44px (≥810) |
| List | flex column; gap 8px; ≥810 width 66.67% (613.33 @1440, 496 @1024); margin-top 64px at ≥1024 only |
| Question pill (h3) | bg #FBFAF8; padding 20px 56px 20px 20px; radius 20px; Geist 500 18px; line-height 28px (<1024) / 18px (≥1024); #000; cursor pointer; transition all 150ms cubic-bezier(0.4,0,0.2,1). Heights: 58 / 76px (1 / 2 lines, ≥1024), 68 / 96 / 124px (1 / 2 / 3 lines, <1024) |
| Plus icon | 21×21; position absolute; right 20px; top 50% + translateY(-50%); z-index 20; `rotate` 0 → 45deg; transition all 150ms cubic-bezier(0.4,0,0.2,1) |
| Answer (closed) | max-height 0; padding 0 15px; overflow-x auto / overflow-y hidden; `inert` |
| Answer (open) | max-height 384px (`max-h-96`); padding 15px; flex column, gap 20px; Inter Tight 400 16px/24px, letter-spacing -0.32px, #000, directly on the sand background; transition all 150ms cubic-bezier(0.4,0,1,1) |

## States & behaviors
### 1. Hover a question (≥810px, hover-capable pointers only)
- Before: bg #FBFAF8. After: bg #F1F0EC (same as the section, so the pill melts into the sheet; text and plus stay).
- Transition: background-color 150ms cubic-bezier(0.4,0,0.2,1). Below 810px there is no hover style.

### 2. Click a question (toggle)
- Rows are **independent**: opening row 2 leaves row 1 open; clicking an open row closes it.
- Open: `aria-expanded` false → true; question bg → #E2DED6 (`!bg-medium-gray`, beats hover), 150ms; plus rotates
  0 → 45deg (reads as ×), 150ms cubic-bezier(0.4,0,0.2,1); answer max-height 0 → 384px and padding 0 15px → 15px,
  150ms ease-in (cubic-bezier(0.4,0,1,1)); `inert` removed. Measured answer height at 1440 (2 paragraphs, 146px):
  0 → 31 → 100 → 131 → 136 → 146px at 0 / 28 / 55 / 86 / 114 / 141ms.
- Close: the reverse; because max-height falls from 384px, the height holds near full (102 → 99.6 → 97 → 90 → 82 →
  66.5px) and snaps to 0 at ~170ms; `inert` restored.

### 3. Keyboard focus (`:focus-visible` on the button)
- 2px royal ring with 2px white offset: `box-shadow: 0 0 0 2px #fff, 0 0 0 4px #4570FF`, following the 20px radius;
  outline none; appears instantly.

### 4. Scroll
- No reveal animation (no motion inline styles anywhere in the section) and nothing sticky: the heading scrolls
  away with the list (see `7s-faqs-1440-not-sticky.jpg`).

## Aeon content mapping
- Doodle: `/images/doodles/doodle-faq.png` (square question bubble with an orange chat bubble, 240×240 source).
- H2: "Frequently asked questions".
- Rows (question → answer):
  1. What is GEO for pharma? → Generative engine optimization is the work of making sure AI engines like ChatGPT, Gemini and Perplexity mention your brand and describe it accurately. For pharma it also means checking every answer against the label and making every fix MLR-ready.
  2. Which AI engines does Aeon track? → ChatGPT, Claude, Gemini, Perplexity, Google AI Overviews and AI Mode, Copilot and Meta AI. Each prompt is sampled several times per engine, by market and language.
  3. Does Aeon publish content for us? → No. Aeon drafts and never publishes. It produces MLR-ready drafts and exports them for review, including to Veeva PromoMats. Nothing goes live without human sign-off.
  4. How do you handle off-label questions? → Prompts outside the approved indication are monitor-only. They show up as signals for medical affairs and are never used to generate content.
  5. What happens if an AI answer describes an adverse event? → Possible adverse events found in monitoring are routed to your pharmacovigilance inbox under your SOP. Aeon does not store patient PHI.
  6. How reliable are the visibility scores? → AI answers vary by model, region and time, so every score shows its sample size and confidence interval, and our methodology is published.
  7. Is the first report really free? → Yes. The first scan needs only your company website. We ask for a work email when you want to save the report and track it weekly.
- `FAQPage` JSON-LD with the same seven Q&As, rendered on the server (`<` escaped as `<`).

## Assets
`/images/doodles/doodle-faq.png` via `next/image` (lazy; 54×54).

## Responsive summary (7shifts, all rows closed unless noted)
| | 1440 | 1024 | 768 | 390 |
| --- | --- | --- | --- | --- |
| Layout | 2 columns | 2 columns | stacked | stacked |
| Container | 1000 wide, x 220, padding 160/0 | 824 wide, x 100 | 567 wide (container), x 101, padding 56/0 | 350 (max 376), padding 56/0 |
| Left column | 306.67 | 248 | 567 | 350 |
| H2 | 48/43, 3 lines | 48/43, 3 lines | 36/33, 1 line | 36/33, 2 lines |
| List | 613.33 wide, margin-top 64 | 496 wide, margin-top 64 | full width, no margin | full width |
| Row (1 line) | 58px (18/18) | 58px | 68px (18/28) | 68px |
| Hover fill | yes | yes | no | no |
| Section height | 874 | — | ≈845 | 962 |

## Deliberate deviations
- Semantics follow the WAI-ARIA accordion pattern: `h3 > button[aria-expanded][aria-controls]` and an answer
  `div[role=region][aria-labelledby]` (7shifts puts the h3 inside the button and has no `aria-controls`). The pill
  styles live on the button, so the visuals are identical.
- The button uses `transition-colors` (150ms, same curve) rather than `transition-all`: on 7shifts the transition sits on
  the inner h3, so its focus ring appears instantly; `transition-all` on our button would fade the ring in.
- The Aeon doodle is square, so it renders 54×54 (7shifts: 65×54) to keep the same 54px row above the heading.
- Answers are always in the DOM (closed panels are `inert` and 0px tall, as on 7shifts), so the text is in the
  server HTML alongside the JSON-LD.
