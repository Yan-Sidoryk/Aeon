# Backend progress

Last updated: Sep 26, 2026

Backend for the website-in onboarding flow in `user-journey-pharma-onboarding.md` (hackathon MVP). The code is in `backend/`; run instructions and the API contract are in `backend/README.md`.

## Status at a glance

| Area | Status | Tested |
|---|---|---|
| Discovery (website → company + products + FDA labels) | Done | Live on incyte.com |
| Setup (competitors + 40 questions) | Done | Live (Jakafi, Opzelura, Zynyz) |
| Scan: Claude engine | Done | Live, 40/40 answers, no errors |
| Scan: ChatGPT, Gemini, Perplexity, AI Overviews | Built, off until keys are added | Not tested (no keys) |
| Report (score, accuracy, lost questions, sources, fixes) | Done | Live + unit tests |
| "Fix this" draft + AI pre-MLR review | Done | Live (3 drafts) |
| Demo mode (recorded run, instant replay) | Done | Automated test + real HTTP |
| Save gate (work email) | Done, email only | Automated test |
| Frontend | Not started (separate team) | — |
| Committed to git | No | — |

## Decisions

- **Scope:** hackathon MVP only, the onboarding flow from the user-journey doc. Out of scope: SEO audit, backlinks, Veeva export, weekly re-scans, billing, teams, EU labels.
- **Stack:** Python, FastAPI, SQLite and in-process background tasks, with no queue or Redis. Live progress streams to the frontend as server-sent events (SSE).
- **Frontend:** built by a separate team against the API contract in `backend/README.md` and the auto-generated docs at `/docs`.
- **AI engines:** Claude runs live. The other four are wired and switch on when their keys are added to `.env`.
- **Models:** Haiku 4.5 for bulk extraction and parsing; Opus 5 for competitors, accuracy checks, drafts and pre-MLR review. Effort levels are set per step in `app/config.py`.
- **Sessions:** anonymous first. The browser sends a session ID, and an email is attached only at the save step.

## What we did, step by step

### 1. Planning
- Read the PRD and the user-journey doc, asked questions on scope, stack, services and timeline, and wrote the plan.

### 2. First build (no keys available)
- Built the whole backend: data model, API endpoints, SSE progress streams, openFDA client, Firecrawl crawl, discovery, setup, scan, report, fix drafts, pre-MLR rules, demo mode and a record script.
- 8 automated tests, including a full run through every endpoint in demo mode.
- Checked openFDA live and the homepage-only crawl fallback.

### 3. First live run (Anthropic + Firecrawl keys)

Problems found live, and how each was fixed:

| Problem | Fix |
|---|---|
| Every Claude call failed: the installed Brotli 1.1 was too old for the SDK's HTTP layer | Upgraded Brotli and pinned `brotli>=1.2` |
| Crawling took 26s and read mostly investor, careers and YouTube pages | Firecrawl map (URL list in 1s), rank product-like pages, batch scrape, follow brand sites like jakafi.com. Now ~11s |
| Firecrawl free plan allows ~20 requests/min; the crawl used ~18 | Batch scrape (6–10 requests per onboarding) plus retry on rate limits |
| Olumiant (Eli Lilly) became the hero drug | Products labeled by another company are marked `partner`: unticked, never the hero |
| Niktimvo and Zynyz missing: openFDA leaves their metadata blank | Extra search for unindexed labels; brand and molecule read from the label text |
| Pipeline list duplicated approved molecules (tafasitamab = Monjuvi) | Pipeline names matched against approved molecules |
| Opzelura listed as a Jakafi competitor | The company's own products are excluded |
| Haiku invented competitors ("Vondelesnib") | Opus picks competitors; each one is verified against openFDA |
| All competitors showed 0% mentions | Fixed name matching ("Eucrisa (crisaborole)" → Eucrisa) |
| Headline visibility was 98%: most questions name the drug | Headline now scores unbranded questions only; the all-questions score is kept separately |
| Claude cited sources for only 1 of 13 unbranded answers | Engine tells Claude to search for health questions (now 13/13) |
| Answers took up to 150s each | Opus at low effort for answers, 16 in parallel. A full scan now takes ~2m 50s |
| Drafts were cut off at the output limit | Length limits in the draft prompt; clear error when output is incomplete |
| Pre-MLR blocked valid label quotes that used "…" | Quotes are split on ellipses and each part is checked |
| "Weight gain in 7%… placebo-controlled study" flagged as efficacy | Any study reference now counts as a qualifier |
| Drafts took ~3 min | Medium effort (~1 min), and "Fix this" is now a background job with live progress |

### 4. Demo recording
- Recorded a full live run for incyte.com with **Opzelura** as the hero drug, saved in `backend/fixtures/demo/bundle.json`.
- Opzelura was chosen over the auto-picked Jakafi, which is the standard of care (80% unbranded visibility) and tells no competitive story.
- Checked the demo over real HTTP: discovery replays in 3s, scan in 5s, and the report and draft return instantly.

## What the recorded demo shows

- **Headline:** Opzelura 69 vs Protopic 62 on unbranded questions (13 answers, 95% interval 42–87).
- **Accuracy:** AI answers say Opzelura is approved from age 12; the label says age 2. Also wrong dosing limits for children and vitiligo, and a tube size that doesn't exist.
- **Lost questions:** e.g. "My daughter's eczema gets worse in winter…", where AI recommends Elidel and Protopic but not Opzelura.
- **Sources behind competitor answers:** PMC, Dermatology Advisor, Dermatology Times.
- **Fixes:** 3 label-grounded drafts. Pre-MLR risk: 51 (high), 9 (low), 13 (low). None blocked.

## Live performance (incyte.com, Claude engine only)

| Step | Time |
|---|---|
| Discovery | ~22s (the journey doc targets under 20s) |
| Setup | ~15s |
| Scan, 40 questions | ~2m 50s (the journey doc targets 2–3 min) |
| Fix draft + pre-MLR | ~1 min |

## Tests

- 13 automated tests (`pytest` in `backend/`), no keys or network needed:
  - Full API flow in demo mode, including the background "Fix this" job.
  - openFDA label parsing, including labels without openFDA metadata.
  - Crawl page ranking and brand-site detection.
  - Pre-MLR rules: bad copy, clean copy, study numbers, quotes with "…".
  - Report numbers, confidence interval, competitor name matching.
- Manual live runs: discovery, setup, scan, report and drafts on incyte.com. Demo mode over real HTTP with curl.

## What is left

- **Other AI engines:** ChatGPT, Gemini, Perplexity and Google AI Overviews are written but untested. They need their API keys.
- **Accuracy check tuning:** 22 of 40 answers were flagged. The flags sampled were real label mismatches, but some count omissions (e.g. not mentioning the boxed warning). Needs a medical-affairs review before showing clients.
- **Discovery speed:** ~22s against the under-20s target. The crawl is the slow part.
- **Save gate:** stores the email only. No password, Google/Microsoft sign-in or email verification.
- **Limits for anonymous users:** the journey doc asks to cap anonymous scans. Not built.
- **Server restarts:** progress streams live in memory, so a restart loses in-flight jobs. The results are in the database and can still be fetched.
- **"Which of these are you?":** the backend returns `labeler_candidates` when a website maps to several FDA labelers. The frontend needs to ask the question, and there is no endpoint yet to pick one.
- **"Email me when ready"** during the scan: not built.
- **Role question on the report** ("What's your role?"), which changes what the report leads with: not built.
- **"Add your other products"** after the first report (background scans for the rest of the portfolio): not built.
- **Deployment:** runs locally only.

## What is next

1. **Commit** the backend to git, with the demo recording.
2. **Hand off to the frontend team:** `backend/README.md` and `/docs` hold the contract. Main flow: onboarding → portfolio → hero → setup → scan → report → "Fix this" → save.
3. **Add the other engine keys** when available, run `record_demo --company <id>` again, and check each engine's answers and citations.
4. **Review accuracy flags** with someone from medical affairs and tighten the check prompt.
5. **Build the smaller missing pieces** above: anonymous limits, labeler choice, role question, "Add your other products".
6. **Deploy** somewhere the frontend team and demo audience can reach, with `DEMO_MODE=1` as the fallback if the network is unreliable.
