import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),
  OPENAI_API_KEY: z.string().optional().default(""),
  GITHUB_TOKEN: z.string().optional().default(""),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;

export function requireOpenAIKey(): string {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY missing — set it in .env.local before invoking OpenAI");
  }
  return env.OPENAI_API_KEY;
}
