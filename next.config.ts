import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-44a9494ef0dd4215be12bf9302a57a60.r2.dev",
      },
    ],
  },
};

export default nextConfig;
