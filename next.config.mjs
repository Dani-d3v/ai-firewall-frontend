import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = dirname(fileURLToPath(import.meta.url));
const rawBackendOrigin =
  process.env.BACKEND_API_ORIGIN ||
  "ai-firewall-backend-production.up.railway.app";
const backendOrigin = rawBackendOrigin.startsWith("http")
  ? rawBackendOrigin
  : `https://${rawBackendOrigin}`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: workspaceRoot,
  },
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: `${backendOrigin}/:path*`,
      },
    ];
  },
};

export default nextConfig;
