import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// CSP: lock to what Sonar actually uses. Self-hosted scripts + styles (Next.js
// + Tailwind both need 'unsafe-inline'), data: URIs for image fallbacks, and
// Vercel's first-party telemetry endpoints. 'unsafe-eval' is dev-only for
// Next.js hot-reload.
const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self' https://va.vercel-scripts.com https://vitals.vercel-insights.com",
  "worker-src 'self' blob:",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
];

const csp = cspDirectives.join("; ");

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        {
          key: "X-Frame-Options",
          value: "DENY",
        },
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
        {
          key: "Content-Security-Policy",
          value: csp,
        },
      ],
    },
  ],
};

export default nextConfig;
