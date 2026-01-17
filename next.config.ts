import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  distDir: '.next_v3',
};

export default nextConfig;
