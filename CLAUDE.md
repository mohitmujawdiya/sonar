# Sonar

Founder-evaluation tool for venture sourcing. Forked from Narad (a job-hunt pipeline) at the pre-redesign-v2 commit. Paste a founder URL → research + score against Quanta's 9 culture principles. Built as the application deliverable for a venture analyst role at Quanta Ventures.

## Read these first

- **[docs/PLAN.md](docs/PLAN.md)** — comprehensive foundation doc.
- **[docs/superpowers/specs/2026-05-13-sonar-design.md](docs/superpowers/specs/2026-05-13-sonar-design.md)** — internal design spec.
- **[README.md](README.md)** — public-facing repo intro.

## What Sonar does

1. **Paste** — accept a founder URL (LinkedIn `/in/handle`, X/Twitter, GitHub, personal site, or company homepage). The URL parser extracts handles from profile shapes so the deal lands with a useful name before research fires.
2. **Research** — for each company, run an OpenAI-powered research engine that produces 4 artifacts: company overview, momentum signal (shipping cadence, not growth metrics), founder content (recent posts/tweets/papers), founder pedigree (top 0.01% signals).
3. **Score** — evaluate every founder against **Quanta's 9 culture principles** (Kaizen / Truth-seeking / Customer Obsession / Initiative / Prioritization / Insanely High Standards / Extreme Ownership / Think Big and Long / Integrity). Output: per-principle evidence + signal strength + composite fitScore. This is the hero feature.
4. **Track** — kanban with 5 stages: Sourced → Researched → Watching → Met → Passed.

**No outreach layer.** Sonar evaluates; humans contact. The drafting engine that exists in Narad's lineage is deliberately not in Sonar.

**No scan layer.** Earlier iterations had a `/scan` page pulling from HN + GitHub + Hugging Face. The candidates were surface-level and still needed full research to score, so the layer was complexity without signal. Stripped out. Sourcing happens upstream of Sonar.

## Tech stack

- Next.js 16 (App Router) · React 19 · TypeScript
- Prisma 7 + Postgres (Neon) + `@prisma/adapter-pg`
- tRPC v11 + React Query
- Tailwind v4 + shadcn
- Zustand · @dnd-kit · next-themes
- OpenAI Responses API (web_search for research, gpt-5.5 for analysis, gpt-5.4-mini for classification)
- vitest · Playwright
- Vercel deploy

## Conventions

**Server layout:**
- `src/server/db.ts` — Prisma client singleton with `PrismaPg` adapter.
- `src/server/env.ts` — zod-validated env.
- `src/server/routers/` — 5 routers: profile, companies, contacts, research, dashboard.
- `src/server/services/research-engine.ts` — orchestrates 4× parallel `web_search` queries, then 3-way parallel post-research: `extractCompanyFactsFromOverview` (gpt-5.4-mini), `extractFoundersFromOverview` (gpt-5.4-mini, creates Contact rows), `scoreCompanyFit` (gpt-5.5, the hero synthesis).
- `src/server/services/url-parse.ts` — handle extraction for LinkedIn/X/GitHub founder URLs.
- `src/server/services/ai/openai-client.ts` — shared singleton used by both `openai-chat` and `web-research`.
- `src/server/services/ai/openai-chat.ts` — `openaiJson<T>()` with one-shot retry at 1.5× tokens on JSON parse failure.
- `src/server/services/ai/prompts/` — `companyOverviewPrompt`, `momentumSignalPrompt`, `founderContentPrompt`, `founderPedigreePrompt`, `quantaFitPrompt`.

**Database:**
- All migrations via `pnpm db:migrate`. Migrations live in `prisma/migrations/`.
- Profile is a singleton (`@id @default("singleton")`) — holds `thesisMarkdown` + `theses` JSON (the 9 culture principles used as the scoring rubric).

**The 9-principle scorecard is the most important component.** Polish bar there is the highest in the app. It lives at `src/components/companies/quanta-fit-scorecard.tsx`.

## Don't

- Don't add an outreach layer. Sonar is explicitly evaluation-only. The drafting engine + voice rules + send adapters exist in Narad's history — not Sonar's.
- Don't reintroduce a scan layer. The mid-build pivot stripped it for a reason: surface candidates don't justify the wiring. If sourcing is wanted, the future move is a per-founder follow loop, not a top-N listing scan.
- Don't introduce a second AI provider. OpenAI Responses API does research + analysis + scoring.

## Useful commands

| | |
|---|---|
| `pnpm dev` | Next.js dev server at localhost:3000 |
| `pnpm test` | vitest |
| `pnpm db:migrate` | Run pending migrations |
| `pnpm db:studio` | Prisma Studio |
| `pnpm seed` | Seed Profile singleton with Quanta thesis |
| `pnpm build` | Production build |
