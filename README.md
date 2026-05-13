# Sonar

> A sourcing engine for pre-VC AI-native founders, scored against Quanta Ventures' 9 culture principles.

**Live demo:** _(deploy URL goes here after Vercel setup)_

## What this is

I built a sourcing engine for myself — for a different purpose. This is the same engine pointed at venture sourcing. It scans where AI-native founders ship things *before* they fundraise — HN, GitHub, Hugging Face — researches each, and scores them against Quanta's 9 culture principles.

The repo is the proof artifact. The hosted demo is where you click around.

## How it works

1. **Scan** — three buttons (HN Show-HN, GitHub trending in AI/ML, Hugging Face trending). Each fires a parallel parser, returns candidates, dedup'd against the existing pipeline.
2. **Research** — for each company, an OpenAI Responses-API + `web_search` engine produces: company overview, momentum signal (shipping cadence — not ARR), founder content (recent posts/papers/threads), founder pedigree (top 0.01% signals).
3. **Score** — every founder gets evaluated against all 9 Quanta culture principles. Per-principle output: evidence + citations + signal strength. Composite fitScore 0-100 with reasoning.
4. **Track** — kanban with 5 stages: Sourced → Researched → Watching → Met → Passed.

No outreach layer. Sonar evaluates; humans contact.

## What's deliberately not in Sonar

- **Crunchbase** — $249/mo minimum, and already-funded companies are a lagging indicator.
- **Twitter** — API is ~$5K+/yr for usable volume; ToS gray for scraping.
- **LinkedIn** — account-ban risk + ToS gray.
- **YC** — already capitalized. We want founders *before* a venture firm has touched them.
- **Outreach drafting** — different problem; lives in this repo's ancestor (a job-hunt tool called Narad) but isn't here.

Cost-awareness is a sourcing-engine feature, not a limitation.

## Local dev

```
pnpm install
cp .env.example .env.local
# Fill in DATABASE_URL (Neon free tier works), DIRECT_URL, OPENAI_API_KEY
pnpm db:migrate
pnpm seed
pnpm dev
```

Visit http://localhost:3000.

## Stack

Next.js 16 · React 19 · TypeScript · Prisma 7 · Postgres (Neon) · tRPC v11 · Tailwind v4 · shadcn · OpenAI Responses API · Vercel.

## Lineage

Forked from [Narad](https://github.com/mohit/narad) at the commit before its SQLite redesign. Narad was an outbound job-hunt pipeline; the same engine — research, score, track — generalizes to venture sourcing.
