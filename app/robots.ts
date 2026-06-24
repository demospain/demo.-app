import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/landing',
          '/instalar',
          '/login',
          '/privacy',
          '/terms',
          '/cookies',
        ],
        disallow: [
          '/dashboard',
          '/dashboard/',
          '/profile',
          '/onboarding',
          '/reset-password',
          '/api/',
        ],
      },
    ],
    sitemap: 'https://www.demospain.app/sitemap.xml',
    host: 'https://www.demospain.app',
  }
}
