# Sonar

> Paste a founder URL. Get a Quanta-shaped read in 30 seconds.

**Live demo:** _(URL shared privately — see the GitHub repo description or DM)_

> Built in 12 hours as the application deliverable for a venture analyst role at Quanta. Read [docs/PLAN.md](docs/PLAN.md) for the full foundation doc — what it is, why, how it's built, what's deliberately not included.

## What this is

I built a sourcing engine for myself for a different purpose (job hunting). This is the same engine pointed at venture sourcing — point it at a founder URL and it researches them, then scores them against Quanta's 9 culture principles with citable evidence.

The repo is the proof artifact. The hosted demo is where you click around.

## How it works

1. **Paste** — a founder URL (LinkedIn `/in/handle`, X/Twitter, GitHub, or a personal site / company homepage).
2. **Research** — Sonar fires 4 parallel OpenAI `web_search` queries: company overview, momentum signal (shipping cadence — not ARR), founder content (recent posts/papers/threads), founder pedigree (top 0.01% signals).
3. **Extract + Score (in parallel)** — three independent passes against the research artifacts: structured company facts (headcount/stage/sector), founder name extraction into Contact rows (so the kanban can show "Donald Della Pietra" instead of "linkedin.com/in/donalddellapietra"), and the 9-principle Quanta-fit synthesis.
4. **Track** — kanban with 5 stages: Sourced → Researched → Watching → Met → Passed.

End-to-end: ~30s typical, ~45s on the slow tail. No outreach layer — Sonar evaluates, humans contact.

## What's deliberately not in Sonar

- **Outreach drafting** — different problem; lives in this repo's ancestor (Narad) but isn't here.
- **Paid sourcing data** — Crunchbase ($249/mo) lags real signal; Twitter API ($5K+/yr) doesn't justify the spend. OpenAI `web_search` per founder gets us the same depth for cents.
- **Scan layer** — earlier iterations had a /scan page over HN / GitHub / Hugging Face. The candidates it returned were surface-level — still needed full research to be evaluable. Stripped out. Sourcing happens upstream of Sonar; Sonar is the evaluation engine.

Cost-awareness is a sourcing-engine feature, not a limitation.

## Local dev

```sh
pnpm install
cp .env.example .env.local
# Fill in DATABASE_URL (Neon free tier works), DIRECT_URL, OPENAI_API_KEY
pnpm prisma migrate deploy   # apply tracked migrations (0_init, 1_indexes)
pnpm seed                    # Quanta thesis singleton
pnpm seed:anchors            # 6 anchor deals through full research pipeline (~3-4 min, costs OpenAI tokens)
pnpm dev
```

Visit `http://localhost:3000`.

## Deploy to Vercel

1. Create a Neon Postgres project. Copy the **pooled** connection string (this is `DATABASE_URL`) and the **unpooled** one — strip `-pooler` from the host — for `DIRECT_URL` (used by `prisma migrate deploy`).
2. Push this repo to GitHub if not already.
3. Import the repo on Vercel. In project settings → environment variables, add `DATABASE_URL`, `DIRECT_URL`, `OPENAI_API_KEY` to Production.
4. Add a build command override: `prisma migrate deploy && prisma generate && next build`.
5. Deploy. Then run `pnpm seed` once locally pointing at the Neon URL to populate the Quanta thesis, followed by `pnpm seed:anchors` to seed the 6 demo founders.

**Heads-up:** there is no application auth. Set an OpenAI monthly spend cap in your dashboard before sharing the URL — the OpenAI key is the load-bearing secret protecting against research-endpoint abuse. See [docs/PLAN.md §9](docs/PLAN.md#9-security-posture) for the full security posture.

## Stack

Next.js 16 · React 19 · TypeScript · Prisma 7 · Postgres (Neon) · tRPC v11 · Tailwind v4 · shadcn · @dnd-kit · OpenAI Responses API · Vercel.

## Repository layout

```
docs/
  PLAN.md                         — live architecture + reasoning doc (read this)
  superpowers/specs/              — frozen pre-build design spec (historical)
src/
  app/                            — Next.js routes (App Router)
    landing/                      — public-facing hero for Evan
    companies/, companies/[id]/   — kanban + deal detail (3 tabs)
    companies/new/                — paste-a-founder evaluation flow
    settings/, funnel/            — Thesis editor (confirm-on-save) + Conversion page
  components/
    companies/quanta-fit-scorecard.tsx   — the hero scorecard component
  server/
    routers/                      — tRPC (profile, companies, contacts, research, dashboard)
    services/
      research-engine.ts          — full pipeline: 4× web_search → 3-way parallel
                                    (facts extract / founders extract / Quanta-fit synthesis)
      url-parse.ts                — extracts handle from LinkedIn/X/GitHub founder URLs
      activity-log.ts             — typed audit-log writer
      ai/
        openai-client.ts          — shared singleton (used by openai-chat + web-research)
        openai-chat.ts            — openaiJson<T>() with 1.5×-tokens retry on parse fail
        web-research.ts           — Responses API + web_search wrapper
        prompts/company-research.ts   — 4 web_search prompts
        prompts/quanta-fit.ts         — 9-principle JSON-strict scorer
scripts/
  seed.ts                         — seed the Quanta thesis singleton
  seed-anchors.ts                 — seed 6 anchor founder deals (idempotent)
prisma/
  schema.prisma                   — Company / Contact / Profile / CompanyResearch / ResearchCache / ActivityLog / List
  migrations/                     — 0_init + 1_indexes
```

## Lineage

Forked from Narad (Mohit's outbound job-hunt pipeline) at the commit before its SQLite redesign. The job-hunt project was an outbound CRM with AI research, fit scoring, and drafting; the same engine — research, score, track — generalizes to venture sourcing. `git log` shows the build commit-by-commit, including the mid-build pivot from scan-layer-driven to paste-a-founder-driven.
