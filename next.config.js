// import type { NextConfig } from "next";

const nextConfig = {
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
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
    // Reduce automatic preloading to minimize warnings
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Add environment variables from .env files
  env: {
    // AWS Configuration
    S24_AWS_REGION: process.env.S24_AWS_REGION,
    S24_AWS_ACCESS_KEY_ID: process.env.S24_AWS_ACCESS_KEY_ID,
    S24_AWS_SECRET_ACCESS_KEY: process.env.S24_AWS_SECRET_ACCESS_KEY,
    S24_AWS_BUCKET_NAME: process.env.S24_AWS_BUCKET_NAME,
    // Google Maps API Key
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
    // Cognito Configuration
    NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID: process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID,
    NEXT_PUBLIC_AWS_COGNITO_USER_POOL_CLIENT_ID: process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_CLIENT_ID,
    // Database Configuration - explicitly pass DATABASE_URL to server environment
    DATABASE_URL: process.env.DATABASE_URL || process.env.NEXT_PUBLIC_DATABASE_URL,
  },
  // External packages configuration
  serverExternalPackages: ['@prisma/client', 'prisma'],

};

export default nextConfig;
