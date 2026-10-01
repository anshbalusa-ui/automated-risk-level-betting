import type { NextConfig } from "next";

const pages = process.env.GITHUB_PAGES === "true";
const nextConfig: NextConfig = pages
  ? {
      output: "export",
      basePath: "/automated-risk-level-betting",
      trailingSlash: true,
      env: { NEXT_PUBLIC_APP_BASE_PATH: "/automated-risk-level-betting" },
    }
  : {};

export default nextConfig;
