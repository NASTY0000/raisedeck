/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["bcryptjs", "@prisma/client"],
    outputFileTracingIncludes: {
      "/*": ["./prisma/seed.db"],
    },
  },
};

export default nextConfig;
