'use client'

import { useEffect } from 'react'
import { PlayerProvider } from '@/lib/PlayerContext'

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  return (
    <PlayerProvider>
      {children}
    </PlayerProvider>
  )
}
