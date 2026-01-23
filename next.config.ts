import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "true";
const basePath = isGithubPages ? "/real-estate-sim" : "";

const nextConfig: NextConfig = {
  basePath,
  assetPrefix: basePath ? `${basePath}/` : "",
  output: "export",
  images: {
    unoptimized: true
  }
};

export default nextConfig;
