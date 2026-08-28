import type { NextConfig } from "next";

function r2RemotePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
    { protocol: "https", hostname: "*.r2.dev" },
  ];
  const base = process.env.R2_PUBLIC_BASE_URL?.trim();
  if (!base) return patterns;
  try {
    const url = new URL(base);
    const protocol = url.protocol === "http:" ? "http" : "https";
    if (url.hostname && url.hostname !== "*.r2.dev") {
      patterns.push({ protocol, hostname: url.hostname });
    }
  } catch {
    // Invalid R2_PUBLIC_BASE_URL — keep the r2.dev wildcard.
  }
  return patterns;
}

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@blocknote/core",
    "@blocknote/react",
    "@blocknote/shadcn",
    "@aws-sdk/client-s3",
    "@aws-sdk/s3-request-presigner",
  ],
  images: {
    remotePatterns: r2RemotePatterns(),
  },
  transpilePackages: ["heic-to"],
};

export default nextConfig;
