# Sonar — Foundation & Architecture

> Paste a founder URL. Get a Quanta-shaped read in ~30 seconds.

**Status:** Shipped. Demo deliverable for venture-analyst application to Quanta Ventures.
**Repo:** github.com/mohitmujawdiya/sonar
**Internal design spec:** [docs/superpowers/specs/2026-05-13-sonar-design.md](superpowers/specs/2026-05-13-sonar-design.md) — frozen pre-build artifact; this doc supersedes it for current state.

---

## 1. What Sonar is

Sonar is a **founder evaluation tool** for venture sourcing. Two things it does:

1. **Researches** a founder using OpenAI's Responses API with `web_search`, producing 4 distinct artifacts: company overview, momentum signal, founder content, founder pedigree.
2. **Scores** the founder team against **Quanta's 9 culture principles** with citable evidence per principle and a composite fitScore 0-100.

Input: paste a founder URL (LinkedIn `/in/handle`, X/Twitter, GitHub, personal site, or company homepage). Output: a 9-principle scorecard in about 30 seconds.

It deliberately doesn't do outreach. The companion ancestor project ([Narad](#3-lineage)) has a drafting engine; Sonar evaluates, humans contact.

## 2. Why Sonar exists

Built as the application deliverable for a venture analyst role at Quanta Ventures. The narrative: *I built a sourcing engine for myself for a different purpose (job hunting). The same engine is general. Here it is pointed at Quanta.* That story shows the underlying capability — research, score, track — works across domains. The specific deliverable to Quanta is a polished instance of a general-purpose engine, not a one-off custom build.

## 3. Lineage

Sonar is forked from **Narad**, an outbound job-hunt pipeline, at the commit just before Narad's SQLite + Pursuit-first redesign. At that fork point Narad was a Postgres + multi-table CRM-shaped engine (Company / Contact / Touchpoint / Message / CompanyResearch / Profile) with AI research, fit scoring, drafting, and queue-driven sending.

The Sonar fork:
- **Kept** the research engine, the AI infrastructure (OpenAI Responses + web_search), the kanban UI, the activity log, the company/contact data model, the paste-a-URL onboarding flow.
- **Dropped** the outreach layer (drafting engine, voice rules, send adapters, queue/inbox pages, sequences/templates models). Sonar is evaluation-only.
- **Replaced** the fit-scoring prompt (job-fit against a CV) with a Quanta-fit scorecard against the 9 culture principles.
- **Improved** the URL parser to extract founder handles from LinkedIn `/in/`, X/Twitter, and GitHub profile URLs — so paste-a-LinkedIn lands a deal record named after the founder, not the platform.

Mid-build pivot worth noting in the commit history: an earlier iteration had a "scan" layer that pulled candidates from Hacker News, GitHub trending, and Hugging Face. The candidates it returned were surface-level — still needed full research to be evaluable — so the layer was adding complexity without load-bearing signal. Stripped out in commit `268c5f5`. Sourcing happens upstream of Sonar (in conversations, on Twitter, through intros); Sonar is the evaluation engine.

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

A founder gets a per-principle signal of `strong` / `weak` / `unknown`, with evidence + citations. The composite fitScore weights the 9 equally; an `unknown` is penalized more than `weak` — absence-of-signal is worse than presence-of-anti-signal, because it means the founder isn't visible enough to evaluate.

The 9-principle scorecard is **the hero feature** of the demo. It's what makes Sonar look like a Quanta-native tool rather than a generic VC CRM. Polish bar there is the highest in the app.

## 5. What's out of scope (and why)

Each omission below is a deliberate design choice, explained.

### No outreach layer
- **Why:** "Founder evaluation tool" was the promise. Auto-drafting DMs to founders in a tone Evan didn't write is a demo *risk*, not an asset.
- **What this means:** No `/queue`, no `/inbox`, no send adapters, no draft confidence scoring, no voice rules. The underlying drafting code lives in Narad's git history; it's not in Sonar.

### No scan layer
- **Why:** An earlier iteration had a `/scan` page pulling candidates from HN, GitHub, Hugging Face. The candidates were surface-level — title + handle, no founder context — and each still needed full research to score. The bottleneck was research depth, not source breadth.
- **What this means:** Sonar takes a founder URL as input. The analyst discovers founders through conversations, Twitter, intros — same as they would anyway — then pastes the URL into Sonar.

### No paid sourcing data
- **Crunchbase:** API starts at $249/mo. Already-funded companies are a lagging indicator anyway.
- **Twitter (X):** API is ~$5K+/yr for usable volume. ToS gray for scraping.
- **Net effect:** the cheapest meaningful enrichment is a free OpenAI `web_search` per founder. Cost-awareness is a sourcing-engine feature.

### No auth / multi-user
- Single deploy. Anyone with the URL can use it. The OpenAI key is the load-bearing secret — protected by a spend cap in the OpenAI dashboard, not by application auth. See [§9. Security posture](#9-security-posture).

### No tests beyond a smoke test
- Sonar is a demo, not a long-lived product. The vitest suite from Narad's lineage stays where it still passes; broken tests after the fork were deleted rather than maintained. CI is not configured.

## 6. Architecture

### 6.1 Stack
- **Frontend:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · shadcn · @dnd-kit · next-themes
- **Backend:** tRPC v11 · Prisma 7 · Postgres on Neon · OpenAI Responses API (`web_search` tool for research; `gpt-5.5` for analysis/scoring; `gpt-5.4-mini` for structured-output extraction)
- **Deploy:** Vercel — build command `prisma migrate deploy && prisma generate && next build`; env vars `DATABASE_URL` (pooled) + `DIRECT_URL` (unpooled, for migrations) + `OPENAI_API_KEY`

### 6.2 Server layout
- `src/server/db.ts` — Prisma client singleton with `PrismaPg` adapter
- `src/server/env.ts` — zod-validated env
- `src/server/routers/` — 5 tRPC routers: `profile`, `companies`, `contacts`, `research`, `dashboard`
- `src/server/services/`
  - `research-engine.ts` — orchestrates the full research+score pipeline (§6.4)
  - `url-parse.ts` — extracts handles from LinkedIn/X/GitHub founder URLs
  - `activity-log.ts` — typed audit-log writer
- `src/server/services/ai/`
  - `openai-client.ts` — shared singleton (used by both openai-chat and web-research)
  - `openai-chat.ts` — `openaiJson<T>()` for structured-output calls, with 1.5×-tokens retry on JSON parse failure
  - `web-research.ts` — `webResearch()` for Responses API + `web_search` tool calls
  - `prompts/company-research.ts` — 4 web_search prompts
  - `prompts/quanta-fit.ts` — 9-principle JSON-strict scorer + `DEFAULT_QUANTA_PRINCIPLES`

### 6.3 Data model

A single conceptual unit — the **deal** (technically `Company`) — with related Contact records for founders and a 1:1 CompanyResearch row that holds AI-generated artifacts.

```
Company
├── id, name, domain (unique), stage, headcount, sector, founders, lastFunding, sourceUrl
├── fitScore (composite Quanta fit, 0-100), fitReason (≤280 chars)
├── status (Sourced → Researched → Watching → Met → Passed)
├── notes
├── contacts: Contact[]            (founder records)
├── research: CompanyResearch?     (1:1, AI artifacts)
└── lists: CompanyList[]
@@index([status, sector, fitScore])

Contact
├── companyId, name, role, linkedinUrl, email, twitterUrl, emailConfidence
└── notes, status

CompanyResearch
├── companyId (unique)
├── overview          JSON  (company overview research)
├── momentumSignal    JSON  (shipping cadence, learning loops)
├── founderContent    JSON  (recent founder posts/tweets with citations)
├── founderPedigree   JSON  (top-0.01% evidence per founder)
├── quantaFit         JSON  (the 9-principle scorecard — hero artifact)
└── refreshedAt, expiresAt

Profile (singleton, id = "singleton")
├── thesisMarkdown   (Quanta's narrative thesis)
├── theses           JSON  ([{name, brief, operationalization}, …9 entries])
└── narrative

ResearchCache
├── queryHash (unique) — sha256 of (companyId, kind, prompt)
├── source, query, result, citations
└── expiresAt (14-day TTL)
@@index([expiresAt])

ActivityLog
├── companyId?, contactId?, type, payload
└── createdAt
@@index([companyId, type, createdAt])
ActivityType: company-created | company-updated | company-status-changed
            | contact-created | research-cached | scored | scoring-failed
```

Key schema decisions:

- **Profile is a singleton.** `id @default("singleton")` enforces by convention. The whole app has exactly one thesis at a time — there's no multi-tenant story.
- **CompanyResearch is 1:1 with Company.** No history kept; refresh overwrites. The expensive part (raw web_search results) is cached separately in `ResearchCache` keyed by prompt-content hash, so refreshing the wrapper without busting the cache is free.
- **`Company.domain` is unique** and includes the handle for profile URLs (`linkedin.com/donalddellapietra`, not just `linkedin.com`) — without this, the second LinkedIn founder pasted would collide.
- **ActivityLog uses `onDelete: SetNull`** on companyId so deleting a deal preserves the audit trail.

### 6.4 The research+score pipeline

The core flow is `researchCompany(companyId)` in `research-engine.ts`. Called fire-and-forget from `companies.createFromUrl` after the company row exists.

```
                ┌─ overview         (web_search, gpt-5.5)
                ├─ momentumSignal   (web_search, gpt-5.5)   } 4-way parallel, ~15-30s
   runResearch ─┤─ founderContent   (web_search, gpt-5.5)   } cache check first,
                └─ founderPedigree  (web_search, gpt-5.5)   } 14d TTL on hash
                          │
                          ▼
                ┌─ extractCompanyFactsFromOverview  (gpt-5.4-mini)
                ├─ extractFoundersFromOverview      (gpt-5.4-mini)   } 3-way parallel, ~3-15s
                └─ scoreCompanyFit                  (gpt-5.5, JSON)  } longest path = scoring
                          │
                          ▼
                ActivityLog entries written along the way
```

**Why three-way parallel for the post-research step.** All three analyses read the overview / research artifacts but write to disjoint fields (Company facts, Contact rows, CompanyResearch.quantaFit). Pre-hardening they ran sequentially — total research time was ~75s. Post-hardening it's a single longest path (~30-45s).

**Why each piece exists:**

| Function | Model | Reads | Writes | Why |
|---|---|---|---|---|
| `extractCompanyFactsFromOverview` | gpt-5.4-mini | overview text | Company.headcount, stage, sector | Overview prompt produces prose; mini extracts structured fields for the kanban card sidebar. |
| `extractFoundersFromOverview` | gpt-5.4-mini | overview text | Contact rows | Overview lists founders in prose ("Founders — list each by name with current title, prior background, LinkedIn URL"); this turns that into Contact rows so the kanban shows founder name (not LinkedIn-path) under the company. Idempotent on name. |
| `scoreCompanyFit` | gpt-5.5 | research artifacts + Profile.theses | CompanyResearch.quantaFit, Company.fitScore, Company.fitReason | The 9-principle synthesis. The hero artifact. |

**Failure handling.** Each post-research call is wrapped in `.catch()` so one failure doesn't sink the others. Specifically, `scoreCompanyFit` failures write a `"scoring-failed"` row to ActivityLog with the truncated error message — so a silent scoring failure shows up in the audit trail instead of leaving a deal mysteriously un-scored.

**JSON parse retry.** `openaiJson()` retries once with a 1.5× token budget on parse failure. This recovers from the common case where the LLM produced valid-looking JSON but hit the token cap mid-string. Without the retry, DeepSpace's first scoring run failed silently for exactly this reason during seeding.

### 6.5 Cache strategy

Two layers:

1. **ResearchCache (DB, 14-day TTL).** Each of the 4 web_search calls is keyed by `sha256(companyId, kind, prompt)`. Prompt text in the hash means renaming a company busts its cache (renaming changes the prompt). Cache hits skip the OpenAI call entirely; cache misses run the call and upsert.
2. **React Query (client, 30s staleTime).** Set in `app/providers.tsx`. Without this, every view switch refetches and shows a flash of skeleton state. Mutations explicitly invalidate via `utils.<x>.invalidate()`.

The DB cache is the load-bearing one — research calls cost real OpenAI tokens. The React Query layer is purely UX.

## 7. AI prompt design

Six prompts total, all using OpenAI Responses API.

### Four `web_search` research prompts (run in parallel per company)

| Prompt | Model | What it produces |
|---|---|---|
| `companyOverviewPrompt` | gpt-5.5 | 5-7 sentence overview: what they do, stage, size, sector, **founders by name with LinkedIn URLs and prior backgrounds**, tech stack signal, recent milestone, customer signal. |
| `momentumSignalPrompt` | gpt-5.5 | Kaizen-shaped read: shipping cadence (commits, releases, models), public learning loops (posts, postmortems, user-feedback responses), quality of iteration. *Tight loop or stagnant?* |
| `founderContentPrompt` | gpt-5.5 | 5-8 most-recent founder posts/tweets/blogs with date + URL + ≤25-word quote. Plus 2-3 *signal threads* — posts showing first-principles reasoning, public accountability, or non-obvious views. |
| `founderPedigreePrompt` | gpt-5.5 | Top-0.01% mining: competitive championships, top-program academia with citations, prior built-and-shipped work, hedge-fund/quant track records. Per-founder verdict: top-0.01% present / strong-but-not-extraordinary / no signal findable. |

Each cached 14 days in `ResearchCache`.

### Two structured-output extraction prompts (run in parallel after research)

| Prompt | Model | What it produces |
|---|---|---|
| `extractCompanyFactsFromOverview` | gpt-5.4-mini | `{headcount, stage, sector}` — populates the kanban card meta line. |
| `extractFoundersFromOverview` | gpt-5.4-mini | `{founders: [{name, role, linkedinUrl}]}` — creates Contact rows so the founder name shows on the card. |

Both use `json_object` response format and operate on the cached overview text — no fresh `web_search`. Mini model because they're simple structured extractions, not synthesis.

### One JSON synthesis prompt

`quantaFitPrompt` takes the 4 research artifacts + Quanta's `thesisMarkdown` + the 9 principles, and outputs **strict JSON** with:

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
    }
    // …9 entries, one per principle
  ]
}
```

`maxTokens: 4000`. Originally 2500 — bumped after verbose deals (DeepSpace) hit the cap and produced truncated JSON. The retry-with-1.5×-tokens pathway in `openaiJson` is a backstop for any case that still overshoots.

**Hard rule baked into the system prompt:** *Don't invent evidence. If research is silent on a principle, signal = unknown.*

The scorecard is rendered as a 9-card grid on the deal detail page — the hero UI component.

## 8. Onboarding flow — paste a founder URL

`/companies/new` is the single onboarding path. One text field: paste any of —

- **LinkedIn profile** — `linkedin.com/in/handle` → URL parser extracts the handle.
- **X/Twitter profile** — `x.com/handle` or `twitter.com/handle` → handle extracted.
- **GitHub profile** — `github.com/user` → handle extracted.
- **Personal site** — `jane.dev` → domain.
- **Company homepage** — `stripe.com` → domain. Research figures out the founders.

On submit: `companies.createFromUrl` creates a Company in `Sourced`, fires `researchCompany()` (fire-and-forget), redirects to the deal detail page. The detail page polls via tRPC; research completes in ~30-45s and the kanban + scorecard re-render. Dedup keyed on `(domain, handle)` for profile URLs so the same founder doesn't get duplicate records.

## 9. Security posture

This is a single-user demo with no auth. The non-trivial risks and how they're handled:

| Risk | Mitigation |
|---|---|
| **OpenAI key drain.** Every `/api/trpc/research.*` call costs OpenAI tokens; no rate limiting. | OpenAI dashboard monthly spend cap. The URL is not posted publicly. |
| **Profile rubric corruption.** `profile.update` was originally `z.array(z.any())` — any payload could overwrite the 9-principle scoring rubric. | Tightened to `z.object({ name, brief, operationalization }).array().max(20)` with length caps. UI also requires a confirm-on-save. |
| **XSS via LLM output.** Research artifacts (overview, momentum, content, pedigree) are markdown rendered to the deal detail. | `<Markdown>` uses `rehype-sanitize`. Non-markdown LLM fields render through React JSX escaping. No `dangerouslySetInnerHTML` anywhere. |
| **Dangerous URLs in citations / sourceUrl.** Citations come from `web_search` annotations; sourceUrl is user-pasted. | `parseCompanyUrl` rejects non-http(s) schemes (`javascript:`, `data:`, etc.) via the `new URL()` constructor + protocol check. Citation links use `rel="noreferrer noopener"`. |
| **Header hygiene.** | CSP locked to self + Vercel telemetry. X-Frame-Options DENY, frame-ancestors none, nosniff, Permissions-Policy denies camera/mic/geo. |
| **SQL injection.** | All DB access via Prisma — no raw queries anywhere in the repo. |

**Deliberate non-fix: auth.** Adding bearer-token auth to mutations is a 30-line change; deferred because spend-cap is sufficient demo protection and the seeded data is all public-info founders. If this app lived past the demo, auth lands first.

## 10. UI surface

### Sidebar (3 items)
- **Deals** — `/companies` (kanban)
- **Conversion** — `/funnel`
- **Thesis** — `/settings`

### Pages
- `/` — Public-facing landing for Evan (hero, "three deliberate omissions", lineage, footer mailto). The bare URL is what gets shared, so the landing IS the home. `/landing` redirects here for backward compatibility with prior links.
- `/companies/new` — paste a founder URL → evaluate
- `/companies` — kanban with 5 columns (Sourced / Researched / Watching / Met / Passed), drag-and-drop with optimistic updates + rollback on failure
- `/companies/[id]` — 3 tabs:
  - **Research** — overview + momentum + founder content + founder pedigree (with citations); plus a Founders section showing seeded Contact rows
  - **Quanta Fit** — the 9-principle scorecard (hero)
  - **Notes** — private free-text, markdown-rendered
- `/funnel` — conversion snapshot
- `/settings` — Thesis editor with **confirm-on-save** (overwriting the rubric changes how every future deal scores)

### Kanban card composition

Each card shows: company name, **founder name** (first linked Contact, falls back to domain), sector, fitScore. The founder name is what makes the kanban glance-able — "DeepSpace · Donald Della Pietra" reads instantly; "DeepSpace · linkedin.com/in/donalddellapietra" doesn't.

## 11. Hardening pass

A multi-pass review covered correctness, performance, code quality, and security. Items shipped (commit hashes in parens):

**Correctness (`83d958b`, `7efbb0e`, `163e345`)**
- `companies.createFromUrl` now fires `researchCompany` (was firing `scoreCompanyFit` which silently no-ops when research doesn't exist — broke the landing-page "30 seconds" promise).
- `extractFoundersFromOverview` added — without it, UI-pasted deals would have no Contact rows and the kanban would fall back to the ugly LinkedIn-path.
- Scoring `maxTokens` 2500 → 4000 (verbose deals were truncating mid-JSON).

**Performance (`02a54b3`, `7efbb0e`)**
- 3-way `Promise.all` on the post-research analyses (~25-30s saved per deal).
- `@@index([fitScore])` on Company, `@@index([expiresAt])` on ResearchCache.
- Dropped redundant `_count.contacts` from `companies.list` (kanban renders contact names directly now).

**Resilience (`02a54b3`)**
- `openaiJson` retries once with 1.5× tokens on JSON parse failure.
- Scoring failures log to ActivityLog as `"scoring-failed"` so they're visible in the audit trail.
- OpenAI client extracted to `openai-client.ts` singleton, deduplicated between `openai-chat` and `web-research`.

**Security (`e00e6eb`, `02a54b3`, `83d958b`)**
- `profile.update` zod tightened — was `z.array(z.any())`, now validates principle shape.
- CSP stripped of dead Clerk + Cloudflare references (vestigial from Narad).
- Thesis save requires explicit `confirm()`.
- `SSR base URL` respects `VERCEL_URL` (was hard-coded localhost).

**Cleanup (`02a54b3`)**
- Dead types removed (`DraftOutput`, `FitScore` from Narad outreach lineage).
- Dead ActivityType members removed (`scan-added`, `manual-log`) — replaced with `company-updated` + `scoring-failed`.
- Added activity logging on `companies.update`.

## 12. Demo seed

**6 anchor deals** seeded via `pnpm seed:anchors`, each pre-researched + scored:

| Company | Founder | fitScore | Note |
|---|---|---|---|
| Vamo | Bolun Li | 86 | Bootstrapped Zogo to ~$36M acquisition |
| Sierra | Bret Taylor | 85 | Calibration deal — established serial founder for ceiling reference |
| Aviator | Ankit Jain | 84 | Publicly revised "code review is dead" thesis based on data |
| Phygtl Inc. | Tommaso Di Bartolo | 83 | Shipping cadence + public feedback responses |
| Spira AI | Long Ma | 79 | Bootstrapped iteration loops |
| DeepSpace | Donald Della Pietra | 74 | Founders extracted to Contact rows automatically picked up Marius Bocanu as co-founder |

The Sierra inclusion is deliberate: a known serial founder anchors the top of the spread and shows the scoring discriminates on principle-level evidence rather than reputation (Vamo's 86 beats Sierra's 85 because Vamo's founder has more concrete principle-level evidence in the research artifacts).

**Seeding is idempotent.** Re-running `pnpm seed:anchors` skips already-scored deals and only does work for new entries. Contacts are deduped by `(companyId, name)`.

## 13. Deferred / parking lot

If Sonar lives past the demo, these are obvious next moves.

- **Auth.** Bearer-token or magic-link on mutations. Lifts the spend-cap-only OpenAI protection.
- **Founder follow.** Given a Twitter/X handle, watch for new posts and flag thesis-aligned ones.
- **Reverse evaluation.** Given a thesis, find historical founders who would have scored well (calibration).
- **Audit trail UI.** Surface ActivityLog as a "deal history" view.
- **Team-shared notes / lists.** Multi-user.
- **Vector store of founder content.** Search "founders who think like X" semantically.
- **Outreach drafting layer.** Port Narad's drafting engine over, retuned for VC voice. Only if asked for it.
- **A sourcing layer, done right.** Per-founder follow loop (watch a hand-curated set of Twitter accounts, alert on signal-shaped posts) rather than a top-N listing scan.

## 14. How to read this repo

- **First commit** (`8a42215`) — forked tree from Narad, unmodified. Shows what we started from.
- **Subsequent commits** — each is one logical change with rationale in the message.
- **`docs/superpowers/specs/2026-05-13-sonar-design.md`** — frozen pre-build design spec. Captures intent at start; superseded by this doc for current state.
- **`CLAUDE.md`** — orientation for future AI sessions on this codebase.

Read `git log --oneline` for the build history at a glance.
