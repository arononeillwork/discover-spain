import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server in .next/standalone (server.js plus only the node_modules it
  // needs). The Dockerfile copies it into a small runtime image.
  output: "standalone",
};

export default nextConfig;
