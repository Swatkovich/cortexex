import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/cortexex',
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '/cortexex',
  output: 'standalone',
};

export default nextConfig;
