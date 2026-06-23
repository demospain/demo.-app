'use client'

import { useEffect } from 'react'
import { PlayerProvider } from '@/lib/PlayerContext'
import { createClient } from '@/lib/supabase'

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    const onInstall = async () => {
      const ua = navigator.userAgent
      let platform = 'desktop'
      if (/iPhone|iPad|iPod/.test(ua)) platform = 'ios'
      else if (/Android/.test(ua)) platform = 'android'

      const supabase = createClient()
      await supabase.from('app_installs').insert({
        platform,
        user_agent: ua,
      })
    }

    window.addEventListener('appinstalled', onInstall)
    return () => window.removeEventListener('appinstalled', onInstall)
  }, [])

  return (
    <PlayerProvider>
      {children}
    </PlayerProvider>
  )
}
