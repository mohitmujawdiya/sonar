# Sonar

Founder-evaluation tool for venture sourcing. Forked from Narad (a job-hunt pipeline) at the pre-redesign-v2 commit; repointed at finding pre-VC AI-native founders. Built as the application deliverable for a venture analyst role at Quanta Ventures.

## Read these first

- **[docs/superpowers/specs/2026-05-13-sonar-design.md](docs/superpowers/specs/2026-05-13-sonar-design.md)** — locked design spec for Sonar. Always check before starting work.
- **[README.md](README.md)** — public-facing repo intro.

## What Sonar does

1. **Scan** — pull candidate founders from HN Show-HN, GitHub trending (AI/ML topics), and Hugging Face trending (Spaces + Models). Free APIs only. No Crunchbase / Twitter / LinkedIn / YC (deliberate omissions — explained in README).
2. **Research** — for each company, run an OpenAI-powered research engine that produces: company overview, momentum signal (shipping cadence, not growth metrics), founder content (recent posts/tweets/papers), founder pedigree (top 0.01% signals).
3. **Score** — evaluate every founder against **Quanta's 9 culture principles** (Kaizen / Truth-seeking / Customer Obsession / Initiative / Prioritization / Insanely High Standards / Extreme Ownership / Think Big and Long / Integrity). Output: per-principle evidence + signal strength + composite fitScore. This is the hero feature.
4. **Track** — kanban with 5 stages: Sourced → Researched → Watching → Met → Passed.

**No outreach layer.** Sonar evaluates; humans contact. The drafting engine that exists in Narad's lineage is deliberately not in Sonar.

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
- `src/server/routers/` — thin tRPC procedures, validation only; delegate to services.
- `src/server/services/` — domain logic (research engine, scan engine, source importer, activity log).
- `src/server/services/parsers/` — `hn-show`, `github-trending`, `hugging-face` (scan sources) + `single-url`, `csv`, `url-list` (paste-and-parse).
- `src/server/services/ai/prompts/` — `companyOverviewPrompt`, `momentumSignalPrompt`, `founderContentPrompt`, `founderPedigreePrompt`, `quantaFitPrompt`.

**Database:**
- All migrations via `pnpm db:migrate`. Migrations live in `prisma/migrations/`.
- Profile is a singleton (`@id @default("singleton")`) — holds `thesisMarkdown` + `theses` JSON (the 9 culture principles used as the scoring rubric).

**The 9-principle scorecard is the most important component.** Polish bar there is the highest in the app. It lives at `src/components/deals/quanta-fit-scorecard.tsx`.

## Don't

- Don't add an outreach layer. Sonar is explicitly evaluation-only. The drafting engine + voice rules + send adapters exist in Narad's history — not Sonar's.
- Don't add Crunchbase / Twitter / LinkedIn / YC scanning. Cost or ToS reasons; see README.
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
