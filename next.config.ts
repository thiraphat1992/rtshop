import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    preloadEntriesOnStart: false,
    turbopackSourceMaps: false,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "**.cloudinary.com" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
    localPatterns: [
      { pathname: "/uploads/**" },
    ],
  },
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
};

export default nextConfig;
