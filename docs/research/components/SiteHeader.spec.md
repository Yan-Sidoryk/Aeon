# SiteHeader spec (7shifts `header#site-navigation > header`)

## Overview
- Target files: `src/components/SiteHeader.tsx` (export `SiteHeader`), helpers in `src/components/header/`
  (`nav-content.ts` copy + data, `DesktopPanels.tsx`, `MobileMenu.tsx`, `icons.tsx`).
- Slug / root attribute: `data-section="header"` on the `<header>` element.
- 7shifts reference screenshots (`docs/design-references/header/`):
  `7s-header-1440.jpg`, `7s-header-1280.jpg`, `7s-header-768.jpg`, `7s-header-390-closed.jpg`,
  `7s-dropdown-platform-1440.jpg`, `7s-dropdown-builtfor-1440.jpg`, `7s-dropdown-resources-1440.jpg`,
  `7s-dropdown-link-hover.jpg`, `7s-menu-390-open.jpg`, `7s-menu-390-platform.jpg`, `7s-menu-390-builtfor.jpg`,
  `7s-menu-390-resources.jpg`.
- Interaction model
  - Scroll: **none**. Computed styles are identical at scrollY 0 / 50 / 200 / 1500 / 6000 (size, shadow, bg, radius).
  - Desktop (>= 1200px): **hover-driven mega menus**, click toggles too. Hovering a trigger opens its panel
    immediately (opacity 0 -> 1 in 200ms). Hovering another trigger swaps panels. Hovering the logo, a plain link
    (Pricing / Integrations), the empty space or the CTA group closes it; leaving the header closes it. Moving
    straight down from the trigger into the panel keeps it open (panel has a 10px transparent top padding).
    Escape closes. Focus alone does not open; Enter/Space (click) opens; Tab then walks into the panel links.
  - Mobile/tablet (< 1200px): **click-driven**. Hamburger expands the header to full height; nav items are
    accordions (only one open at a time, opening another closes the previous one).
- Breakpoints measured on 7shifts: `sm` 567px, `md` 810px, `lg` 1024px, **`xl` 1200px**, `2xl` 1374px — the theme in
  `globals.css` now uses the same values, so the header switches desktop <-> mobile with `xl:` / `max-xl:` at 1200px.

## DOM structure (7shifts, simplified)
```
div#site-navigation
  header.fixed.top-[37px].inset-x-0.z-[102]            (z-[104] while a menu is open)
    nav#top-level-nav-container (bg-white < xl, transparent >= xl)
      div#navbar-logo-container  (xl: white pill, flex, gap 24, px 24, h 80, radius 40, shadow)
        a#logo (xl: h-20 flex items-center)            img 7shifts wordmark
        div#mobile-nav-controls (< xl only)             a CTA (small) + button hamburger
        div.flex-1
          ul#mobile-menu (xl: flex h-80 justify-between; < xl: flex-col list, invisible until open)
            li > button[aria-expanded] "Platform ▾"      + mobile accordion panel (< xl)
            li > a "Pricing"
            li > button "Built for ▾"                    + mobile accordion panel
            li > a "Integrations"
            li > button "Resources ▾"                    + mobile accordion panel
            div#header-free-trial (w-full, justify-end, gap 8): a CTA + a Login
      div.max-xl:hidden > div.relative > [nav-panel-*] x3  (desktop panels, absolute under the pill)
  div.fixed.bottom-0.z-[105].bg-black (< xl, only while the mobile menu is open) enterprise link
```
Aeon keeps this anatomy; desktop panels are rendered inside each trigger `<li>` (absolutely positioned against the
fixed header) so the DOM/tab order is trigger -> panel links.

## Computed styles — desktop (>= 1200px)
7shifts scales the desktop header fluidly between 1200 and 1920 with `p = (100vw - 1200px) / 720px` (clamped).
Values below are `min @1200 -> @1440 -> @1920`.

| Element | Styles |
| --- | --- |
| header | fixed; top 37px; margin 16px 64px 0 (=> top edge y=53); width calc(100% - 128px); max-height 80px; z 102 (104 open); no transition |
| pill (#navbar-logo-container) | flex; items-center; gap 24px; padding 0 24px; height 80px; bg #fff (solid); radius 40px; box-shadow 0 4px 15px 0 rgba(0,0,0,.10) |
| logo link | height 80px; flex items-center; shrink-0. Wordmark width 64 -> 69.3 -> 80px (height 18.1 -> 19.6 -> 22.6) |
| nav list | flex; h 80; justify-between; items adjacent (no gap) |
| nav trigger / link | font "medium" (-> Geist) 500; font-size 14 -> 14.667 -> 16px; line-height 1.5 (22px @1440); padding 4px (8 -> 8.667 -> 10px); gap 10px; radius 9999px; height 30px @1440; color #000; transition colors 150ms cubic-bezier(.4,0,.2,1) |
| trigger hover / open | bg #f1f0ec; chevron rotate 180deg (transition 500ms cubic-bezier(.4,0,.2,1)) |
| chevron | FontAwesome chevron-down, 12x12, currentColor (`ChevronDownIcon`) |
| CTA group | flex; justify-end; items-center; gap 8px; fills remaining width |
| CTA "Get started" | height 40 -> 42.667 -> 48px; padding-x 12 -> 13.333 -> 16px; font 14 -> 14.667 -> 16px / 500; bg #4570ff -> hover #3658c9; radius 9999; transition all 150ms |
| Login | height 40 -> 42.667 -> 48px; padding-x 18 -> 20 -> 24px; font same; bg #f1f0ec -> hover #e2ded6 |
| focus-visible (all) | ring 2px #4570ff + 2px white offset (`0 0 0 2px #fff, 0 0 0 4px #4570ff`) |

Positions @1440: pill x 64..1376, y 53..133; logo x 88; first nav label x 190; CTA x 1107..1269 (h 42.7, y 71.7);
Login x 1277..1352.

### Desktop panels (shared)
| Element | Styles |
| --- | --- |
| panel wrapper | absolute; top 100% of header (y 133 @1440); left/right 0 (header width); padding 10px 64px 0; opacity 0 -> 1 (200ms cubic-bezier(.4,0,.2,1)); closed = visibility hidden immediately + pointer-events none |
| card | bg #fff; radius 40px; overflow hidden; shadow 0 4px 15px 0 rgba(0,0,0,.10); padding 20px 16px + bottom 70px (Platform/Resources) / 64px (Built for); width = header width - 128px (1184 @1440) |
| title h2 | "Universal Sans Display" (-> Geist) 28px / 500 / line-height 1.15 (32.2px); centered; margin-bottom 20px |
| enterprise bar | absolute; left/right/bottom 0 of card; height 45px (visible part); bg #4570ff; padding-top 10px; link white 16px/24px 500 centered; hover underline |
| link rows (hover) | bg #f1f0ec + "→" (18px, line-height 1) at the right edge (opacity 0 -> 1, no transition) |

**Platform** (card height 406 @1440): h2, 40px gap, 5-column grid (`gap 14px 24px`, 211px columns @1440).
- Column head card: flex-col items-center justify-center; gap 4px; padding 16px 12px 20px; radius 10px;
  shadow 0 1px 5px rgba(0,0,0,.1); margin-bottom 6px; bg per column #f1f0ec, #ebdcff, #00feb2, #c6ff94, #d6e0ff;
  hover bg #fff. Title Nanum Pen Script 28px / line-height 28px / tracking -0.84px. Text 14px/20px 500 centered.
- Below the card: padding-top 10px, then link rows: height 40px, padding 6px 10px, gap 10px, radius 10px,
  icon 28x28, label 14px/20px 500.

**Built for** (card height 506 @1440): h2, 20px gap, 12-col grid, items span 4 (3 per row), `gap 14px 24px`.
- Item: flex items-start; gap 16px; padding 6px 10px; radius 10px; icon 36x36; text flex-col gap 10px;
  h3 20px / line-height 20px / 500; p 14px/20px 500. Hover bg #f1f0ec + arrow.

**Resources** (card height 618 @1440): 12-col grid `gap 14px 24px`; h2 spans all columns (20px margin + 14px gap).
- Left (span 8): 2-col grid `gap 14px 24px`.
  - Small item: padding 6px 10px; flex items-start gap 16px; radius 10px; icon 36x36 (object-contain);
    text gap 10px; h3 20px/28px 500; p 14px/16px 500. Hover bg #f1f0ec + arrow.
  - Colored cards (last row): padding 20px; radius 16px; shadow 0 1px 5px rgba(0,0,0,.1); bg #d6e0ff and #c6ff94;
    icon 56x56 + 8px margin; h3 20px/28px 500; p 14px/16px 500; hover bg #fff.
- Right (span 4): featured card, padding 8px 4px 0; flex-col gap 16px, full height.
  - Image box flex-1, min-height 200px, bg #000, radius 16px, img absolute object-cover.
  - Text block gap 12px: tag pill (bg #ebdcff, 14px/20px Inter Tight 400, padding 4px 12px, radius 9999);
    h3 20px/28px 500; description 14px/20px Inter Tight 400; link 14px/20px 500 + 12px arrow, gap 4px;
    card hover -> link underline (offset 3px).

## Computed styles — mobile / tablet (< 1200px)
| Element | Styles |
| --- | --- |
| header (closed) | fixed; top 37px; inset-x 0; max-height 56px; overflow hidden; radius 0 0 20px 20px; shadow 0 1px 2px 0 rgba(0,0,0,.05); transition all 200ms cubic-bezier(.4,0,1,1) |
| header (open) | min-height 100dvh; max-height 100dvh (animates 56px -> 100dvh in 200ms ease-in); z 104; body overflow hidden |
| nav | bg #fff; radius 0 0 16px 16px |
| top row | 2-col grid; each cell padding-block 13.6px (row 65.2px, clipped to 56px) |
| logo | 99x28 at x 16 (content centred ~32.6px below the header top) |
| CTA | 14px/20px 500; padding 4px 16px; height 38px (stretches to the hamburger height); royal; hover royal-dark |
| hamburger | button 38x38, padding 4px, radius 6px, icon 30x30 (radix hamburger / cross when open); pr 24px; gap 12px to CTA |
| list (open) | flex-col; gap 8px; max-height calc(100dvh - 93px); overflow-y auto; hidden (visibility) when closed |
| row (button/link) | padding 20px 24px 20px 16px; height 80px; bg #fff; hover/open bg #f1f0ec (150ms); left: 40x40 icon + gap 10px + label 20px/1 500 tracking -0.2px; right: thin chevron 22x22 rotating 180deg (500ms) |
| CTA block | margin 40px 0 144px; padding 0 40px; flex-col gap 8px; buttons full width, 48px, 16px/24px 500 |
| bottom bar (open only) | fixed bottom 0; z 105; bg #000; padding 10px 0; text 16px/24px 500 white centered on two lines; link span #00feb2 |

Accordion panels (open instantly, `max-height: fit-content`, chevron rotates):
- Platform: padding 0 16px; inner padding 5px 0 40px 10px. Group header link: padding 10px; radius 4px;
  border-bottom 1px #f1f0ec; bg = column colour; 18px / line-height 1 / 500 / tracking -0.18px. Sub-links: list
  gap 5px, rows padding 5px 0, icon 30x30, gap 10px, label 16px/24px 400.
- Built for: padding 0 16px; list padding-bottom 40px; cards 44px tall: padding 10px 20px, gap 10px, bg #fff,
  radius 16px, shadow 0 1px 5px rgba(0,0,0,.1), hover #f1f0ec; icon 22x22; label 16px/24px 400.
- Resources: padding 0 16px; rows padding 20px 0 (radius 16px, hover #f1f0ec); link padding-left 16px;
  icon 60x60; h3 20px/28px 500; p 14px/16px 500 (padding-right 40px). Colored cards first (icon above text),
  then small items (icon left, gap 16px), then the featured card (square image radius 16px, 10px tag pill,
  h3 20px/28px, "Learn more" 14px 500 + arrow), list padding-bottom 40px.

## States & behaviours (before -> after, timing)
| Trigger | Before | After | Transition |
| --- | --- | --- | --- |
| Hover desktop trigger | panel opacity 0, hidden; trigger bg transparent, chevron 0deg | panel visible, opacity 1; trigger bg #f1f0ec; chevron 180deg; header z 104 | opacity 200ms cubic-bezier(.4,0,.2,1); chevron 500ms; bg 150ms |
| Leave header / hover logo, plain link, CTA area | panel open | hidden immediately | none (visibility flips at once) |
| Hover Pricing / Integrations | bg transparent | bg #f1f0ec | 150ms |
| Hover CTA | #4570ff | #3658c9 | 150ms |
| Hover Login | #f1f0ec | #e2ded6 | 150ms |
| Hover panel link / item | bg transparent, arrow opacity 0 | bg #f1f0ec, arrow opacity 1 | none |
| Hover Platform column card / Resources colored card | bg colour | bg #fff | none |
| Hover featured card | link no underline | underline | none |
| Hover enterprise bar link | no underline | underline | none |
| Click hamburger (< 1200) | max-h 56px, list hidden | max-h 100dvh, list visible, icon -> X, bottom bar shown, body scroll locked | 200ms ease-in |
| Close menu | open | list hidden immediately, height 100dvh -> 56px | 200ms ease-in |
| Click accordion row | collapsed | expanded (instant), row bg #f1f0ec, chevron 180deg; other rows collapse | chevron 500ms, bg 150ms |
| Scroll | — | no change at any position | — |

## Aeon content mapping
| 7shifts | Aeon |
| --- | --- |
| 7shifts wordmark (99x28 mobile, 64-80px desktop) | `<AeonLogo/>` at the same height (28px mobile, 18-22.6px desktop) |
| Platform ▾ | Platform ▾ — title "Run the whole loop in one place"; columns Track / Verify / Fix / Review / Audit with the five product descriptions; 3 links per column (product + two features from the copy deck), all `#platform`. Link labels must fit the 127px label slot at 1440 (column 211px − padding − 28px icon − arrow), so "AI visibility tracking" -> "Visibility tracking" and "Technical SEO audit" -> "Technical SEO" (the column title supplies the verb) |
| Pricing | Pricing (`/pricing`) |
| Built for ▾ | Built for ▾ — title "Built for every team that touches the brand"; Brand & digital marketing, Medical affairs, Regulatory & MLR reviewers, Agencies, Rx, OTC & biotech brands (`#personas`) with persona one-liners |
| Integrations | Aeon Index (`/aeon-index`) |
| Resources ▾ | Research ▾ — Research hub, AEO for pharma, Methodology, The Aeon Index (small items); GEO for pharma: the guide (periwinkle card); Free AI visibility report (lime card, `/start`); featured "The GEO Playbook 2026" / "Download free" with `/images/covers/playbook.webp` (`#resources`) |
| "Need enterprise assistance? Contact our sales team…" | "Running a whole portfolio? Book a walkthrough with our team." (`/contact`) |
| Get started, it's free! / Login | Start your free report (`/start`) / Sign in (`/login`) |

## Assets
- Doodles (`/images/doodles/*.png`, 240x240) stand in for 7shifts' illustrated icons (mobile nav 40px, Built for 36px,
  Research 36/56/60px).
- Platform link icons: lucide-react line icons (stroke 1.5) in a 28px (desktop) / 30px (mobile) box, matching
  7shifts' thin black line icons.
- Cover: `/images/covers/playbook.webp` (featured card).
- Icons from `@/components/icons`: `ChevronDownIcon`, `ChevronDownThinIcon`, `MenuIcon`; local `CloseIcon`
  (radix cross, 15-grid, same stroke weight as `MenuIcon`) and `ArrowSmallIcon` (FA arrow-right 12px).

## Responsive behaviour
| Width | Layout |
| --- | --- |
| 1920 | pill 64..1856; nav 16px, padding 10px; buttons 48px/16px |
| 1440 | pill 1312x80 at (64,53); nav 14.667px; buttons 42.667px |
| 1200 | pill 1072x80; nav 14px; buttons 40px; logo 64px wide (7shifts) |
| 1199 -> 768 -> 390 | full-width 56px bar with radius-b 20px; logo left, CTA + hamburger right; hamburger opens the full-height menu |
| < 375 | Aeon-only guard: the header CTA label is longer than 7shifts', so below 375px the bar's CTA reads "Free report" (104px; logo gap 25px at 320, 65px at 360). Complementary `max-[375px]` / `min-[375px]` variants guarantee exactly one label. The in-menu CTA keeps the full label. scrollWidth equals the viewport at 320/360/374/375/390/768, menu closed, open and with each accordion open |

## Notes on 7shifts A/B variants (Coframe)
7shifts serves Coframe experiments that change per session (`cf-*` classes and injected CSS).
- Always present on desktop in every session we captured (and in the orchestrator reference): the fluid pill sizing,
  the panel titles (`.cf-dropdown-title`), the 12-column panel grids, row arrows and white hover on cards. Reproduced.
- Session-dependent, **not** reproduced: the spinning orange "glow" ring around the CTA (`.cf-cta-glow-wrapper`,
  4s spin/blink/sweep loop; absent from the orchestrator's reference, whose CTA sits at x 1107), and the compact mobile
  variant (64px rows, royal-blue bottom bar, CTA hidden inside the menu). The base mobile design above is used.
