import { createHash } from "node:crypto";
import { db } from "../db";
import { webResearch } from "./ai/web-research";
import {
  companyOverviewPrompt,
  momentumSignalPrompt,
  founderContentPrompt,
  type CompanyContext,
} from "./ai/prompts/company-research";
import { logActivity } from "./activity-log";
import type { ResearchResult } from "./ai/types";
import { openaiJson } from "./ai/openai-chat";

const CACHE_TTL_DAYS = 14;
const CACHE_TTL_MS = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;

type ResearchKind = "overview" | "momentumSignal" | "founderContent";

const PROMPT_BUILDERS: Record<ResearchKind, (c: CompanyContext) => string> = {
  overview: companyOverviewPrompt,
  momentumSignal: momentumSignalPrompt,
  founderContent: founderContentPrompt,
};

export async function researchCompany(companyId: string): Promise<void> {
  await runResearch(companyId, { useCache: true });
}

export async function refreshCompanyResearch(companyId: string): Promise<void> {
  await runResearch(companyId, { useCache: false });
}

async function runResearch(companyId: string, opts: { useCache: boolean }): Promise<void> {
  const company = await db.company.findUniqueOrThrow({ where: { id: companyId } });
  const ctx: CompanyContext = { name: company.name, domain: company.domain };

  const kinds: ResearchKind[] = ["overview", "momentumSignal", "founderContent"];

  const results = await Promise.all(
    kinds.map(async (kind) => {
      const prompt = PROMPT_BUILDERS[kind](ctx);
      const queryHash = hashQuery({ companyId, kind, prompt });

      if (opts.useCache) {
        const cached = await db.researchCache.findUnique({ where: { queryHash } });
        if (cached && cached.expiresAt > new Date()) {
          return { kind, result: cached.result as unknown as ResearchResult };
        }
      }

      const result = await webResearch({ prompt });

      await db.researchCache.upsert({
        where: { queryHash },
        update: {
          result: serializeResult(result),
          citations: result.citations as unknown as object,
          expiresAt: new Date(Date.now() + CACHE_TTL_MS),
        },
        create: {
          queryHash,
          source: "openai-web-search",
          query: prompt,
          result: serializeResult(result),
          citations: result.citations as unknown as object,
          expiresAt: new Date(Date.now() + CACHE_TTL_MS),
        },
      });

      return { kind, result };
    }),
  );

  const byKind = results.reduce<Record<string, ResearchResult>>((acc, r) => {
    acc[r.kind] = r.result;
    return acc;
  }, {});

  await db.companyResearch.upsert({
    where: { companyId },
    update: {
      overview: serializeResult(byKind.overview),
      momentumSignal: serializeResult(byKind.momentumSignal),
      founderContent: serializeResult(byKind.founderContent),
      refreshedAt: new Date(),
      expiresAt: new Date(Date.now() + CACHE_TTL_MS),
    },
    create: {
      companyId,
      overview: serializeResult(byKind.overview),
      momentumSignal: serializeResult(byKind.momentumSignal),
      founderContent: serializeResult(byKind.founderContent),
      expiresAt: new Date(Date.now() + CACHE_TTL_MS),
    },
  });

  await db.company.update({
    where: { id: companyId },
    data: company.status === "Sourced" ? { status: "Researched" } : {},
  });

  await logActivity({
    type: "research-cached",
    companyId,
    payload: { kinds },
  });

  await extractCompanyFactsFromOverview(companyId, byKind.overview?.text ?? "").catch((e) => {
    console.warn("extractCompanyFactsFromOverview skipped:", (e as Error).message);
  });
  await scoreCompanyFit(companyId).catch((e) => {
    console.warn("post-research fit score skipped:", (e as Error).message);
  });
}

export async function extractCompanyFactsFromOverview(
  companyId: string,
  overviewText: string,
): Promise<void> {
  if (!overviewText.trim()) return;

  const company = await db.company.findUniqueOrThrow({ where: { id: companyId } });

  const result = await openaiJson<{
    headcount: number | null;
    stage: string | null;
    sector: string | null;
  }>({
    system:
      'Extract structured company facts from a research overview. Return JSON only: {"headcount": <integer or null>, "stage": <string or null>, "sector": <string or null>}. headcount is the best estimate as an integer (e.g., 250 for "200-300 employees"). stage is one of: "pre-seed", "seed", "series-a", "series-b", "series-c", "series-d+", "growth", "public", "private". sector is a short descriptor (e.g., "AI infra", "developer tools", "fintech"). Use null if a fact is not present. Do not invent.',
    user: `Overview text:\n\n${overviewText.slice(0, 4000)}`,
    model: "gpt-5.4-mini",
    maxTokens: 200,
  });

  await db.company.update({
    where: { id: companyId },
    data: {
      headcount: company.headcount ?? result.data.headcount ?? undefined,
      stage: company.stage ?? result.data.stage ?? undefined,
      sector: company.sector ?? result.data.sector ?? undefined,
    },
  });
}

function hashQuery(input: { companyId: string; kind: string; prompt: string }): string {
  return createHash("sha256")
    .update(`${input.companyId}|${input.kind}|${input.prompt}`)
    .digest("hex");
}

function serializeResult(r: ResearchResult): object {
  return {
    text: r.text,
    citations: r.citations,
    meta: r.meta,
  };
}

// Stub. The Quanta-fit scorer lands in the AI-prompts task; this returns null
// for now so callers can stay wired up.
export async function scoreCompanyFit(_companyId: string): Promise<null> {
  return null;
}
