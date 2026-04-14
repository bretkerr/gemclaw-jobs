import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/core", "@repo/greenhouse", "@repo/ai", "@repo/resume", "@repo/linkedin-parser"],
};

export default nextConfig;
