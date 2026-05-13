import type { SourceParser, ParserFormat } from "./types";
import { urlListParser } from "./url-list";
import { singleUrlParser } from "./single-url";

const PARSERS: SourceParser[] = [urlListParser, singleUrlParser];

export function detectFormat(input: string): ParserFormat | null {
  for (const p of PARSERS) {
    if (p.matches(input)) return p.format;
  }
  return null;
}

export function getParser(format: ParserFormat): SourceParser {
  const p = PARSERS.find((x) => x.format === format);
  if (!p) throw new Error(`No parser for format: ${format}`);
  return p;
}
