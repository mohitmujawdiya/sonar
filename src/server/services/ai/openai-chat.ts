import { openaiClient } from "./openai-client";
import { AiError } from "./types";

export type OpenAIChatModel = "gpt-5.5" | "gpt-5.5-pro" | "gpt-5.4" | "gpt-5.4-mini" | "gpt-5.4-nano" | string;

export type OpenAIJsonRequest = {
  user: string;
  system?: string;
  model: OpenAIChatModel;
  /** Max output tokens. Default 2048. */
  maxTokens?: number;
};

export type OpenAIJsonResult<T> = {
  data: T;
  meta: { provider: "openai"; model: OpenAIChatModel; latencyMs: number };
};

/**
 * Calls OpenAI Responses API and parses the result as JSON.
 * Strips ```json fences automatically.
 *
 * If the first attempt returns malformed JSON (most common cause: response
 * truncation at the token cap), retries once with a 1.5× token budget. This
 * recovers gracefully from the scenario that bit us with DeepSpace during
 * initial seeding — the JSON was syntactically valid except for being cut
 * off mid-string, and the strict parser rejected the whole response.
 *
 * Throws AiError("bad-response") if both attempts fail.
 */
export async function openaiJson<T>(req: OpenAIJsonRequest): Promise<OpenAIJsonResult<T>> {
  const start = Date.now();
  const input = req.system ? `${req.system}\n\n${req.user}` : req.user;
  const baseTokens = req.maxTokens ?? 2048;

  let cleaned = "";

  for (let attempt = 1; attempt <= 2; attempt++) {
    const maxTokensThisAttempt = attempt === 1 ? baseTokens : Math.round(baseTokens * 1.5);

    let response;
    try {
      response = await openaiClient().responses.create({
        model: req.model,
        input,
        max_output_tokens: maxTokensThisAttempt,
        text: { format: { type: "json_object" } },
      });
    } catch (e) {
      const err = e as { status?: number; message?: string };
      const kind =
        err.status === 401 || err.status === 403
          ? "auth"
          : err.status === 429
          ? "rate-limit"
          : "unknown";
      throw new AiError("openai", kind, err.message ?? "OpenAI Responses request failed", e);
    }

    const text = response.output_text ?? "";
    cleaned = stripFences(text);
    try {
      const data = JSON.parse(cleaned) as T;
      return {
        data,
        meta: {
          provider: "openai",
          model: req.model,
          latencyMs: Date.now() - start,
        },
      };
    } catch {
      // Fall through to retry. Most common cause: truncation at token cap.
      // Bumping tokens on retry usually recovers.
    }
  }

  throw new AiError(
    "openai",
    "bad-response",
    `OpenAI returned non-JSON after retry: ${cleaned.slice(0, 200)}`,
  );
}

function stripFences(s: string): string {
  return s
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();
}
