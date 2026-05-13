import { env } from "../../env";
import type { ScanCandidate, ScanSource } from "./types";

type GhRepo = {
  full_name: string;
  name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  owner: { login: string; html_url: string; type: string };
  homepage: string | null;
  created_at: string;
  pushed_at: string;
};

type GhSearchResponse = {
  items: GhRepo[];
};

// AI/ML/LLM topic search, repos created in last 90 days, sorted by stars.
// Anonymous calls are rate-limited to 60/hr; GITHUB_TOKEN bumps to 5000/hr.
const GH_API = "https://api.github.com/search/repositories";

export const githubTrendingSource: ScanSource = {
  id: "github",
  label: "GitHub trending",

  async scan(): Promise<ScanCandidate[]> {
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const query = `topic:ai created:>${since} stars:>50`;
    const url = `${GH_API}?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=30`;

    const headers: HeadersInit = { Accept: "application/vnd.github+json" };
    if (env.GITHUB_TOKEN) headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;

    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`GitHub Search returned ${res.status}`);
    const body = (await res.json()) as GhSearchResponse;

    return body.items
      .filter((r) => r.owner.type === "User" || r.stargazers_count > 200)
      .map((r): ScanCandidate => ({
        source: "github",
        name: r.name,
        // Prefer homepage if set; falls back to the repo URL itself.
        url: r.homepage || r.html_url,
        founderHandle: r.owner.login,
        snippet: r.description || `${r.stargazers_count} stars · ${r.language ?? "—"}`,
        sourceUrl: r.html_url,
        metadata: {
          stars: r.stargazers_count,
          language: r.language,
          ownerType: r.owner.type,
          ownerUrl: r.owner.html_url,
          createdAt: r.created_at,
          pushedAt: r.pushed_at,
        },
      }));
  },
};
