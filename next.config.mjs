/** @type {import('next').NextConfig} */

// Derive the Supabase origin so the CSP can allow the browser to reach auth/DB
// and load avatar images from storage. Falls back to a wildcard if unset at
// build time.
let supabaseOrigin = "https://*.supabase.co";
try {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    supabaseOrigin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin;
  }
} catch {
  // keep the wildcard fallback
}

// Content-Security-Policy (M4). Shipped as REPORT-ONLY: it does NOT block
// anything, only reports violations to the browser console, so it cannot break
// the live site. The app has inline scripts (the no-flash theme script here +
// Next.js's own framework/hydration scripts), so promoting this to an ENFORCING
// `Content-Security-Policy` header first requires per-request nonces via
// middleware and dropping `'unsafe-inline'` from script-src. Until then this
// still gives visibility and locks down framing, form targets, and base-uri.
const cspReportOnly = [
  `default-src 'self'`,
  `base-uri 'self'`,
  `object-src 'none'`,
  `frame-ancestors 'none'`,
  `form-action 'self'`,
  `img-src 'self' data: blob: ${supabaseOrigin}`,
  `font-src 'self' data:`,
  `style-src 'self' 'unsafe-inline'`,
  `script-src 'self' 'unsafe-inline'`,
  `connect-src 'self' ${supabaseOrigin} https://api.stripe.com`,
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy-Report-Only", value: cspReportOnly },
  // Force HTTPS for a year, include subdomains.
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  // Block MIME-type sniffing.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Disallow embedding in iframes from other origins.
  { key: "X-Frame-Options", value: "DENY" },
  // Don't leak full URL to third-party links.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Lock down what features the page can request. camera=(self) enables the
  // profile-photo live capture on our own pages (still blocked for embeds).
  {
    key: "Permissions-Policy",
    value: "microphone=(self), camera=(self), geolocation=()",
  },
];

const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
