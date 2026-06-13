'use client'

import { PlayerProvider } from '@/lib/PlayerContext'
import GlobalPlayer from '@/components/GlobalPlayer'

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PlayerProvider>
      {children}
      <GlobalPlayer />
    </PlayerProvider>
  )
}
