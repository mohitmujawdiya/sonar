export type ParsedCompanyUrl = {
  url: string;
  domain: string;
  inferredName: string;
};

// Handle-extracting patterns for the common founder-profile shapes. The
// goal: paste a LinkedIn / Twitter / GitHub / personal-site URL and have
// the deal record land with a useful name before research even fires.
const HANDLE_PATTERNS: Array<{ host: RegExp; pathHandle: RegExp }> = [
  { host: /linkedin\.com$/i, pathHandle: /^\/in\/([\w-]+)/i },
  { host: /(twitter|x)\.com$/i, pathHandle: /^\/([\w-]+)/i },
  { host: /github\.com$/i, pathHandle: /^\/([\w-]+)/i },
];

export function parseCompanyUrl(input: string): ParsedCompanyUrl | null {
  let url: URL;
  try {
    url = new URL(input.trim().startsWith("http") ? input.trim() : `https://${input.trim()}`);
  } catch {
    return null;
  }

  const domain = url.hostname.replace(/^www\./, "");

  for (const { host, pathHandle } of HANDLE_PATTERNS) {
    if (host.test(domain)) {
      const match = url.pathname.match(pathHandle);
      if (match) {
        const handle = match[1];
        return {
          url: url.toString(),
          // Keep the handle on the domain so dedup works per-handle, not
          // per-platform (linkedin.com/in/jane and linkedin.com/in/john
          // would otherwise collide).
          domain: `${domain}/${handle.toLowerCase()}`,
          inferredName: titleize(handle),
        };
      }
    }
  }

  return {
    url: url.toString(),
    domain,
    inferredName: titleize(domain.split(".")[0]),
  };
}

function titleize(s: string): string {
  return s
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}
