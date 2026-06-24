import type { Metadata, Viewport } from 'next'
import { Inter, DM_Mono } from 'next/font/google'
import './globals.css'
import ClientProviders from '@/components/ClientProviders'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'demo. — Comparte tu música antes de publicarla',
    template: '%s — demo.',
  },
  description: 'La app para músicos independientes. Sube, organiza y comparte tus demos antes de lanzarlas al mundo. Gratis, sin instalación de tienda.',
  keywords: [
    'demo musical', 'compartir demos', 'app músicos independientes',
    'demos antes de publicar', 'organizar música', 'compartir música privada',
    'reproductor demos', 'app artistas', 'maquetas musicales', 'demo app',
  ],
  authors: [{ name: 'demo.', url: 'https://www.demospain.app' }],
  creator: 'demo.',
  publisher: 'demo.',
  metadataBase: new URL('https://www.demospain.app'),
  alternates: {
    canonical: 'https://www.demospain.app/landing',
  },
  openGraph: {
    title: 'demo. — Tu música, antes de existir para el mundo',
    description: 'Sube, organiza y comparte tus demos antes de publicarlas. La app para músicos independientes.',
    url: 'https://www.demospain.app',
    siteName: 'demo.',
    locale: 'es_ES',
    type: 'website',
    images: [
      {
        url: '/icon-512.png',
        width: 512,
        height: 512,
        alt: 'demo. — app para músicos independientes',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'demo. — Tu música, antes de existir para el mundo',
    description: 'Sube, organiza y comparte tus demos antes de publicarlas.',
    images: ['/icon-512.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
    },
  },
  appleWebApp: {
    capable: true,
    title: 'demo.',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    apple: '/icon-192.png',
    icon: '/icon-192.png',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  themeColor: '#0f1117',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${dmMono.variable}`}>
      <body className="min-h-screen bg-[#0f1117] text-[#EAE9E6] antialiased">
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}
