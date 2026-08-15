/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  basePath: "/app",
  assetPrefix: "/app",
  trailingSlash: false,
  // Only used when running `next dev`/`next start` directly on the host
  // (no nginx in front). Under Docker Compose, nginx's `^~ /api/` location
  // intercepts every /api/* request before it ever reaches this server, so
  // this rewrite is unreachable there and safe to keep for local dev.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8000/api/:path*",
        basePath: false,
      },
    ];
  },
};

module.exports = nextConfig;
