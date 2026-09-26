# WhySection spec (7shifts "Why connected work wins" → Aeon "Built for pharma")

## Overview
- **Target files:** `src/components/WhySection.tsx` (export `WhySection`), `src/components/why/OldWayCollage.tsx`,
  `src/components/why/AeonAppMock.tsx`, `src/components/why/why.module.css` (keyframes only).
- **7shifts source:** `.traffic-warden-root` child #2 (section index 2). y≈4786 / h 1251 at 1440 (page with header),
  1869 at 390 and ≈2403 at 768 with media loaded (single column below 810; see breakpoints).
- **References** (`docs/design-references/why/`):
  - `7s-why-1440.jpg`, `7s-why-390.jpg`: live captures with media loaded (fixed header/announcement bar hidden).
  - `7s-why-768-no-media.jpg`: DOM screenshot before the Lottie/PNG loaded. Use for layout/structure only.
  - `7s-why-collage-1080.jpg`: the left visual, which is ONE flattened 1080×1080 PNG (`Without7shifts_static.png`).
  - `7s-why-lottie-tips-1080.jpg`, `7s-why-lottie-timeline.jpg`: the right visual, a Lottie
    (`/next-images/animations/json-files/with-7shifts.json`, 1080×1080, 30 fps, 301 frames = 10 s, bodymovin 5.7)
    rendered offline with lottie-web.
  - Original full-page capture: `docs/design-references/7s-05-why-connected.jpeg`.
- **Interaction model:** static section (no scroll reveal, no hover on cards). Only motion: the right visual is a
  lottie-react player with `loop: true, autoplay: true` (verified from its React props on the live page), i.e. an
  endless product tour that starts on mount. CTA has the shared button hover.

## DOM structure (7shifts, exact classes)
```
div.bg-white.pt-[40px].pb-[80px].px-[20px].md:px-[40px].-mt-[60px].rounded-[40px].relative.z-50.md:pt-[80px]
  div.max-w-[1100px].mx-auto
    div.mb-[40px]
      h2.font-medium.text-[53px].leading-[110%].text-center.mb-[10px].md:text-[53px].md:leading-[90%].text-pretty
      p.font-regular.text-[18px].leading-[150%].text-center
    div.grid.grid-cols-1.md:grid-cols-2.gap-[10px]
      div.bg-[#F1F0EC].rounded-[20px].p-[20px].md:p-[40px].flex.flex-col           (left card)
        div.py-[20px]
          p.text-[28px].font-nanumPenScript                                          "The old way"
          h3.text-[28px].font-medium.m-0.p-0.mb-[10px].xl:text-[36px].leading-[90%]
          p.te (empty, 0px)
        div > 3 × div.py-2.text-lg.flex.justify-start
                     div > div.mr-3.mt-1 > svg(20×20, phosphor-bold X, fill #fff).bg-black.rounded-full.p-1
                     p
        div.w-full.aspect-[4/4].max-w-[800px].mx-auto.mt-auto.pt-6
          img (1080×1080 PNG, width 100%, corners baked in)
      div.bg-black.text-white.rounded-[20px].p-[20px].md:p-[40px].flex.flex-col   (right card, same anatomy;
          svg is phosphor-bold check, fill #000, .bg-white.rounded-full.p-1; visual = Lottie, "Loading..." placeholder)
    div.mt-10
      a (shared pill button) .h-12.bg-royal-blue.hover:bg-dark-curacao.w-fit.mx-auto.mb-[4px].px-[24px]
      p.text-center.mx-auto.text-[11px].text-[#6E6D6C]                               "No credit card required"
```

## Breakpoints (from 7shifts' CSS, `--breakpoint-md:810px`)
7shifts' Tailwind screens are **sm 567, md 810, lg 1024, xl 1200, 2xl 1374** (not Tailwind defaults). At 768 every
`md:` rule is off (single column, 20px paddings, 110% h2 leading). The Aeon theme (globals.css) now defines the same
screens, so the section copies 7shifts' `md:` / `xl:` classes as-is.

## Computed styles (exact, 1440 unless noted)
| Element | Values |
| --- | --- |
| Section | bg #fff; padding 80px 40px 80px (<810: 40px 20px 80px); margin-top -60px; radius 40px; position relative; z-index 50; height 1251 |
| Container | max-width 1100px; margin 0 auto (1100 wide at 1440, 728 at 768, 350 at 390) |
| Heading block | margin-bottom 40px |
| h2 | font "medium" (7sans → Aeon `font-display` Geist) 500 53px; line-height 90% = 47.7px at ≥810, 110% = 58.3px below; center; mb 10px; text-wrap pretty; color #000; letter-spacing normal |
| Sub p | Inter Tight 400 18px / 27px; center |
| Grid | 1 col (<810) / 2 cols 545+545 at 1440; gap 10px |
| Card | radius 20px; padding 40px (≥810) / 20px; flex column. Left bg #F1F0EC (sand), right bg #000 + white text; 858px tall at 1440 (grid-stretched) |
| Card head | padding 20px 0 |
| Eyebrow | Nanum Pen Script 400 28px / 42px |
| h3 | "medium" → Geist 500; 28px (≥1200: 36px); line-height 90% (25.2 / 32.4px); mb 10px; 2 lines at 1440 (64.8px) |
| List item | flex; padding 8px 0; 18px / 28px Inter Tight; 44px tall per one-line item |
| Icon | wrapper mr 12px, mt 4px; svg 20×20, padding 4px (12px glyph), radius 9999px; left: bg #000 + white phosphor-bold X; right: bg #fff + black phosphor-bold check |
| Visual wrapper | width 100%; max-width 800px; margin-top auto; padding-top 24px; visual is square (465 at 1440, 688 at 768, 310 at 390) |
| CTA block | margin-top 40px; button h 48px, px 24px, radius full, Geist 500 16px/24px, bg #4570ff → hover #3658c9, transition all 150ms cubic-bezier(0.4,0,0.2,1), mb 4px; micro 11px/16.5px #6E6D6C centered |

## Left visual: "old way" collage (1080-unit coordinate system, 1 unit = frame width / 1080)
Flattened PNG on 7shifts; rebuilt as photo + HTML layers. Frame: square, all four corners r 41 (≈17.7px at 465).
| Layer | Geometry (units) | Style |
| --- | --- | --- |
| Photo | full bleed, object-cover | Aeon: `/images/photos/old-way-desk.webp` |
| macOS menu bar | 0→1080 × 0→78 | bg #2e3232; white 18u text; logo glyph x30; "Finder"(bold) x75, then File/Edit/View/Go/Window/Help, gap 22u, centred at y 38 |
| Notification toast | x 458→1022 (564) × y 62→183 (121); drawn over the menu bar | bg #d9d9d9, r 20; icon tile 65×65 white r 13 at x 484 (v-centred); title 600 22u at x 574 (baseline 114), subtitle 400 22u (baseline 148), #000 |
| Arrow cursor | tip ≈ (762,158), ≈40u | black arrow, white outline |
| Blue toast | x 644→bleeds off right edge × y 237→330 (93) | bg #4570ff, r 20; white 400 22u text at x 675, v-centred |
| Chat chip | x 47 × y 903→983 (80), width = text + 41u left / ~69u right padding | bg #fff, r 20 except bottom-left 0; #1a1a1a 400 24u |
| (7shifts only) | "Availability" photo window, spreadsheet window, second blue bubble | not reproduced: the Aeon photo already contains the laptop spreadsheet and marked-up label pages |

## Right visual: product-tour Lottie (1080 units)
- **Player box (live):** lottie `<svg>` 465×465 (`width/height 100%`, `overflow: hidden`, no radius) inside the
  `pt-6` wrapper, which grows to 489px like the left card's image wrapper, so both visuals share the same top.
- **Panel BG:** 1080×1080 #4570ff, r 41.8. The app window is NOT clipped by the rounded BG (only by the square
  comp), so the bottom-right corner is square white (visible in the live capture).
- **Window:** starts x 153, y 144, bleeds off right and bottom. Top-left corner r ≈ 18u. No shadow.
- **Sidebar:** x 153→491 (338), white, right border 1.4u #d5d5d5 (no rule under the header). Header row 144→243
  (99): logo 65×65 at (161,163); collapse chevron #767676 at x≈441, y 193.5. Nav rows (pitch 62.3u):
  icons 28u #323232 at x 190, labels 22u medium #323232 at x 241. Groups separated by 1.4u #d5d5d5 rules at
  y 525.9, 690, 916.3. Items (centre y): 289, 351, 413, 475 | 577, 639 | 741, 803, 865 | 967, 1029.
  Orange notification dots (#ff6808, 9.9u, 1.4u white ring) at an icon's top-right on three items.
- **Highlight pill:** 292.8×56.6, r 22.6, #d6e0ff, x 175.6→468.4, centred on the row. Hover and active use the
  same pill.
- **Pointer:** hand cursor pointing left, white fill, black 3.45u outline, ≈102×76u, x ≈ 440→542; its y =
  row centre + 33u.
- **Main pane (Tips screen):** white from x 491. Header: 44u orange (#ff6808) avatar at (518,193) + title 28u
  medium at x 579, y 205→226. Sub-header 22u medium at x 540, y 311→331. Date control 370.6×43.1 at (546,375),
  r 3.9, 1.1u #d5d5d5 borders: 40u chevron buttons each side (chevrons #767676), middle segment with calendar icon
  (#767676) at x 600, dates #464646 16.5u at x 634 and 752 with a #767676 arrow between; "Today" button 68×41 at
  x 933, bg #f3f3f3, border #d5d5d5, r 3.9, text #464646 16.5u.
- **Chart:** gridlines 1.08u #949494 from x 627→1114 at y 460.9, 496.9, 532.8, 568.8, 604.7, 640.7; baseline
  #979797 at y 670.9. Y labels 15u #000 right-aligned ending x≈600, centred at y 459, 525.5, 592, 656. Bars
  57.5u wide at a 79u pitch (first bar x 645.6), bottom-anchored on the baseline; body #4e72f6, optional lighter
  top segment #d6e0ff; square corners. X labels 14u #000 centred under bars, y 690→701.
- **Table:** header row y 750→798, 15u #000 labels at x 564, 846, 1047. Rows #fbfaf8, r 6.4, 82u tall at an 86u
  pitch (y 802.5, 888.5, 974.5), from x 539 bleeding right; 42u round avatar centred x 579; name 17u at x 618;
  values 17u at x 846 and 1047.

## States & behaviors
- **Right visual (Lottie) loop, 10 s, autoplay + loop** (the final frames sweep the pointer back to the first item,
  so the loop is seamless). Per 2 s screen: pointer glides to the next nav item (`cubic-bezier(.333,0,.667,1)`,
  8-23 frames), that item's pill appears ~5-7 frames after the move starts, at the segment boundary the previous pill
  disappears and the screen cuts to the new one. Tips screen entrance: bars `scaleY 0 → 1` from the bottom over 28
  frames (0.933 s) starting 2 frames in, easing `cubic-bezier(.333,0,0,1)`; table rows + avatars fade `0 → 1` over
  9 frames (0.3 s) with `cubic-bezier(.333,0,.667,1)`, starting at frames 2, 6 and 11.
- **CTA:** bg #4570ff → #3658c9 on hover/active (150 ms), focus ring 2px royal with 2px white offset.
- No scroll-triggered reveal, no card hover.
- **Aeon implementation (why.module.css):** one screen, so the tour is a 6 s CSS loop (180 frames at 30 fps) that
  reuses the Lottie's timings: f0 "click" on Overview redraws the chart (bars `scaleY` over f2→f30 with
  `cubic-bezier(.333,0,0,1)`, rows fade f2→f11 / f6→f15 / f11→f20); f120→f132 the hand glides one row down to
  Prompts and its pill appears at f127; f160→f175 it glides back and the Prompts pill drops at f165. Starts on mount
  like `autoplay`, loops forever like `loop`. `prefers-reduced-motion`: animations off, finished frame shown.

## Aeon content mapping
| 7shifts | Aeon |
| --- | --- |
| H2 "Why connected work wins" | "Built for pharma. Not retrofitted for it." |
| Sub | "Generic GEO tools track consumer brands. Pharma needs indication-level analysis, label accuracy and MLR-ready output." |
| "The old way" / "Disconnected tools, less clarity" | "Generic GEO tools" / "Consumer playbooks, compliance headaches" |
| ✗ ×3 | "No indication or label context" · "Content your MLR team can't approve" · "No route for adverse-event signals" |
| Collage | desk photo + menu bar "Finder File Edit View Go Window Help" + gray toast "Prescribing_Info_v7_FINAL.pdf" / "3 new comments" + royal toast "MLR round 3: 41 comments" + white chip "Is this claim on-label?" |
| "With 7shifts" / "Connected system, clearer next steps" | "With Aeon" / "Pharma-native and approval-ready" |
| ✓ ×3 | "Indication-level competitive landscape" · "Every claim linked to the label" · "Safety signals routed to your PV inbox" |
| Lottie tour | HTML Aeon app window, same crop: AeonLogo mark; nav Overview, Prompts, Competitors, Citations / Accuracy, Safety signals / Drafts, Reviews, Claims library / Reports, Integrations (same 4-2-3-2 rhythm as 7shifts); header "Brand A · Atopic dermatitis"; "Share of voice"; date control "Jun 2 → Jul 28" + "Today"; 8 weekly bars rising, lighter top segments on later weeks; y labels 30% / 20% / 10% / 0%; table Engine / Share of voice / Accuracy for ChatGPT, Gemini, Perplexity (illustrative UI numbers) |
| CTA "Get started, it's free!" / "No credit card required" | "Start your free report" (`START_HREF`) / "Free first scan. No credit card required." |

## Assets
- `/images/photos/old-way-desk.webp` (1168×880) via `next/image` `fill` + `sizes`, object-cover in the square frame.
- Icons: shared `XIcon` / `CheckIcon` (the same phosphor-bold paths 7shifts uses), lucide line icons for the mock.
  The hand and arrow cursors are original SVG drawings matched to the originals' size, angle and placement.
  No 7shifts imagery, logos or Lottie data are shipped.

## Responsive behavior
| Width | Layout |
| --- | --- |
| 1440 | section padding 80/40/80; cards side by side 545px; h3 36px; visuals 465px |
| 1200-1439 | same, container shrinks with viewport minus 80px; h3 36px from 1200 |
| 810-1199 | two columns, h3 28px |
| 768 (<810) | single column, section padding 40/20/80, card padding 20px, h2 line-height 110%; visuals 688px |
| 390 | single column, 350px container, visuals 310px; h2 53px wraps (3+ lines), list items may wrap to two lines |
All visual layers are sized in 1080-units against the frame width (`cqw`), so both visuals scale exactly like the
flattened PNG and the Lottie do.
