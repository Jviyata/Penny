import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No "N" badge in dev, so screen recordings look like the real app.
  devIndicators: false,
  // There's an unrelated package-lock.json higher up; pin the project root explicitly.
  outputFileTracingRoot: process.cwd(),
  turbopack: { root: process.cwd() },
  // Load prompts/system.txt with the /api/check function on Vercel.
  outputFileTracingIncludes: {
    "/api/check": ["./prompts/**/*"],
  },
};

export default nextConfig;
