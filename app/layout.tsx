import type { Metadata } from 'next'
import './globals.css'

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
      <body className="min-h-screen bg-[#0d0d0f] text-[#F8F7F4] antialiased">
        {children}
      </body>
    </html>
  )
}
