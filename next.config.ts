import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude server-only MongoDB dependencies from client bundle
  serverExternalPackages: ["mongodb", "mongodb-client-encryption"],
};

export default nextConfig;
