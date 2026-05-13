import type { ScanCandidate, ScanSource } from "./types";

type HfSpace = {
  id: string;
  author: string;
  sdk: string | null;
  likes: number;
  cardData?: { title?: string } | null;
  createdAt: string;
  lastModified: string;
};

const HF_API = "https://huggingface.co/api/spaces?sort=trending&direction=-1&limit=30";

export const huggingFaceSource: ScanSource = {
  id: "huggingface",
  label: "Hugging Face Spaces",

  async scan(): Promise<ScanCandidate[]> {
    const res = await fetch(HF_API, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`Hugging Face returned ${res.status}`);
    const body = (await res.json()) as HfSpace[];

    return body.map((s): ScanCandidate => {
      const [authorPart, slug] = s.id.split("/", 2);
      const displayName =
        s.cardData?.title?.trim() || (slug ?? s.id).replace(/[-_]/g, " ").trim();
      return {
        source: "huggingface",
        name: displayName,
        url: `https://huggingface.co/spaces/${s.id}`,
        founderHandle: s.author || authorPart,
        snippet: `${s.likes} likes · ${s.sdk ?? "—"} space`,
        sourceUrl: `https://huggingface.co/${s.author}`,
        metadata: {
          likes: s.likes,
          sdk: s.sdk,
          createdAt: s.createdAt,
          lastModified: s.lastModified,
        },
      };
    });
  },
};
