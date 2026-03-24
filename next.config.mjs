import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = dirname(fileURLToPath(import.meta.url));
const backendOrigin =
  process.env.BACKEND_API_ORIGIN ||
  "https://ai-firewall-backend-dani-d3v8671-ooua5n91.leapcell.dev";

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
