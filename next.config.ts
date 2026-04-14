import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  allowedDevOrigins: [
    "192.168.10.130",
    "192.168.1.*",
    "192.168.0.*",
    "10.0.0.*",
  ],
};

export default nextConfig;
