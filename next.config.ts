import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output is for Docker — Vercel handles its own output.
  ...(process.env.BUILD_STANDALONE === "1" ? { output: "standalone" as const } : {}),
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
};

export default nextConfig;
