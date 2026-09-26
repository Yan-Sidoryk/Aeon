# Aeon

Aeon shows pharma brands how ChatGPT, Claude, Gemini and Perplexity talk about their drugs, checks every answer
against the label, and turns the gaps into MLR-ready fixes.

This repo holds the marketing site (`/`), the product (onboarding at `/start`, the shareable report at
`/report/[id]`, the dashboard at `/app`) and its FastAPI backend (`backend/`). Product thinking lives in
[`docs/PRD.md`](docs/PRD.md) and [`docs/user-journey-pharma-onboarding.md`](docs/user-journey-pharma-onboarding.md);
the API contract is [`docs/architecture.md`](docs/architecture.md).

## Run it on your machine

Needs Node 24 (`.nvmrc`) and Python 3.11+.

```bash
npm install
npm run setup:api                 # backend/.venv with the backend installed
cp .env.example .env.local        # frontend: points at the API on localhost:8000
```

Then start the API in one of two modes, and the frontend in a second terminal:

| Mode | API | What you get | Keys |
|---|---|---|---|
| **Demo** | `npm run dev:api:demo` | Every website replays one recorded live run (incyte.com); a banner says so. Free. | none |
| **Live** | `npm run dev:api` | A real analysis of any US pharma website: its products and FDA labels, 10 questions asked on Claude, Google AI Overviews and AI Mode, every answer checked against the label. | `backend/.env` |

```bash
npm run dev                       # http://localhost:3000/start
```

For live mode, `cp backend/.env.example backend/.env` and set `ANTHROPIC_API_KEY`, `DATAFORSEO_LOGIN` and
`DATAFORSEO_PASSWORD` (`APIFY_TOKEN` only for promo research). Leave the Supabase and `DATABASE_URL` lines empty:
the API keeps its data in `backend/aeon.db` and every browser is its own account. A full live report costs about
$3 (Sonnet 5); the API stops starting new runs once a day's spend reaches `DAILY_SPEND_CAP_USD` (default $10).
Anything that isn't a real website is refused before anything runs.

Checks before a pull request:

```bash
npm run test:api                  # backend tests, no keys or network
npm run check                     # lint + typecheck + production build
```

Set `NEXT_PUBLIC_SITE_URL` (e.g. `https://aeon.example`) in production so the share image resolves to the live
domain; on Vercel it falls back to the deployment URL.

## Branches and pull requests

`main` is what runs in production and what anyone should be able to clone and run. Work happens on a short-lived
branch off `main` (`feat/…`, `fix/…`, `docs/…`), one topic per branch, merged through a pull request once
`npm run test:api` and `npm run check` pass. Rebase on `main` before asking for review; never push to `main` directly.

## Stack

Next.js 16 (App Router, React 19), TypeScript strict, Tailwind CSS v4 and shadcn/ui primitives. Fonts come from
`next/font/google`: Geist for headings, Inter Tight for body text and Nanum Pen Script for handwritten accents.

## How the marketing site was made

- **Design:** layout, spacing, type scale, palette and interactions follow https://www.7shifts.com/, reproduced
  section by section with the `/clone-website` workflow. Research, screenshots and per-component specs are in
  [`docs/research/`](docs/research/) and [`docs/design-references/`](docs/design-references/).
- **Messaging:** adapted from https://pharma-geo.com/ and the PRD. The full copy deck is
  [`docs/research/AEON_CONTENT.md`](docs/research/AEON_CONTENT.md).
- **Visual direction:** product-led. The hero and feature sections show the product UI (built in HTML/CSS), and
  third-party AI engines and tools appear with their real logos (`src/components/brand-logos.tsx`, sources in
  `third_party/LOGOS.md`). No stock people photos or photo backgrounds.
- **Visual assets:** the Aeon logo, doodle icons and the "old way" desk photo were generated with Higgsfield. Raw
  vector sources are in `assets-src/`; `node scripts/optimize-assets.mjs` turns them into the web versions in
  `public/`.

## Project structure

```
src/app/                 page, layout, global tokens (globals.css), favicon
src/components/          one file per page section, plus section helpers in sub-folders
src/components/ui/       shared primitives (PillButton, shadcn button)
src/components/icons.tsx icons extracted from the reference site
public/images/           doodles and the one remaining photo (web-ready)
public/logos/            AI engine and tool logos (colour, mono, wordmark)
assets-src/              raw Higgsfield vector outputs
docs/                    PRD, user journey, research and component specs
```

## Content rules

Aeon does not show customers, testimonials, ratings or results it does not have. Third-party statistics always
show their source, and numbers inside product UI mocks are illustrative.

## Credits

Scaffolded from the [AI Website Cloner Template](https://github.com/JCodesMore/ai-website-cloner-template)
(MIT, see `third_party/`).
