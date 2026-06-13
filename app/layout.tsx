import type { Metadata } from 'next'
import './globals.css'
import ClientProviders from '@/components/ClientProviders'

export const metadata: Metadata = {
  title: 'demo. — Tu música, antes de existir para el mundo',
  description: 'Sube, organiza y comparte tu música antes de publicarla.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-[#16171e] text-[#F8F7F4] antialiased">
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}
