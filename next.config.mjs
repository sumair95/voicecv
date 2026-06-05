/** @type {import('next').NextConfig} */
const securityHeaders = [
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
  // Lock down what features the page can request.
  {
    key: "Permissions-Policy",
    value: "microphone=(self), camera=(), geolocation=()",
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
