/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content-Security-Policy:
 *  - scripts/styles: Next.js needs 'unsafe-inline' (inline hydration/bootstrap);
 *    'unsafe-eval' only in dev (react refresh)
 *  - images: self-hosted assets, Supabase Storage photos, OpenStreetMap tiles
 *  - connect: Supabase REST/auth + Realtime websockets, Nominatim geocoding
 *  - frame-ancestors: allow embedding only by the app itself and the dev
 *    preview host — blocks clickjacking on any other site
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co https://tile.openstreetmap.org",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://nominatim.openstreetmap.org",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self' https://*.e2b.app",
].join("; ");

const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // plain <img> is used app-wide; the optimizer is unused — keep it locked to
  // local webp only (hardens the /_next/image endpoint)
  images: { formats: ["image/webp"] },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self), payment=()",
          },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;
