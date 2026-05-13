# Sonar — Documentation

Two docs.

## Living doc

- **[PLAN.md](PLAN.md)** — current architecture and the reasoning behind it. The 9-principle thesis, the research+score pipeline, the data model and index decisions, the security posture, the hardening pass, the 6-deal demo seed. Update when the architecture meaningfully changes.

## Frozen artifact

- **[superpowers/specs/2026-05-13-sonar-design.md](superpowers/specs/2026-05-13-sonar-design.md)** — pre-build design spec, dated and locked at the start of the 12-hour build. Captures the *intent* — what Sonar was going to be, including the scan layer that was later reverted mid-build. Kept as historical record; PLAN.md is the source of truth for current state.

## Read order

- **First time on the repo?** → [PLAN.md](PLAN.md).
- **Curious what the original plan looked like vs. what shipped?** → diff PLAN.md against [superpowers/specs/2026-05-13-sonar-design.md](superpowers/specs/2026-05-13-sonar-design.md), then read `git log --oneline` for the path between them. The mid-build pivot (commit `268c5f5`) is the most informative single moment.

For the public-facing intro and quickstart, see the repo-root [README.md](../README.md).
