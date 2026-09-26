# Aeon

Aeon shows pharma brands how ChatGPT, Claude, Gemini and Perplexity talk about their drugs, checks every answer
against the label, and turns the gaps into MLR-ready fixes.

This repo holds the marketing site, with the product frontend to follow. Product thinking lives in
[`docs/PRD.md`](docs/PRD.md) and [`docs/user-journey-pharma-onboarding.md`](docs/user-journey-pharma-onboarding.md).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run check      # lint + typecheck + production build
```

Requires Node 24 (see `.nvmrc`). Set `NEXT_PUBLIC_SITE_URL` (e.g. `https://aeon.example`) in production so the
share image resolves to the live domain; on Vercel it falls back to the deployment URL.

## Stack

Next.js 16 (App Router, React 19), TypeScript strict, Tailwind CSS v4 and shadcn/ui primitives. Fonts come from
`next/font/google`: Geist for headings, Inter Tight for body text and Nanum Pen Script for handwritten accents.

## How the marketing site was made

- **Design:** layout, spacing, type scale, palette and interactions follow https://www.7shifts.com/, reproduced
  section by section with the `/clone-website` workflow. Research, screenshots and per-component specs are in
  [`docs/research/`](docs/research/) and [`docs/design-references/`](docs/design-references/).
- **Messaging:** adapted from https://pharma-geo.com/ and the PRD. The full copy deck is
  [`docs/research/AEON_CONTENT.md`](docs/research/AEON_CONTENT.md).
- **Visual assets:** the logo, photos, doodle icons, resource covers and hero video were generated with Higgsfield.
  Raw vector sources are in `assets-src/`; `node scripts/optimize-assets.mjs` turns them into the web versions in
  `public/`.

## Project structure

```
src/app/                 page, layout, global tokens (globals.css), favicon
src/components/          one file per page section, plus section helpers in sub-folders
src/components/ui/       shared primitives (PillButton, shadcn button)
src/components/icons.tsx icons extracted from the reference site
public/images/           photos, doodles, covers (web-ready)
public/videos/           hero loop + poster
assets-src/              raw Higgsfield vector outputs
docs/                    PRD, user journey, research and component specs
```

## Content rules

Aeon does not show customers, testimonials, ratings or results it does not have. Third-party statistics always
show their source, and numbers inside product UI mocks are illustrative.

## Credits

Scaffolded from the [AI Website Cloner Template](https://github.com/JCodesMore/ai-website-cloner-template)
(MIT, see `third_party/`).
