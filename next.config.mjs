import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = dirname(fileURLToPath(import.meta.url));
const rawBackendOrigin =
  process.env.BACKEND_API_ORIGIN ||
  "http://localhost:5000";
const isLocalBackendOrigin = /^(localhost|127(?:\.\d{1,3}){3})(:\d+)?$/i.test(
  rawBackendOrigin,
);
const backendOrigin = rawBackendOrigin.startsWith("http")
  ? rawBackendOrigin
  : `${isLocalBackendOrigin ? "http" : "https"}://${rawBackendOrigin}`;

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
