/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcrypt'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
