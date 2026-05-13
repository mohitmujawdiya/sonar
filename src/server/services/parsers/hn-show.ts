import type { ScanCandidate, ScanSource } from "./types";

type AlgoliaHit = {
  objectID: string;
  title: string | null;
  url: string | null;
  author: string;
  created_at: string;
  points: number | null;
  num_comments: number | null;
  story_text?: string | null;
};

type AlgoliaResponse = {
  hits: AlgoliaHit[];
};

// HN Show posts from the last 30 days, sorted by points (defacto trending).
const HN_API = "https://hn.algolia.com/api/v1/search?tags=show_hn&hitsPerPage=30";

export const hnShowSource: ScanSource = {
  id: "hn",
  label: "HN Show-HN",

  async scan(): Promise<ScanCandidate[]> {
    const cutoff = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
    const res = await fetch(`${HN_API}&numericFilters=created_at_i>${cutoff}`);
    if (!res.ok) throw new Error(`HN Algolia returned ${res.status}`);
    const body = (await res.json()) as AlgoliaResponse;

    return body.hits
      .filter((h) => h.url && h.title)
      .map((h): ScanCandidate => {
        const cleanTitle = (h.title ?? "")
          .replace(/^Show HN:\s*/i, "")
          .replace(/\s+[—-]\s+.+$/, "");
        const snippet = h.story_text
          ? stripHtml(h.story_text).slice(0, 240)
          : `${h.points ?? 0} points · ${h.num_comments ?? 0} comments`;
        return {
          source: "hn",
          name: cleanTitle.trim() || "(untitled)",
          url: h.url!,
          founderHandle: h.author,
          snippet,
          sourceUrl: `https://news.ycombinator.com/item?id=${h.objectID}`,
          metadata: {
            points: h.points,
            comments: h.num_comments,
            createdAt: h.created_at,
          },
        };
      });
  },
};

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}
