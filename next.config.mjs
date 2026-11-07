const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

/** @type {import("next").NextConfig} */
export default {
  // Server Actions default to a 1 MB body limit; photos can be up to 5 MB.
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
  async headers() { return [{ source: "/(.*)", headers: securityHeaders }]; },
};
