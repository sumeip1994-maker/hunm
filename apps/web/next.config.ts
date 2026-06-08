import type { NextConfig } from "next";

const apiInternalBaseUrl = process.env.API_INTERNAL_BASE_URL || "http://localhost:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiInternalBaseUrl}/:path*`
      }
    ];
  }
};

export default nextConfig;
