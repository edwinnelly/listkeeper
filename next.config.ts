import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  //  output: "export", // static export
  reactStrictMode: false,

  typescript: {
    ignoreBuildErrors: true, // ✅ THIS is what you need
  },

  images: {
    domains: ["cdn3.iconfinder.com"],
    unoptimized: true,
  },
};

export default nextConfig;