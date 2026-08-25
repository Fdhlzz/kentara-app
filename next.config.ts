import type { NextConfig } from "next";
import { getSecurityHeadersList } from "./lib/security/headers";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: getSecurityHeadersList(),
      },
    ];
  },
};

export default nextConfig;
