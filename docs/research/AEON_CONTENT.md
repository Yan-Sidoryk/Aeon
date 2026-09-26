# Aeon marketing site: copy deck

Layout and interactions follow https://www.7shifts.com/ section by section. Messaging comes from
https://pharma-geo.com/ (see `docs/research/pharma-geo/home-text.md`), rewritten for Aeon and filled in
from `docs/PRD.md` and `docs/user-journey-pharma-onboarding.md` where 7shifts has a slot pharma-geo does not.

Rules for all copy on the page:
- Aeon never claims customers, reviews, ratings or results it does not have. No testimonials, no star ratings.
- Third-party statistics always show their source.
- Any number inside a product UI mock is illustrative UI, not a claim.
- Primary CTA everywhere: **Start your free report**. Secondary: **Book a walkthrough**. Sign-in link: **Sign in**.
- Visual direction (user feedback, 2026-09-26): product-led. Illustrate with the product UI and real logos of the
  AI engines and tools we name (`src/components/brand-logos.tsx`), never stock people photos or photo backgrounds.

---

## 1. Announcement bar (7shifts: black "New:" bar)
- Badge: `New:`
- Text: `AI pre-MLR review is now in Aeon. Drafts arrive claim-referenced and approval-ready.`
- Link: `#platform`

## 2. Header (7shifts: floating white pill nav)
- Logo: `AeonLogo` (links to `/`)
- Nav:
  - **Platform** ▾
    - AI visibility tracking: "Share of voice across ChatGPT, Claude, Gemini and Perplexity"
    - Accuracy vs. label: "Catch answers that contradict your prescribing information"
    - Content fixes: "Label-grounded drafts that win lost prompts"
    - AI pre-MLR review: "Approval-ready before a human opens the draft"
    - Technical SEO audit: "Pharma checks for ISI, PDFs, HCP gates and schema"
  - **Pricing** (link)
  - **Built for** ▾
    - Brand & digital marketing
    - Medical affairs
    - Regulatory & MLR reviewers
    - Agencies
    - Rx, OTC & biotech brands
  - **Aeon Index** (link)
  - (Research ▾ removed with the resources section; bring both back together.)
- Right: `Start your free report` (royal blue pill; `Free report` below 375px), `Sign in` (sand pill)
- Mega-menu panels (7shifts panel anatomy): titles `Run the whole loop in one place` (Platform) and
  `Built for every team that touches the brand` (Built for);
  Platform cards Track / Verify / Fix / Review / Audit with feature links (Visibility tracking, Prompt libraries,
  Citation map, Accuracy vs. label, Side-by-side view, Safety signals, Content fixes, Recommendations,
  Claims library, AI pre-MLR review, Claim-to-source, Veeva export, Technical SEO, ISI & PDF checks, HCP gate checks);
  bottom bar `Running a whole portfolio? Book a walkthrough with our team.`

## 3. Hero (product-led)
- Eyebrow (handwritten): `More than rank tracking`
- H1: `See how AI actually talks about` / `your pharma brand` (orange hand-drawn underline under "your pharma brand")
- Sub: `Audit how ChatGPT, Claude, Gemini and Perplexity answer about your brand, by indication, market and audience.`
- CTA (onboarding screen 1): one field `Your company website` (placeholder `acmepharma.com`) + `Scan my brands`;
  submits GET `/start?website=…`
- Micro: `Free first scan. No credit card required.` · link `or book a walkthrough`
- Media: the Aeon app running a first scan (HTML/CSS, no video or photo) on a periwinkle→lavender panel:
  - Top bar: `Brand A · Atopic dermatitis`, tabs Overview / Prompts / Accuracy (2) / Fixes (3), `Scanning…` → `Scan complete`
  - Counters: `Answers read 200/200`, `Mentions of you 34%`, `Competitor X 71%`, `Accuracy issues 2`
  - Grid: 6 prompts (Patient / Caregiver / HCP) × ChatGPT, Claude, Gemini, Perplexity, AI Overviews (real logos);
    cells `You` / `Comp. X` / `—`, one red `Wrong dose`
  - Report rail: `You 34 · Competitor X 71`, red box `2 answers state the wrong dose` (AI sentence vs FDA label),
    `Top fixes` with `Fix this`
  - All names and numbers are placeholders (`src/components/hero/hero.content.ts`)

## 4. Engine strip (7shifts: customer logo row)
- Label above (small, stone): `Tracking answers across`
- Real logos (muted black, full opacity on hover): Claude, Gemini, Perplexity and Copilot wordmarks; ChatGPT and
  Google AI Overviews as icon + name
- Hover tooltip (7shifts "Read their story"): `How we sample it`

## 5. Platform (7shifts: sticky Hire/Train/Schedule/Pay/Retain stack), anchor `#platform`
- H2: `From website to cross-LLM report in minutes`
- Sub: `Aeon runs the whole loop: find the gaps in AI answers, draft the fix, and make it approval-ready before a reviewer ever opens it.`
- CTA: `Start your free report`
- Tabs + cards (doodle icons in `/images/doodles/`):
  1. **Track** (`doodle-track.png`)
     - Title: `See who AI recommends, and why`
     - Body: `Run the questions patients, caregivers and HCPs actually ask across ChatGPT, Claude, Gemini, Perplexity and Google AI Overviews.`
     - ✓ `Share of voice vs. named competitors` ✓ `Indication-level prompt libraries` ✓ `Citation map of the sources AI trusts`
     - Link: `Explore tracking`
  2. **Verify** (`doodle-verify.png`)
     - Title: `Catch answers that contradict the label`
     - Body: `Every answer is checked against your prescribing information for dose, indication, boxed warning and contraindications.`
     - ✓ `Accuracy score next to share of voice` ✓ `AI sentence and label sentence, side by side` ✓ `Off-label and safety signals routed, not stored`
     - Link: `Explore accuracy checks`
  3. **Fix** (`doodle-fix.png`)
     - Title: `Draft label-grounded content that wins`
     - Body: `For every lost prompt, Aeon shows which page should win it and drafts what is missing, with every claim linked to an approved source.`
     - ✓ `Direct-answer blocks, FAQs and schema` ✓ `Claims pulled from your approved library` ✓ `Unreferenced claims blocked, not flagged`
     - Link: `Explore content fixes`
  4. **Review** (`doodle-review.png`)
     - Title: `Arrive at MLR approval-ready`
     - Body: `AI pre-review checks claims, fair balance, ISI and banned language before a human sees the draft. Reviewers review and sign off.`
     - ✓ `Claim-to-source table and risk score` ✓ `Export to Veeva PromoMats` ✓ `Named sign-off with a full audit trail`
     - Link: `Explore pre-MLR review`
  5. **Measure** (`doodle-measure.png`)
     - Title: `Prove the lift on every fix`
     - Body: `Weekly re-scans show how AI answers change after a fix goes live, with sample size and confidence on every score.`
     - ✓ `Before and after on the prompts you fixed` ✓ `Monday email on what changed in AI answers` ✓ `A methodology your MLR team can read`
     - Link: `Explore reporting`

## 6. Why Aeon (7shifts: "Why connected work wins" old way vs. new way)
- H2: `Built for pharma. Not retrofitted for it.`
- Sub: `Generic GEO tools track consumer brands. Pharma needs indication-level analysis, label accuracy and MLR-ready output.`
- Left card (sand): eyebrow `Generic GEO tools` · title `Consumer playbooks, compliance headaches`
  - ✗ `No indication or label context` ✗ `Content your MLR team can't approve` ✗ `No route for adverse-event signals`
  - Image: `/images/photos/old-way-desk.webp` + floating notification chips: `Prescribing_Info_v7_FINAL.pdf`, `MLR round 3: 41 comments`, `Is this claim on-label?`
- Right card (black): eyebrow `With Aeon` · title `Pharma-native and approval-ready`
  - ✓ `Indication-level competitive landscape` ✓ `Every claim linked to the label` ✓ `Safety signals routed to your PV inbox`
  - Visual: Aeon app dashboard mock on royal-blue panel (sidebar: Overview, Prompts, Accuracy, Drafts, Reviews; main: "Share of voice" chart for a brand)

## 7. Coverage (7shifts: "Works with the tools you already love" card)
- No photo: white card on a full-bleed sand band.
- H2: `Tracks every engine your audience asks`
- Chips: `General LLMs` `Clinical LLMs` `AI search` `Label data` `MLR workflow` `SEO data`
- Scrolling tiles (real logos + name): General LLMs: ChatGPT, Claude, Gemini, Copilot, Meta AI, Grok, Mistral, DeepSeek ·
  Clinical LLMs: OpenEvidence · AI search: Perplexity, Google AI Overviews, Google AI Mode · Label data: DailyMed, openFDA ·
  MLR workflow: Veeva PromoMats · SEO data: Semrush, Ahrefs, Search Console (OpenEvidence, DailyMed, openFDA, Veeva and
  Ahrefs have no open logo and show a monogram)
- CTA: `See coverage`

## 8. Social proof (7shifts: polaroid, stats, stories, marquee — rebuilt light and product-led)
- White sheet over the sand coverage band (no black background, no people photos).
- AI answer stack (replaces the polaroid): tilted answer cards from ChatGPT, Perplexity and Gemini for
  "What's the best treatment for moderate eczema in adults?" — Competitor X ranked #1, [Brand] #2, "Sources: 4";
  doodle `doodle-phone.png` sticker.
- H2: `HCPs and patients are` / `[asking AI] first` ("asking AI" handwritten in orange #E85D04 for contrast on white)
- Stats (orange numbers):
  - `2 in 3`: `US HCPs use AI tools daily` · source `American Medical Association, 2025`
  - `1 in 5`: `HCPs use GenAI for diagnosis and treatment choices` · source `The Guardian, 2025`
  - `70%`: `of US HCPs find AI helpful for diagnosis` · source `Talker Research, 2025`
  - `1 in 3`: `American patients use AI to manage their health` · source `Talker Research, 2025`
- H3: `Built for every team that touches the brand`
- Feature cards (light panel + mini product UI; hover/focus reveals the one-liner):
  - `Win back lost prompts` · Brand & digital marketing · share-of-voice bars + "3 prompts lost" · "See where competitors are recommended and you are not, then ship the fix."
  - `Catch wrong doses` · Medical affairs · AI sentence (wrong dose) vs label sentence · "AI sentence next to the label sentence, routed to medical information."
  - `Review, don't rewrite` · Regulatory & MLR · checklist, "Risk: Low", Approve · "Drafts arrive claim-referenced with a pre-MLR risk score."
  - `Run every client brand` · Agencies · multi-brand visibility table · "One website-in flow per client, one multi-brand overview."
- Lime marquee (therapeutic areas, doodles in `/images/doodles/ta-*.png`): Obesity (`ta-obesity`), Immunology (`ta-immunology`), Oncology (`ta-oncology`), Neurology (`ta-neurology`), Cardiology (`ta-cardiology`), Women's health (`ta-womens-health`), Dermatology (`ta-dermatology`)

## 9. Get started (7shifts: "Get running in under 30 days" timeline)
- H2: `Your first AI visibility report in 5 minutes`
- Sub: `Type your company website. Aeon finds your portfolio, competitors and the questions people ask, then runs a live scan.`
- CTA: `Start your free report`
- Timeline pills: `Minute 1` · `Minute 5` · `Day 30`
  1. (lavender) `Enter your website.` ✓ `Portfolio found from your site and FDA labels` ✓ `Competitors and prompts pre-filled` ✓ `Pick one hero drug to start`
  2. (periwinkle) `Read your first report.` ✓ `Visibility score vs. your top competitor` ✓ `Answers that contradict the label` ✓ `Top 3 fixes, one click each`
  3. (lime) `Ship your first fix.` ✓ `Draft approved through pre-MLR` ✓ `Weekly re-scans across your portfolio` ✓ `Before and after you can share`

## 10. FAQ, anchor `#faqs` (doodle `doodle-faq.png`)
- H2: `Frequently asked questions`
1. **What is GEO for pharma?** Generative engine optimization is the work of making sure AI engines like ChatGPT, Gemini and Perplexity mention your brand and describe it accurately. For pharma it also means checking every answer against the label and making every fix MLR-ready.
2. **Which AI engines does Aeon track?** ChatGPT, Claude, Gemini, Perplexity, Google AI Overviews and AI Mode, Copilot and Meta AI. Each prompt is sampled several times per engine, by market and language.
3. **Does Aeon publish content for us?** No. Aeon drafts and never publishes. It produces MLR-ready drafts and exports them for review, including to Veeva PromoMats. Nothing goes live without human sign-off.
4. **How do you handle off-label questions?** Prompts outside the approved indication are monitor-only. They show up as signals for medical affairs and are never used to generate content.
5. **What happens if an AI answer describes an adverse event?** Possible adverse events found in monitoring are routed to your pharmacovigilance inbox under your SOP. Aeon does not store patient PHI.
6. **How reliable are the visibility scores?** AI answers vary by model, region and time, so every score shows its sample size and confidence interval, and our methodology is published.
7. **Is the first report really free?** Yes. The first scan needs only your company website. We ask for a work email when you want to save the report and track it weekly.

## 11. Final CTA (7shifts: royal-blue panel + scrolling review cards)
- H2: `Explore your brand` / `[in the AI search era]` (bracketed part in lime)
- Buttons: `Start your free report` (sand pill), `Book a walkthrough` (white outline pill)
- Scrolling stat cards (white, replace review cards; product facts from the PRD, no ratings):
  - `5 min` · `to your first report`
  - `7+` · `AI engines tracked`
  - `40` · `prompts in your first scan`
  - `0` · `claims without a source`
  - `100%` · `human sign-off before publish`

## 12. Free resources
- Removed for now (user feedback, 2026-09-26). The copy and component live in git history (commit 85fc718).

## 13. Footer
- Columns:
  - **Platform**: AI visibility tracking, Accuracy vs. label, Content fixes, AI pre-MLR review, Technical SEO audit, Citation map, Recommendations
  - **Company**: About, Careers, Contact, Security, Pricing, Book a walkthrough
  - **Built for**: Brand & digital marketing, Medical affairs, Regulatory & MLR, Pharmacovigilance, Agencies, Rx brands, OTC & consumer health, Biotech
  - **Support**: Help center, Contact sales, System status
- Row: `Ask AI for a summary of Aeon` + 5 square buttons with the real logos (ChatGPT, Claude, Perplexity, Gemini, Grok) that open each assistant with the prompt "Summarize what Aeon (AI visibility and pre-MLR platform for pharma brands) does"
- Social icons: LinkedIn, X, YouTube
- Bottom bar (black): `Aeon © 2026` · Privacy · Terms · DPA · Security · Cookie preferences
