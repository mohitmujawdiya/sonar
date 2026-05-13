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

type Anchor = { name: string; founderUrl: string; founderName: string };

const ANCHORS: Anchor[] = [
  { name: "DeepSpace", founderUrl: "https://linkedin.com/in/donalddellapietra", founderName: "Donald Della Pietra" },
  { name: "Vamo", founderUrl: "https://linkedin.com/in/bolun-li-12393573", founderName: "Bolun Li" },
  { name: "Aviator", founderUrl: "https://linkedin.com/in/ankitjaindce", founderName: "Ankit Jain" },
  { name: "Spira AI", founderUrl: "https://linkedin.com/in/llma", founderName: "Long Ma" },
  { name: "Phygtl Inc.", founderUrl: "https://linkedin.com/in/tommasodibartolo", founderName: "Tommaso Di Bartolo" },
  { name: "Sierra", founderUrl: "https://linkedin.com/in/brettaylor", founderName: "Bret Taylor" },
];

async function seedAnchor(anchor: Anchor): Promise<void> {
  const parsed = parseCompanyUrl(anchor.founderUrl);
  if (!parsed) throw new Error(`Could not parse URL: ${anchor.founderUrl}`);

  let companyId: string;
  const existing = await db.company.findUnique({ where: { domain: parsed.domain } });

  if (existing) {
    companyId = existing.id;
    if (existing.fitScore !== null) {
      console.log(`  · ${anchor.name} already scored (fit=${existing.fitScore})`);
    } else {
      console.log(`  · ${anchor.name} exists but unscored; researching…`);
      await researchCompany(existing.id);
    }
  } else {
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
    console.log(`  · ${anchor.name} created (id=${company.id}); researching…`);
    await researchCompany(company.id);
    companyId = company.id;
  }

  // Ensure a Contact row exists for the named founder. Idempotent: re-running
  // the script won't create duplicate contacts.
  const existingContact = await db.contact.findFirst({
    where: { companyId, name: anchor.founderName },
  });
  if (!existingContact) {
    await db.contact.create({
      data: {
        companyId,
        name: anchor.founderName,
        role: "Founder",
        linkedinUrl: anchor.founderUrl,
      },
    });
    console.log(`      + contact: ${anchor.founderName}`);
  }
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
