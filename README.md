# Sonar

> A sourcing engine for pre-VC AI-native founders, scored against Quanta Ventures' 9 culture principles.

**Live demo:** _(deploy URL goes here once Vercel is wired up)_

> Built in 12 hours as the application deliverable for a venture analyst role at Quanta. Read [docs/PLAN.md](docs/PLAN.md) for the full foundation doc — what it is, why, how it's built, what's deliberately not included.

## What this is

I built a sourcing engine for myself for a different purpose (job hunting). This is the same engine pointed at venture sourcing — it scans where AI-native founders ship things *before* they fundraise (HN, GitHub, Hugging Face), researches each, and scores them against Quanta's 9 culture principles with citable evidence.

The repo is the proof artifact. The hosted demo is where you click around.

## How it works

1. **Scan** — three sources (HN Show-HN, GitHub trending in AI/ML, Hugging Face trending). Each fires a parallel parser, returns candidates, dedup'd against the existing pipeline.
2. **Research** — for each company, an OpenAI Responses-API + `web_search` engine produces 4 artifacts: company overview, momentum signal (shipping cadence — not ARR), founder content (recent posts/papers/threads), founder pedigree (top 0.01% signals).
3. **Score** — a synthesis prompt evaluates the team against all 9 Quanta culture principles. Per-principle: signal (strong/weak/unknown) + evidence + reasoning. Composite fitScore 0-100.
4. **Track** — kanban with 5 stages: Sourced → Researched → Watching → Met → Passed.

No outreach layer. Sonar evaluates; humans contact.

## What's deliberately not in Sonar

- **Crunchbase** — $249/mo minimum, and already-funded companies are a lagging indicator.
- **Twitter** — API is ~$5K+/yr for usable volume; ToS gray for scraping.
- **LinkedIn** — account-ban risk + ToS gray.
- **YC** — already capitalized. We want founders *before* a venture firm has touched them.
- **Outreach drafting** — different problem; lives in this repo's ancestor (Narad) but isn't here.

Cost-awareness is a sourcing-engine feature, not a limitation.

## Local dev

```sh
pnpm install
cp .env.example .env.local
# Fill in DATABASE_URL (Neon free tier works), DIRECT_URL, OPENAI_API_KEY
pnpm db:migrate
pnpm seed
pnpm dev
```

Visit `http://localhost:3000`.

## Deploy to Vercel

1. Create a Neon Postgres project; grab the pooled connection string (DATABASE_URL) and the unpooled one (DIRECT_URL).
2. Push this repo to GitHub if not already.
3. Import the repo on Vercel. In project settings → environment variables, add `DATABASE_URL`, `DIRECT_URL`, `OPENAI_API_KEY`.
4. Add a build command override: `prisma migrate deploy && prisma generate && next build`. (Or run `pnpm db:migrate` locally against the Neon URL first.)
5. Deploy. After first deploy, run `pnpm seed` once against the Neon URL to populate the Quanta thesis.

## Stack

Next.js 16 · React 19 · TypeScript · Prisma 7 · Postgres (Neon) · tRPC v11 · Tailwind v4 · shadcn · @dnd-kit · OpenAI Responses API · Vercel.

## Repository layout

```
docs/
  PLAN.md                         — comprehensive foundation doc
  superpowers/specs/              — internal implementation spec
src/
  app/                            — Next.js routes (App Router)
    landing/                      — public-facing hero page
    scan/                         — 3-source scan UI
    companies/, companies/[id]/   — kanban + deal detail (3 tabs)
    settings/, funnel/            — Thesis editor + Conversion page
  components/
    companies/quanta-fit-scorecard.tsx   — the hero scorecard component
  server/
    routers/                      — tRPC (profile, companies, contacts, research, dashboard, scan)
    services/
      research-engine.ts          — 4 parallel web_search + Quanta-fit synthesis
      scan-engine.ts              — HN / GitHub / HF orchestrator
      ai/prompts/
        company-research.ts       — 4 web_search prompts
        quanta-fit.ts             — 9-principle JSON-strict scorer
prisma/
  schema.prisma                   — Company / Contact / Profile / CompanyResearch / ResearchCache / ActivityLog / List
```

## Lineage

Forked from Narad (Mohit's outbound job-hunt pipeline) at the commit before its SQLite redesign. The job-hunt project was an outbound CRM with AI research, fit scoring, and drafting; the same engine — research, score, track — generalizes to venture sourcing. `git log` shows the build commit-by-commit.
