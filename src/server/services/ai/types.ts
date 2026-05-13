/**
 * Shared types for AI adapters. Service-layer code should only depend on these
 * shapes — never on raw provider response types — so swapping providers stays
 * a one-file change.
 */

export type CitationLink = {
  title: string;
  url: string;
  snippet?: string;
};

export type ResearchResult = {
  /** Free-form summary text in markdown. */
  text: string;
  /** Structured fields parsed from the response, when prompt asks for JSON. */
  structured?: Record<string, unknown>;
  /** Source URLs Perplexity grounded against. */
  citations: CitationLink[];
  /** Provider + model that produced this. */
  meta: {
    provider: "openai" | "perplexity" | "claude";
    model: string;
    latencyMs: number;
  };
};

export class AiError extends Error {
  constructor(
    public readonly provider: "openai" | "perplexity" | "claude",
    public readonly kind: "auth" | "rate-limit" | "timeout" | "bad-response" | "unknown",
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AiError";
  }
}
