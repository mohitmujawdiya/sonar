import OpenAI from "openai";
import { AiError } from "./types";

let _client: OpenAI | null = null;
let _clientApiKey: string | null = null;

export function openaiClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new AiError("openai", "auth", "OPENAI_API_KEY not set");
  }
  if (!_client || _clientApiKey !== apiKey) {
    _client = new OpenAI({ apiKey });
    _clientApiKey = apiKey;
  }
  return _client;
}
