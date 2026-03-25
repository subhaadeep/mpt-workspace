/** @type {import('next').NextConfig} */
const nextConfig = {
  // Do NOT use standalone - incompatible with Vercel
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
