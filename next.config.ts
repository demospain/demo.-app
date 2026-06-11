import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lgujsninpjeefmrykudu.supabase.co',
      },
    ],
  },
}

export default nextConfig
