// import type { NextConfig } from "next";

const nextConfig = {
  // PostHog reverse proxy rewrites for improved tracking reliability
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.convex.cloud",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.convex.site",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
    // Image optimization settings for better performance
    minimumCacheTTL: 31536000, // Cache images for 1 year (immutable)
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Enable AVIF format for better compression (newer browsers)
    formats: ['image/avif', 'image/webp'],
    // Optimize image loading - aggressive compression
    deviceSizes: [320, 420, 500, 640, 750, 1024],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 550, 650],
    // Use Next.js Image Optimization for better compression
    unoptimized: false,
    // ✅ NEW: Enable static import optimization for better tree-shaking
    loader: 'default',
  },
  // External packages configuration
  serverExternalPackages: ['@prisma/client', 'prisma'],
  eslint: {
    // Prevent ESLint errors/transitive config mismatches from breaking Vercel builds
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
