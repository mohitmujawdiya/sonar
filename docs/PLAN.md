# Sonar — Foundation & Build Plan

> Paste a founder URL. Get a Quanta-shaped read in 30 seconds.

**Status:** In active build. 12-hour delivery deadline from 2026-05-13.
**Repo:** github.com/mohitmujawdiya/sonar
**Internal spec:** [docs/superpowers/specs/2026-05-13-sonar-design.md](superpowers/specs/2026-05-13-sonar-design.md)

---

## 1. What Sonar is

Sonar is a **founder evaluation tool** for venture sourcing. Two things it does:

1. **Researches** a founder using OpenAI's Responses API with `web_search`, producing 4 distinct artifacts: company overview, momentum signal, founder content, founder pedigree.
2. **Scores** the founder team against **Quanta's 9 culture principles** with citable evidence per principle and a composite fitScore 0-100.

Input: paste a founder URL (LinkedIn `/in/handle`, X/Twitter, GitHub, personal site, or company homepage). Output: a 9-principle scorecard in about 30 seconds.

It deliberately doesn't do outreach. The companion ancestor project ([Narad](#3-lineage)) has a drafting engine; Sonar evaluates, humans contact.

## 2. Why Sonar exists

I'm applying for a venture analyst role at Quanta Ventures and promised Evan a working founder-evaluation tool as part of the application.

The narrative: *I built a sourcing engine for myself for a different purpose (job hunting). The same engine is general. Here it is pointed at Quanta.* That story matters because it shows the underlying capability — research, score, track — works across domains. The specific deliverable to Quanta is a polished instance of a general-purpose engine, not a one-off custom build.

## 3. Lineage

Sonar is forked from **Narad**, my outbound job-hunt pipeline, at the commit just before Narad's SQLite + Pursuit-first redesign. At that fork point Narad was a Postgres + multi-table CRM-shaped engine (Company / Contact / Touchpoint / Message / CompanyResearch / Profile) with AI research, fit scoring, drafting, and queue-driven sending.

The Sonar fork:
- **Kept** the research engine, the AI infrastructure (OpenAI Responses + web_search), the kanban UI, the activity log, the company/contact data model, the paste-a-URL onboarding flow.
- **Dropped** the outreach layer (drafting engine, voice rules, send adapters, queue/inbox pages, sequences/templates models). Sonar is evaluation-only.
- **Replaced** the fit-scoring prompt (job-fit against a CV) with a Quanta-fit scorecard against the 9 culture principles.
- **Improved** the URL parser to extract founder handles from LinkedIn `/in/`, X/Twitter, and GitHub profile URLs — so paste-a-LinkedIn lands a deal record named after the founder, not the platform.

Mid-build pivot worth noting in the commit history: an earlier iteration had a "scan" layer that pulled candidates from Hacker News, GitHub trending, and Hugging Face. The candidates it returned were surface-level — still needed full research to be evaluable — so the layer was adding complexity without load-bearing signal. Stripped out. Sourcing happens upstream of Sonar (in conversations, on Twitter, through intros); Sonar is the evaluation engine.

## 4. The thesis — founder-quality first

Quanta's core conviction: *"The team you build is the company you build."* They recruit top 0.01% in any field — chess grandmasters, national bridge / golf / poker champions, hedge-fund founders. Their evaluation is founder-quality-first, not metrics-first.

Sonar operationalizes that conviction. Every founder team is scored on **9 culture principles**, each becoming an explicit evaluation axis with citable evidence:

| # | Principle | What we look for |
|---|---|---|
| 1 | **Kaizen** | Continuous shipping cadence, postmortems, questioning of dogma |
| 2 | **Truth-seeking** | Changing views in light of new evidence, first-principles takes |
| 3 | **Customer Obsession** | Direct engagement with users, fast response, named customers |
| 4 | **Initiative** | Starting things without permission, building tools nobody asked for |
| 5 | **Prioritization** | Focused execution, explicit scope-cutting |
| 6 | **Insanely High Standards** | Visible craft, documentation depth, deliberate technical choices |
| 7 | **Extreme Ownership** | Public accountability, postmortems, addressing critique head-on |
| 8 | **Think Big and Long** | Multi-year horizon, world-changing scope |
| 9 | **Integrity Matters** | Delivered public commitments, no broken promises |

A founder gets a per-principle signal of `strong` / `weak` / `unknown`, with evidence + citations. The composite fitScore weights the 9 equally; an `unknown` is penalized more than `weak` (absence-of-signal is worse than presence-of-anti-signal because it means the founder isn't visible enough to evaluate).

The 9-principle scorecard is **the hero feature** of the demo. It's what makes Sonar look like a Quanta-native tool rather than a generic VC CRM. Polish bar there is the highest in the app.

## 5. What's out of scope (and why)

Each omission below is a deliberate design choice, explained.

### No outreach layer
- **Why:** "Founder evaluation tool" was the promise. Auto-drafting DMs to founders in a tone Evan didn't write is a demo *risk*, not an asset.
- **What this looks like:** No `/queue`, no `/inbox`, no send adapters, no draft confidence scoring, no voice rules. The underlying drafting code lives in Narad's git history; it's not in Sonar.

### No scan layer
- **Why:** An earlier iteration had a `/scan` page pulling candidates from HN, GitHub, Hugging Face. The candidates were surface-level — title + handle, no founder context — and each still needed full research to score. The bottleneck was research depth, not source breadth. So we stripped scanning out entirely. Sourcing happens upstream of Sonar; Sonar is the evaluation step.
- **What this means:** Sonar takes a founder URL as input. The analyst (or Evan) discovers founders through conversations, Twitter, intros — same as they would anyway — then pastes the URL into Sonar.

### No paid sourcing data
- **Crunchbase:** API starts at $249/mo. Already-funded companies are a lagging indicator anyway.
- **Twitter (X):** API is ~$5K+/yr for usable volume. ToS gray for scraping.
- **Net effect:** the cheapest meaningful enrichment is a free OpenAI `web_search` per founder. Cost-awareness is a sourcing-engine feature.

### No tests beyond a smoke test
- **Why:** Sonar is a demo, not a long-lived product. The vitest suite from Narad's lineage stays where it still passes; broken tests after the fork were deleted rather than maintained. CI is not configured.

### No auth / multi-user
- Single deploy. Anyone with the URL can use it. There is no user data to protect — the seeded deals are all public-info founders.

## 6. Architecture

### Stack
- **Frontend:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · shadcn · @dnd-kit · next-themes
- **Backend:** tRPC v11 · Prisma 7 · Postgres on Neon · OpenAI Responses API
- **Deploy:** Vercel

### Server layout
- `src/server/db.ts` — Prisma client singleton with PrismaPg adapter
- `src/server/env.ts` — zod-validated env (DATABASE_URL, DIRECT_URL, OPENAI_API_KEY, optional GITHUB_TOKEN)
- `src/server/routers/` — 5 routers: `profile`, `companies`, `contacts`, `research`, `dashboard`
- `src/server/services/` — domain logic
  - `research-engine.ts` — orchestrates 4 parallel web-search queries + the Quanta-fit scorecard synthesis
  - `url-parse.ts` — extracts handle from LinkedIn/X/GitHub founder URLs
  - `activity-log.ts`
- `src/server/services/ai/prompts/`
  - `company-research.ts` — 4 web_search prompts (overview, momentumSignal, founderContent, founderPedigree)
  - `quanta-fit.ts` — system+user prompt for the JSON-strict 9-principle scorer + `DEFAULT_QUANTA_PRINCIPLES`

### Data model

A single conceptual unit — the **deal** (technically `Company`) — with related Contact records for founders and a 1:1 CompanyResearch row that holds AI-generated artifacts.

```
Company
├── id, name, domain, stage, headcount, sector, founders, lastFunding, sourceUrl
├── fitScore (composite Quanta fit, 0-100), fitReason
├── status (Sourced → Researched → Watching → Met → Passed)
├── notes
├── contacts: Contact[]            (founder records)
├── research: CompanyResearch?     (1:1, AI artifacts)
└── lists: CompanyList[]           (saved cohorts)

Contact
├── companyId, name, role, linkedinUrl, email, twitterUrl
└── emailConfidence, status, notes

CompanyResearch
├── companyId (unique)
├── overview          JSON  (company overview research)
├── momentumSignal    JSON  (shipping cadence, learning loops)
├── founderContent    JSON  (recent founder posts/tweets with citations)
├── founderPedigree   JSON  (top-0.01% evidence per founder)
├── quantaFit         JSON  (the 9-principle scorecard — hero artifact)
└── refreshedAt, expiresAt

Profile (singleton)
├── thesisMarkdown   (Quanta's narrative thesis — what they invest in)
├── theses           JSON  (9 culture principles with name/brief/operationalization)
└── narrative

ResearchCache
└── 14-day TTL on web_search results, keyed by query hash

ActivityLog
└── audit trail of company-created / status-changed / research-cached / scored / scan-added events
```

## 7. AI prompt design

Five prompts total, all using OpenAI Responses API.

### Four web_search research prompts (run in parallel per company)

| Prompt | What it produces |
|---|---|
| `companyOverviewPrompt` | 5-7 sentence overview: what they do, stage, size, sector, **founders by name with LinkedIn URLs and prior backgrounds**, tech stack signal, recent milestone, customer signal. |
| `momentumSignalPrompt` | Kaizen-shaped read: shipping cadence (commits, releases, models), public learning loops (posts, postmortems, user-feedback responses), quality of iteration. Cited synthesis: *tight loop or stagnant?* |
| `founderContentPrompt` | 5-8 most-recent founder posts/tweets/blogs with date + URL + ≤25-word quote. Plus 2-3 *signal threads* — posts showing first-principles reasoning, public accountability, or non-obvious views. |
| `founderPedigreePrompt` | Top-0.01% mining: competitive championships, top-program academia with citations, prior built-and-shipped work, hedge-fund/quant track records. Per-founder verdict: top-0.01% present / strong-but-not-extraordinary / no signal findable. |

Each cached 14 days in `ResearchCache` keyed by `(companyId, kind, prompt)` hash.

### One JSON synthesis prompt

`quantaFitPrompt` takes the 4 research artifacts + Quanta's thesisMarkdown + the 9 principles, and outputs **strict JSON** with:

```json
{
  "compositeScore": 0-100,
  "compositeReasoning": "<2-4 sentence overall judgment naming strongest 2 + weakest 1>",
  "principles": [
    {
      "name": "<principle name>",
      "signal": "strong" | "weak" | "unknown",
      "evidence": "<finding grounded in research, with quotes if useful>",
      "reasoning": "<why this evidence maps to this signal>"
    },
    // ...9 entries
  ]
}
```

**Hard rule baked into the system prompt:** *Don't invent evidence. If research is silent on a principle, signal = unknown.*

The scorecard is rendered as a 9-card grid on the deal detail page — the hero UI component.

## 8. The onboarding flow — paste a founder URL

`/companies/new` is the single onboarding path. One text field: paste any of —

- **LinkedIn profile** — `linkedin.com/in/handle` → URL parser extracts the handle and titleizes ("Donald Della Pietra" rather than "Linkedin").
- **X/Twitter profile** — `x.com/handle` or `twitter.com/handle` → handle extracted.
- **GitHub profile** — `github.com/user` → handle extracted.
- **Personal site** — `jane.dev` → domain.
- **Company homepage** — `stripe.com` → domain. Research figures out the founders.

On submit: creates a Company in `Sourced`, fires the 4 parallel `web_search` queries, runs the Quanta-fit synthesis. Total wait ~30 seconds. Dedup keyed on `(domain, handle)` for profile URLs so the same founder doesn't get duplicate records.

## 9. UI surface

### Sidebar (3 items)
- **Deals** — `/companies` (kanban)
- **Conversion** — `/funnel`
- **Thesis** — `/settings`

### Pages
- `/` — Pipeline overview (counts per stage, last research)
- `/companies/new` — paste a founder URL → evaluate
- `/companies` — kanban with 5 columns (Sourced / Researched / Watching / Met / Passed), drag, optimistic updates
- `/companies/[id]` — 3 tabs:
  - **Research** — company overview + momentum signal + founder content + founder pedigree (with citations)
  - **Quanta Fit** — the 9-principle scorecard (hero)
  - **Notes** — private free-text
- `/funnel` — conversion snapshot
- `/settings` — Thesis editor (markdown narrative + 9-principle grid editor)
- `/landing` — public-facing intro with hero, scroll-driven panels, "Open the app" CTA

## 10. Implementation plan

Tasks tracked. Status as of writing:

| # | Task | Status |
|---|---|---|
| 1 | Write Sonar design spec + initial commit | ✅ |
| 2 | Rename project to Sonar (package.json, README, CLAUDE.md, scripts) | ✅ |
| 3 | Schema cleanup + new migration | ✅ |
| 4 | Drop outreach layer code (routers, services, pages) | ✅ |
| 5 | Rewrite AI prompts for Quanta-fit scoring | ✅ |
| 6 | UI: rename Pursuit→Deal, restructure sidebar + detail page | ⏳ |
| 7 | Build Quanta Fit scorecard component (hero feature) | ⏳ |
| 8 | ~~Build /scan page + HN + GitHub + HF parsers~~ → **reverted** | ↩️ |
| 9 | Build /landing page (public-facing demo intro) | ⏳ |
| 10 | Seed Quanta thesis content (Profile.thesisMarkdown + 9 theses) | ⏳ |
| 11 | Rewrite README + repo-level polish | ⏳ |
| 12 | Deploy to Vercel + Neon Postgres | ⏳ |
| 13 | Seed 5 anchor deals through full research pipeline | ⏳ |
| 14 | Final polish + smoke test + send to Evan | ⏳ |

### Anchor deals (curated, partial list)

| Company | Founder(s) |
|---|---|
| DeepSpace | Donald Della Pietra, Marius Bocanu |
| Vamo | Bolun Li |
| Aviator | Ankit Jain |
| _TBD_ | _TBD_ |
| _TBD_ | _TBD_ |

Each anchor: create Company + Contact records, run research engine (4 parallel web_search queries), run quanta-fit scorer, land on the kanban with a populated scorecard.

## 11. Deferred / parking lot

If Sonar lives past the demo, these are obvious next moves. None are in scope for the 12-hour build.

- **Founder follow** — given a Twitter/X handle, watch for new posts and flag thesis-aligned ones.
- **Reverse evaluation** — given a thesis, find historical founders who would have scored well (calibration).
- **Audit trail UI** — surface ActivityLog as a "deal history" view.
- **Team-shared notes / lists** — multi-user.
- **Vector store of founder content** — search "founders who think like X" semantically.
- **Outreach drafting layer** — port Narad's drafting engine over, retuned for VC voice. Optional: only if Evan asks for it.
- **A sourcing layer, done right** — the scan layer was stripped because surface-level candidates didn't justify the wiring. A future version could do this with a per-founder follow loop (watch a hand-curated set of Twitter accounts, alert on signal-shaped posts) rather than a top-N listing scan.

## 12. How to read this repo

- **First commit** (`8a42215`) — the forked tree from Narad, unmodified. Shows what we started from.
- **Subsequent commits** — each is one task from the plan above, with the rationale in the commit message.
- **`docs/superpowers/specs/2026-05-13-sonar-design.md`** — internal spec, more implementation-detail than this doc.
- **`CLAUDE.md`** — orientation for future AI sessions on this codebase.

Read `git log --oneline` for the build history at a glance.
