import type { NextConfig } from "next";
import { getSecurityHeadersList } from "./lib/security/headers";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2592000, // Cache optimized images for 30 days
    deviceSizes: [360, 414, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns", "sonner", "@base-ui/react"],
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
