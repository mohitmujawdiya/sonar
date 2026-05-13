# Sonar — Design Spec

**Date:** 2026-05-13
**Status:** Locked. Implementation in progress.
**Deadline:** 12 hours from spec finalization.

---

## 1. Context

Sonar is a fork of Narad (Mohit's outbound job-hunt pipeline) taken from the commit *immediately before* the SQLite/Pursuit-first redesign. At that fork point, Narad was a polished multi-table CRM-shaped outreach engine — Company / Contact / Touchpoint / Message / CompanyResearch / Profile, with AI research, fit scoring, drafting, and queue-driven sending. That engine generalizes.

The narrative: *"I built a sourcing engine for myself. The engine is general. Here it is pointed at Quanta."*

Sonar is the deliverable for Mohit's application to a venture analyst role at **Quanta Ventures** (AI-focused venture studio + hedge fund + VC fund + incubator; founder/CEO Evan, evan@quantaventures.ai). Promise made to the founder: a working founder-evaluation tool, hosted, with a public repo.

## 2. Goals

1. **Live hosted demo on Vercel** that Evan can click and use in 5 minutes without setup.
2. **Public GitHub repo** with a README that tells the lineage story and links to the demo.
3. **Founder-quality-first scoring** grounded in Quanta's own 9 culture principles, not generic VC metrics.
4. **Live sourcing layer** that scans pre-VC AI-native sources (HN, GitHub, Hugging Face) on demand.
5. **5+ hand-curated anchor deals** seeded so the demo isn't empty on first load.

## 3. Non-goals

- **No outreach layer.** The promise was "evaluation tool." Auto-drafted founder DMs are demo risk, not asset. The drafting engine lives in Narad's git history; Sonar deliberately doesn't ship it.
- **No YC in the scan layer.** YC companies are already capitalized — a lagging indicator, not leading. Quanta wants founders *before* a firm has touched them.
- **No Crunchbase, Twitter, LinkedIn scanning.** Crunchbase API starts at $249/mo; Twitter API is $5K+/yr; LinkedIn is ToS gray. These are *deliberate omissions* and the README will say so — cost-awareness is a sourcing-engine feature, not a limitation.
- **No multi-user, no auth.** Single-deploy local-feel app; Evan accesses through the public URL.
- **No SQLite.** Sonar uses Postgres-on-Neon because Vercel hosting was the explicit shape.

## 4. Architecture

### 4.1 Stack (unchanged from pre-pivot Narad)

- Next.js 16 App Router · React 19 · TypeScript
- Prisma 7 + Postgres on Neon
- tRPC v11 + React Query
- Tailwind v4 + shadcn
- Zustand · @dnd-kit · next-themes
- Deployment: Vercel
- AI: OpenAI Responses API with `web_search` tool (research), gpt-5.5 (scoring + analysis), gpt-5.4-mini (classification + fact extraction)

### 4.2 Schema changes from forked Narad

**Drop:**
- `Touchpoint`, `Message`, `Sequence`, `Template` (outreach layer)
- `Application` (forward-declared in Narad; never used)

**Modify:**
- `CompanyStatus` enum: `Discovered/Researched/Targeting/Active/Paused/Disqualified` → `Sourced/Researched/Watching/Met/Passed`
- `Profile`: `cvMarkdown` → `thesisMarkdown`; `archetypes` → `theses` (JSON array of 9 culture-principle rubrics); drop `visaDisclosurePolicy`, `careerOpsPath`
- `CompanyResearch.hiringSignal` → `momentumSignal`; new field `quantaFit` (JSON: 9-principle scorecard)
- `ActivityLog`: drop touchpointId, applicationId; keep companyId, contactId

**Keep as-is:**
- `Company` (with stage, founders JSON, lastFunding, fitScore, fitReason)
- `Contact` (founder/exec records)
- `CompanyResearch` (with the two field changes above)
- `ResearchCache` (14-day TTL on web research results)
- `List`, `CompanyList` (saved filters / thesis-aligned cohorts)

### 4.3 Service layer changes

**Drop:**
- `drafting-engine.ts`
- `send-dispatcher.ts`
- `send-adapters/*`
- `careerops-watcher.ts` (job-hunt-specific file watch)

**Keep:**
- `research-engine.ts` — already shapes nicely for VC research
- `source-importer.ts` — same dedup/insert flow, repointed at scan results
- `activity-log.ts`
- `parsers/*` — drop `jd-url.ts`; keep `single-url.ts`, `url-list.ts`, `csv.ts`, `format-detector.ts`

**Add:**
- `parsers/hn-show.ts` — HN Show-HN scanner via Algolia API
- `parsers/github-trending.ts` — GitHub REST trending repos filtered for AI topics
- `parsers/hugging-face.ts` — HF Spaces trending API
- `services/scan-engine.ts` — orchestrates parallel scans across the three sources

### 4.4 AI prompts (the core differentiator)

In `src/server/services/ai/prompts/`:

| Prompt | Status | Purpose |
|---|---|---|
| `companyOverviewPrompt` | Tweaked | Surface product, market, customers, team-size, funding-state, **founder backgrounds heavily**. |
| `momentumSignalPrompt` (renamed from hiringSignal) | Rewritten | Kaizen-shaped: shipping cadence, GitHub commit frequency, blog/post cadence, iteration speed, feedback loops. Not growth-shaped (Quanta isn't a growth-stage fund). |
| `founderContentPrompt` | Unchanged | Already pure gold. Recent founder posts/tweets/threads with citations. |
| `founderPedigreePrompt` | **NEW** | Has this founder been **top 0.01%** at anything? National-level competitor? Built+exited a company? Published research? Won awards in any field that demands mastery? Direct mapping to Quanta's "we recruit top 0.01% in any field" thesis. |
| `quantaFitPrompt` | **NEW (replaces fit-score.ts)** | Evaluates founder against all 9 Quanta culture principles. Output: per-principle evidence (with citations) + signal strength (strong/weak/unknown) + composite fitScore 0-100 with reasoning grounded in which principles the founder embodies. |

The 9 principles (verbatim from Quanta's culture page, used as the scoring rubric):

1. **Kaizen** — continuous improvement, questioning dogma
2. **Truth-seeking** — first-principles, changing views in light of new evidence
3. **Customer Obsession** — figure out the customer, satisfy them, fast communication
4. **Initiative** — don't wait to be told, find the impactful thing
5. **Prioritization** — single priority at any moment, not three
6. **Insanely High Standards** — how you do anything is how you do everything
7. **Extreme Ownership** — own failures, clear communication, recipient-received
8. **Think Big and Long** — world-changing scope, years-ahead horizon
9. **Integrity Matters** — do what you say, no lies, front-page-of-internet test

## 5. UI surface

### 5.1 Sidebar (4 items)

- **Scan** — `/scan`
- **Deals** — `/deals` (kanban)
- **Conversion** — `/funnel`
- **Thesis** — `/settings`

### 5.2 Pages

- **`/`** Dashboard / Pipeline Overview — counts per stage, last scan, last research
- **`/scan`** — 3 source cards (HN / GitHub / HF) with "Scan now" buttons → results page with candidate cards → "Add to pipeline" CTA per card
- **`/deals`** — kanban with 5 columns (Sourced / Researched / Watching / Met / Passed), dnd-kit drag, optimistic updates
- **`/deals/[id]`** — 3 tabs:
  - **Research** — company overview + momentum signal + founder content + contact info
  - **Quanta Fit** — 9-principle scorecard (the hero feature)
  - **Notes** — private free-text
- **`/funnel`** — conversion analytics
- **`/settings`** — Thesis edit: thesisMarkdown + 9-principle editable grid
- **`/landing`** — public-facing demo intro (hero, 3 panels, "open the app" CTA)

### 5.3 Hero component: Quanta Fit Scorecard

`src/components/deals/quanta-fit-scorecard.tsx` — a 9-card grid (3×3 on desktop, single column on mobile). Each card shows:

- Principle name (e.g. "Kaizen")
- Signal strength badge: strong (teal) / weak (slate) / unknown (muted)
- Evidence: 1-2 sentence finding with `[1]` citation links to source URLs
- Reasoning: short paragraph explaining the call

Header above the grid: composite fitScore 0-100 + 1-paragraph overall reasoning.

This is the component Evan will see and study. Polish bar here is the highest in the app.

## 6. Scan layer

### 6.1 Sources

| Source | API | Filter |
|---|---|---|
| HN Show-HN | Algolia (free, JSON) | Posts tagged `show_hn`, last 30 days |
| GitHub trending | GitHub REST `/search/repositories` (free, rate-limited) | Topic: `ai`/`ml`/`llm`, sorted by stars-this-week, English README |
| Hugging Face | HF Hub API `/api/spaces` (free) | Sort: trending, type: spaces or models |

### 6.2 Flow

1. User opens `/scan` → sees 3 cards.
2. Clicks "Scan now" → tRPC procedure fires parallel HTTP fetches, parsers normalize results to `ScanCandidate{ name, url, founderHandle?, snippet, sourceUrl }`.
3. Results page shows candidates grouped by source, dedup'd against existing `companyDomain`s.
4. "Add to pipeline" per candidate → creates `Company` in `Sourced` status + fires research engine.

### 6.3 Deliberate omissions (story for the README)

- **Twitter** — API now $5K+/yr for usable volume; ToS gray for scraping.
- **LinkedIn** — Account-ban risk + ToS gray.
- **Crunchbase** — $249/mo minimum; already-funded companies = lagging indicator anyway.
- **YC** — Already capitalized; want founders *before* a firm has touched them.

## 7. Quanta-specific content seeding

- **`Profile.thesisMarkdown`** — pulled from quantaventures.ai (via WebFetch) + supplemented with any Evan public content (Twitter, podcast appearances) findable. Edits surface in `/settings`.
- **`Profile.theses`** — JSON array of 9 objects: `{ name, brief, operationalization }`. Pre-seeded with the 9 culture principles. Used by `quantaFitPrompt` as scoring rubric — editing the grid updates how new founders are scored. **Dogfoodable.**

## 8. Anchor deals (5+)

Provided by Mohit so far (2026-05-13):

| Company | Founder(s) | LinkedIn |
|---|---|---|
| DeepSpace | Donald Della Pietra | linkedin.com/in/donalddellapietra |
| DeepSpace | Marius Bocanu | linkedin.com/in/marius-ioan-bocanu-978154119 |
| Vamo | Bolun Li | linkedin.com/in/bolun-li-12393573 |
| Aviator | Ankit Jain | linkedin.com/in/ankitjaindce |
| TBD | TBD | TBD |
| TBD | TBD | TBD |

Each anchor deal: create Company + Contact records, run research engine, run quantaFitPrompt, land in the kanban with a populated scorecard. These are the polished demo cards Evan sees on first load.

## 9. Landing page narrative

Hero: *"I built a sourcing engine for myself. Watch what happens when I point it at Quanta."*

Three panels (scroll-driven):

1. **Paste a URL → 30 seconds → 9-principle scorecard.** Animated demo of the URL-to-scorecard flow.
2. **Live deal flow.** Screenshot of the kanban with 5 seeded deals visible.
3. **Source the next deal in 30 seconds.** Demo of the scan layer in action.

CTA: "Open the app" → `/deals`.

Subhead philosophy section:
- "Why founder-quality scoring, not metrics scoring"
- "Why HN/GitHub/HF and not Crunchbase/Twitter"
- "Why no outreach layer"

These read as product judgment, not features.

## 10. Time budget (CC-hours, ~12 of 12)

| Block | Hours |
|---|---|
| Write spec + initial commit | 0.3 |
| Rename project to Sonar | 0.5 |
| Schema cleanup + new migration | 0.5 |
| Drop outreach layer code | 0.5 |
| Rewrite AI prompts | 1.5 |
| UI restructure (sidebar, deal detail, strings) | 2.0 |
| Build Quanta Fit scorecard component | 1.0 |
| Scan page + 3 parsers | 1.5 |
| Landing page | 1.5 |
| Seed Quanta thesis content | 0.5 |
| README rewrite | 0.5 |
| Vercel + Neon setup | 1.5 |
| Seed 5 anchor deals | 1.5 |
| Polish + smoke test | 0.5 |

**Total:** ~13.8 nominal; expect ~10.5 actual given parallelization. User-side bottlenecks: providing remaining 2 anchor founders, Vercel/Neon account auth, final review before send.

## 11. Open items

- [ ] Mohit to provide 2 more anchor founder URLs (have 3 of 5).
- [ ] Mohit to authorize Vercel + Neon deployment when that task starts.
- [ ] Domain name decision (default `sonar-xxx.vercel.app` is acceptable for v1).

## 12. Out of scope explicitly (parking lot)

- Outreach drafting (lives in Narad's history; not in Sonar)
- Multi-user / auth / team accounts
- Paid sourcing APIs (Crunchbase, Twitter)
- Email integration (Gmail OAuth, reply polling)
- Story-bank / pgvector embeddings
- Mobile UI
