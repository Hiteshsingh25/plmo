import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["three"],
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
