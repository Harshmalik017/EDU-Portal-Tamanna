const { version } = require("./package.json");
const security = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
];
module.exports = {
  reactStrictMode: true,
  poweredByHeader: false,
  env: { NEXT_PUBLIC_APP_VERSION: version },
  experimental: { optimizePackageImports: ["lucide-react"] },
  async headers() {
    return [
      { source: "/(.*)", headers: security },
      { source: "/brand/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
    ];
  },
};
