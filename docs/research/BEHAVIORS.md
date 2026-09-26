# 7shifts behaviors (reference for the Aeon build)

Captured from https://www.7shifts.com/ with Chrome DevTools at 1440×900 and 390×844. Per-section details
(exact timings, before/after values) live in each `docs/research/components/*.spec.md`.

## Global
- Native scrolling; no Lenis / Locomotive (no `.lenis` class, no scroll container).
- Announcement bar and header are `position: fixed` for the whole page; the header does not collapse on scroll at desktop.
- A fixed full-bleed photo (`div.fixed.inset-0.-z-20`) sits behind all content and is only revealed through the
  transparent integrations section, which creates a "window" effect between rounded, overlapping sheets.
- Sections overlap with negative margins (−60px / −40px / −20px) and rounded corners (40px, 20px) plus z-index steps.

## Header (hover / click)
- Dropdown menus under Platform, Built for and Resources; right-hand CTA pills with 150ms color transitions.
- ≤ 1279px: header becomes a full-width bar (`max-xl:max-h-14`) with CTA + hamburger; the menu expands by animating max-height.

## Hero (time)
- Autoplaying, muted, looping video (1120×630) with UI overlays baked into the footage.
- Customer logo row: hover shows a small "Read their story" tooltip. On mobile the row is replaced by a text line.

## Platform (scroll-driven)
- Tab bar is `position: sticky; top: 140px`; five cards are `position: sticky; top: 220px`, height 520px, so each new
  card slides over the previous one.
- The active tab follows the scroll position; an orange bar under the tabs grows from the first tab to the active one
  and the passed tabs reveal a 22px icon. Tab bar hidden below 768px; cards stack normally there.
- Card 1's left panel is an animated HTML mock (moving cursor, toggles).

## Integrations (time)
- Glass card over the fixed photo; two columns of white logo tiles scroll vertically in an infinite loop.

## Social proof (time + hover)
- Tilted polaroid with a doodle sticker; stats in orange; four photo story cards with hover treatment.
- Lime band of handwritten categories + doodles scrolling horizontally (marquee).

## Get running (static)
- Timeline pills over a line with dots; three pastel cards with check lists.

## FAQ (click)
- Accordion rows with a plus icon; see `FaqSection.spec.md` for open/close animation.

## Final CTA (time)
- Royal-blue panel; right column of white rating cards scrolling vertically (marquee), clipped by the panel.

## Resources / footer (hover)
- Resource cards with pastel tag pills; footer link columns, "Ask AI for a summary" assistant buttons, black legal bar.
