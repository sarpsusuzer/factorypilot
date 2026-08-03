import type { NextConfig } from "next";

// GitHub Pages serves this repo at /factorypilot/, not the domain root, so
// every route and asset URL needs that prefix baked in at build time.
const REPO_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath: REPO_BASE_PATH,
  images: { unoptimized: true },
};

export default nextConfig;
