const { version } = require("./package.json");
const isDev = process.env.NODE_ENV === "development";
const configuredOrigin = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").match(/^https?:\/\/[^/]+/)?.[0] ?? "";
const configuredSocket = configuredOrigin.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' blob: data: ${configuredOrigin}`.trim(),
  "font-src 'self'",
  `connect-src 'self' ${configuredOrigin} ${configuredSocket}`.trim(),
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "frame-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");
const security = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
];
module.exports = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: { agentUpgrade: "security" },
  env: { NEXT_PUBLIC_APP_VERSION: version },
  async headers() {
    return [
      { source: "/(.*)", headers: security },
      { source: "/admin/reports", headers: [
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "Content-Security-Policy", value: contentSecurityPolicy.replace("frame-ancestors 'none'", "frame-ancestors 'self'") },
      ] },
      { source: "/brand/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
    ];
  },
};
