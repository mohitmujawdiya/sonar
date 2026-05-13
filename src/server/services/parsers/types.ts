export type ScanSourceId = "hn" | "github" | "huggingface";

export type ScanCandidate = {
  source: ScanSourceId;
  name: string;
  url: string;
  founderHandle: string | null;
  snippet: string;
  sourceUrl: string;
  metadata?: Record<string, unknown>;
};

export interface ScanSource {
  readonly id: ScanSourceId;
  readonly label: string;
  scan(): Promise<ScanCandidate[]>;
}
