import type { NextConfig } from "next";

// Read version from package.json at build time
const packageJson = require("./package.json");

const nextConfig: NextConfig = {
  // output: "standalone", // For Docker deployment (uncomment for Docker builds)
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    // Allowlist: only the app's S3 avatar/upload bucket. Storage URLs are
    // built in src/lib/storage/index.ts as
    // `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/...` — both
    // the bucket name and region are environment-specific, hence the two
    // wildcard segments. Add a new entry here whenever a new external image
    // source (CDN migration, avatar provider, etc.) is introduced.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
      },
    ],
  },
  // Expose version and build time to the client
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
};

export default nextConfig;
