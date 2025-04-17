import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/real-estate-sim",
  assetPrefix: "/real-estate-sim/",
  output: "export",
  images: {
    unoptimized: true
  }
};

export default nextConfig;
