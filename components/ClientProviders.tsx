'use client'

import { PlayerProvider } from '@/lib/PlayerContext'

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PlayerProvider>
      {children}
    </PlayerProvider>
  )
}
