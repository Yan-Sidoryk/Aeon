# Page topology (reference: https://www.7shifts.com/, desktop 1440px)

Document height ≈ 11,476px. Tailwind site (Next.js). No smooth-scroll library (no Lenis/Locomotive), native scroll.

## Fixed / overlay layers
| Layer | 7shifts element | Notes |
| --- | --- | --- |
| Announcement bar | black bar, 37px tall, fixed top, full width | "New:" badge in lime `#C6FF94` (font-hand), white text, thin arrow |
| Header | `header.fixed` pill, top ≈53px, inset 64px each side at 1440, 80px tall, white, radius 9999px, soft shadow | Stays fixed for the whole page. Mobile: collapses to max-h-14 bar with hamburger, expands for menu |
| Page background photo | `div.fixed.inset-0.-z-20` with a full-bleed `<img object-cover>` | Only visible through the gap at the integrations section. Aeon uses `/images/photos/pharmacy-night.webp` |

## Flow content (inside `div.pt-[37px]` > `.traffic-warden-root.relative.z-10`)
Sections overlap with negative margins + rounded corners + z-index, producing the "stacked sheets" look.

| # | Aeon component | 7shifts wrapper classes (exact) | y / height @1440 | Interaction model |
| --- | --- | --- | --- | --- |
| 1 | `Hero` (+ engine strip) | `bg-white rounded-b-[40px] z-50 relative` | 37 / 1370 | video autoplay loop; logo hover tooltips |
| 2 | `PlatformSection` | `relative bg-[#F1F0EC] pt-[100px] pb-[120px] -mt-[60px] px-[20px] xl:px-[60px] md:text-pretty z-10 md:pt-[140px]` | 1347 / 3499 | **scroll-driven**: sticky tab bar (top 140px) + sticky stacking cards (top 220px); active tab + orange progress bar follow scroll; tab click scrolls to card |
| 3 | `WhySection` | `bg-white pt-[40px] pb-[80px] px-[20px] md:px-[40px] -mt-[60px] rounded-[40px] relative z-50 md:pt-[80px]` | 4786 / 1251 | static (+ in-view reveal) |
| 4 | `CoverageSection` | `section.py-10.xl:py-16.px-5.flex.flex-row.relative.md:!px-20.pt-[76px].xl:pt-[100px].pb-[76px].xl:pb-[100px]` (transparent bg → fixed photo shows) | 6037 / 708 | time-driven vertical marquee of tiles |
| 5 | `SocialProofSection` | `section.bg-black.text-white.rounded-[20px].pb-[40px].relative.z-20` | 6745 / 1376 | cards hover; time-driven lime marquee |
| 6 | `GetStartedSection` | `bg-white relative z-10 -my-[60px] py-[60px]` | 8061 / 772 | static |
| 7 | `FaqSection` (`#faqs`) | `section.flex.relative.justify-center.px-5.bg-[#F1F0EC].rounded-t-[40px].z-50` | 8772 / 874 | click accordion |
| 8 | `FinalCtaSection` | `relative z-50 rounded-[40px] -my-[40px]` (royal blue panel inside) | 9606 / 440 | time-driven vertical marquee of stat cards |
| 9 | `ResourcesSection` | `bg-white px-[20px] pb-[100px] -mb-[100px] pt-[80px] -mt-[20px]` | 10006 / 608 | hover |
| 10 | `SiteFooter` | `footer.bg-[#FBFAF8].relative.z-50.rounded-t-[40px]` + black bottom bar | 10514 / 963 | hover |

## Assembly (src/app/page.tsx)
```
<AnnouncementBar />            fixed, z-[60]
<SiteHeader />                 fixed, z-[55]
<div className="pt-[37px]">
  <div className="fixed inset-0 -z-20"> pharmacy-night photo, object-cover </div>
  <main className="relative z-10"> Hero, PlatformSection, WhySection, CoverageSection, SocialProofSection,
                                     GetStartedSection, FaqSection, FinalCtaSection, ResourcesSection </main>
  <SiteFooter />
</div>
```
