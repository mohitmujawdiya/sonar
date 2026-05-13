import { db } from "../db";
import type { ScanCandidate, ScanSource, ScanSourceId } from "./parsers/types";
import { hnShowSource } from "./parsers/hn-show";
import { githubTrendingSource } from "./parsers/github-trending";
import { huggingFaceSource } from "./parsers/hugging-face";
import { parseCompanyUrl } from "./url-parse";

const SOURCES: Record<ScanSourceId, ScanSource> = {
  hn: hnShowSource,
  github: githubTrendingSource,
  huggingface: huggingFaceSource,
};

export type ScanResult = {
  bySource: Record<ScanSourceId, { ok: boolean; count: number; error?: string }>;
  candidates: (ScanCandidate & { existingCompanyId: string | null })[];
};

export async function runScan(sourceIds: ScanSourceId[]): Promise<ScanResult> {
  const settled = await Promise.allSettled(
    sourceIds.map(async (id) => ({ id, candidates: await SOURCES[id].scan() })),
  );

  const bySource = {} as ScanResult["bySource"];
  const all: ScanCandidate[] = [];

  for (let i = 0; i < sourceIds.length; i++) {
    const id = sourceIds[i];
    const r = settled[i];
    if (r.status === "fulfilled") {
      bySource[id] = { ok: true, count: r.value.candidates.length };
      all.push(...r.value.candidates);
    } else {
      bySource[id] = {
        ok: false,
        count: 0,
        error: r.reason instanceof Error ? r.reason.message : String(r.reason),
      };
    }
  }

  // Dedup against existing companies by domain.
  const domains = new Set<string>();
  for (const c of all) {
    const parsed = parseCompanyUrl(c.url);
    if (parsed) domains.add(parsed.domain);
  }
  const existing = domains.size
    ? await db.company.findMany({
        where: { domain: { in: [...domains] } },
        select: { id: true, domain: true },
      })
    : [];
  const existingByDomain = new Map(existing.map((c) => [c.domain ?? "", c.id]));

  const candidates = all.map((c) => {
    const parsed = parseCompanyUrl(c.url);
    const existingId = parsed ? existingByDomain.get(parsed.domain) ?? null : null;
    return { ...c, existingCompanyId: existingId };
  });

  return { bySource, candidates };
}
