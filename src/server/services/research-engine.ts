import { createHash } from "node:crypto";
import { db } from "../db";
import { webResearch } from "./ai/web-research";
import {
  companyOverviewPrompt,
  momentumSignalPrompt,
  founderContentPrompt,
  founderPedigreePrompt,
  type CompanyContext,
} from "./ai/prompts/company-research";
import {
  DEFAULT_QUANTA_PRINCIPLES,
  quantaFitSystemPrompt,
  quantaFitUserPrompt,
  type QuantaPrinciple,
} from "./ai/prompts/quanta-fit";
import { logActivity } from "./activity-log";
import type { ResearchResult } from "./ai/types";
import { openaiJson } from "./ai/openai-chat";

const CACHE_TTL_DAYS = 14;
const CACHE_TTL_MS = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;

type ResearchKind = "overview" | "momentumSignal" | "founderContent" | "founderPedigree";

const PROMPT_BUILDERS: Record<ResearchKind, (c: CompanyContext) => string> = {
  overview: companyOverviewPrompt,
  momentumSignal: momentumSignalPrompt,
  founderContent: founderContentPrompt,
  founderPedigree: founderPedigreePrompt,
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

  const kinds: ResearchKind[] = ["overview", "momentumSignal", "founderContent", "founderPedigree"];

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
      founderPedigree: serializeResult(byKind.founderPedigree),
      refreshedAt: new Date(),
      expiresAt: new Date(Date.now() + CACHE_TTL_MS),
    },
    create: {
      companyId,
      overview: serializeResult(byKind.overview),
      momentumSignal: serializeResult(byKind.momentumSignal),
      founderContent: serializeResult(byKind.founderContent),
      founderPedigree: serializeResult(byKind.founderPedigree),
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

  // Facts and founders are independent overview-extraction passes — run them in
  // parallel to shave ~5s off the post-research wait.
  await Promise.all([
    extractCompanyFactsFromOverview(companyId, byKind.overview?.text ?? "").catch((e) => {
      console.warn("extractCompanyFactsFromOverview skipped:", (e as Error).message);
    }),
    extractFoundersFromOverview(companyId, byKind.overview?.text ?? "").catch((e) => {
      console.warn("extractFoundersFromOverview skipped:", (e as Error).message);
    }),
  ]);
  await scoreCompanyFit(companyId).catch((e) => {
    console.warn("post-research quanta-fit skipped:", (e as Error).message);
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
      'Extract structured company facts from a research overview. Return JSON only: {"headcount": <integer or null>, "stage": <string or null>, "sector": <string or null>}. headcount is the best estimate as an integer. stage is one of: "pre-seed", "seed", "series-a", "series-b", "series-c", "series-d+", "growth", "public", "private". sector is a short descriptor (e.g., "AI infra", "developer tools", "fintech"). Use null if a fact is not present. Do not invent.',
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

export async function extractFoundersFromOverview(
  companyId: string,
  overviewText: string,
): Promise<void> {
  if (!overviewText.trim()) return;

  const existingContacts = await db.contact.findMany({
    where: { companyId },
    select: { name: true },
  });
  const existingNames = new Set(existingContacts.map((c) => c.name.toLowerCase()));

  const result = await openaiJson<{
    founders: Array<{ name: string; role: string | null; linkedinUrl: string | null }>;
  }>({
    system:
      'Extract founder/co-founder names from a company research overview. Return JSON only: {"founders": [{"name": "<full name>", "role": "<title like Founder, CEO, CTO, or null>", "linkedinUrl": "<full URL or null>"}]}. Include only people the overview explicitly identifies as founders, co-founders, or in named founding-team roles (e.g., "founding engineer", "CEO and co-founder"). Use null when a field is not in the text. Do not invent people. If no founders are findable, return {"founders": []}.',
    user: `Overview text:\n\n${overviewText.slice(0, 4000)}`,
    model: "gpt-5.4-mini",
    maxTokens: 500,
  });

  for (const founder of result.data.founders) {
    if (!founder.name?.trim()) continue;
    if (existingNames.has(founder.name.trim().toLowerCase())) continue;
    await db.contact.create({
      data: {
        companyId,
        name: founder.name.trim(),
        role: founder.role?.trim() || "Founder",
        linkedinUrl: founder.linkedinUrl?.trim() || null,
      },
    });
  }
}

export type QuantaFitOutput = {
  compositeScore: number;
  compositeReasoning: string;
  principles: Array<{
    name: string;
    signal: "strong" | "weak" | "unknown";
    evidence: string;
    reasoning: string;
  }>;
};

export async function scoreCompanyFit(companyId: string): Promise<QuantaFitOutput | null> {
  const company = await db.company.findUniqueOrThrow({
    where: { id: companyId },
    include: { research: true },
  });

  if (!company.research) return null;

  const profile = await db.profile.findUnique({ where: { id: "singleton" } });

  const principles = (profile?.theses as unknown as QuantaPrinciple[] | null)?.length
    ? (profile!.theses as unknown as QuantaPrinciple[])
    : DEFAULT_QUANTA_PRINCIPLES;

  const r = company.research;
  const research = {
    overview: extractText(r.overview),
    momentumSignal: extractText(r.momentumSignal),
    founderContent: extractText(r.founderContent),
    founderPedigree: extractText(r.founderPedigree),
  };

  const result = await openaiJson<QuantaFitOutput>({
    system: quantaFitSystemPrompt(principles),
    user: quantaFitUserPrompt({
      companyName: company.name,
      thesisMarkdown: profile?.thesisMarkdown ?? null,
      principles,
      research,
    }),
    model: "gpt-5.5",
    // 9 principles × (evidence + reasoning) + compositeReasoning routinely
    // exceeded 2500 tokens for verbose deals, truncating the JSON mid-string
    // and tripping the strict parser. 4000 is comfortable headroom.
    maxTokens: 4000,
  });

  const score = clamp(Math.round(result.data.compositeScore), 0, 100);

  await db.companyResearch.update({
    where: { companyId },
    data: { quantaFit: result.data as unknown as object },
  });

  await db.company.update({
    where: { id: companyId },
    data: { fitScore: score, fitReason: result.data.compositeReasoning.slice(0, 280) },
  });

  await logActivity({
    type: "scored",
    companyId,
    payload: { compositeScore: score },
  });

  return result.data;
}

function extractText(field: unknown): string | null {
  if (!field || typeof field !== "object") return null;
  const r = field as { text?: unknown };
  if (typeof r.text !== "string") return null;
  return r.text;
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

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}
