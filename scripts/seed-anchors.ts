// Seed anchor deals through the full research pipeline. Used to land a
// pre-populated demo state (kanban + scorecards) ahead of share-out.
//
// Why this exists separately from `companies.createFromUrl`:
//   1. The mutation infers the company name from the URL handle
//      ("Donalddellapietra"), which is ugly in the kanban.
//   2. The mutation fires `scoreCompanyFit` directly, but that no-ops without
//      research first. We need to chain through `researchCompany`.

import { config } from "dotenv";
config({ path: ".env.local", override: true });

import { db } from "../src/server/db";
import { parseCompanyUrl } from "../src/server/services/url-parse";
import { researchCompany } from "../src/server/services/research-engine";
import { logActivity } from "../src/server/services/activity-log";

type Anchor = { name: string; founderUrl: string };

const ANCHORS: Anchor[] = [
  { name: "DeepSpace", founderUrl: "https://linkedin.com/in/donalddellapietra" },
  { name: "Vamo", founderUrl: "https://linkedin.com/in/bolun-li-12393573" },
  { name: "Aviator", founderUrl: "https://linkedin.com/in/ankitjaindce" },
  { name: "Spira AI", founderUrl: "https://linkedin.com/in/llma" },
  { name: "Phygtl Inc.", founderUrl: "https://linkedin.com/in/tommasodibartolo" },
  { name: "Sierra", founderUrl: "https://linkedin.com/in/brettaylor" },
];

async function seedAnchor(anchor: Anchor): Promise<void> {
  const parsed = parseCompanyUrl(anchor.founderUrl);
  if (!parsed) throw new Error(`Could not parse URL: ${anchor.founderUrl}`);

  const existing = await db.company.findUnique({ where: { domain: parsed.domain } });
  if (existing) {
    if (existing.fitScore !== null) {
      console.log(`  · ${anchor.name} already seeded (fitScore=${existing.fitScore}); skipping`);
      return;
    }
    console.log(`  · ${anchor.name} exists but unscored; re-running research…`);
    await researchCompany(existing.id);
    return;
  }

  const company = await db.company.create({
    data: {
      name: anchor.name,
      domain: parsed.domain,
      sourceUrl: parsed.url,
    },
  });
  await logActivity({
    type: "company-created",
    companyId: company.id,
    payload: { sourceUrl: parsed.url, via: "seed-anchors" },
  });
  console.log(`  · ${anchor.name} created (id=${company.id}); running research…`);
  await researchCompany(company.id);
}

async function main(): Promise<void> {
  console.log(`Seeding ${ANCHORS.length} anchor deals through full research pipeline…`);
  const t0 = Date.now();
  for (const anchor of ANCHORS) {
    const t = Date.now();
    try {
      await seedAnchor(anchor);
      console.log(`    done in ${((Date.now() - t) / 1000).toFixed(1)}s`);
    } catch (e) {
      console.error(`    failed: ${(e as Error).message}`);
    }
  }
  console.log(`✓ Seed complete in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
