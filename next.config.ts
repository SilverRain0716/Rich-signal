import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development", // dev에선 SW 비활성화
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {};

export default withPWA(nextConfig);
