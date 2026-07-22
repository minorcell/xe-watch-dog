import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/*": ["./app/data/**/*.yaml"],
  },
};

export default nextConfig;
