/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lgujsninpjeefmrykudu.supabase.co',
      },
    ],
  },
}

module.exports = nextConfig
