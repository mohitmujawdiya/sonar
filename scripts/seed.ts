import { config } from "dotenv";
config({ path: ".env.local", override: true });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { DEFAULT_QUANTA_PRINCIPLES } from "../src/server/services/ai/prompts/quanta-fit";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const QUANTA_THESIS = `# Quanta Ventures

A venture studio utilizing AI to build revolutionary startup ventures, combined with a hedge fund, a VC fund, and an incubator.

## What we believe

**The team you build is the company you build.** Our team members have built companies worth billions from scratch. We believe in the pursuit of excellence and that mastery is transferable across disciplines. Our team includes chess grandmasters, national champions in bridge, World Series of Poker participants, award-winning hedge-fund founders, and national champion golfers. If you've become **top 0.01% in any field**, we want to talk to you.

We believe in collaboration. We have a tech-startup culture and an anti-finance culture. We believe in **work/life integration**, not work/life balance. We desire to build the world we want to live in.

## Our process

Our process is built on **practice + science + AI**. The latest developments in AI unlock a huge set of opportunities to create new ventures.

The 5-stage venture build:

1. **Research and development**
2. **Truth-seeking**
3. **Market validation**
4. **Funding**
5. **Scaling**

Sonar automates stages 1 and 2.

## How we evaluate founders

Every founder we consider gets read against our 9 culture principles. The principles are not feel-good — they are operational. Each one has a way to look for evidence of presence or absence.

The principles, in order:

1. **Kaizen** — Continuous improvement. Questioning dogma. The worst answer is "because it has always been done that way."
2. **Truth-seeking** — Get to truth even when uncomfortable. Change views in light of new data. First-principles thinking.
3. **Customer Obsession** — Figure out the customer; get them extremely satisfied; fast responsive communication.
4. **Initiative** — Don't wait to be told. Find the most impactful thing and do it.
5. **Prioritization** — A single priority at any given moment. Not three. Know what it is and finish it.
6. **Insanely High Standards** — How you do anything is how you do everything.
7. **Extreme Ownership** — Own failures, mistakes, challenges. Clear communication; recipient-received is the sender's responsibility.
8. **Think Big and Long** — World-changing scope. Years-ahead horizon.
9. **Integrity Matters** — Do what you say. No lies. Front-page-of-the-internet test.

A founder gets a per-principle signal of strong / weak / unknown with citable evidence, plus a composite fitScore 0–100.

---

Contact: evan@quantaventures.ai
`;

async function main() {
  console.log("Seeding…");

  await db.profile.upsert({
    where: { id: "singleton" },
    update: {
      thesisMarkdown: QUANTA_THESIS,
      theses: DEFAULT_QUANTA_PRINCIPLES,
    },
    create: {
      id: "singleton",
      thesisMarkdown: QUANTA_THESIS,
      theses: DEFAULT_QUANTA_PRINCIPLES,
    },
  });
  console.log("✓ Profile singleton seeded with Quanta thesis + 9 culture principles");

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
