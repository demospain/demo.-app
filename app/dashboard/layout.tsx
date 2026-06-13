import { PlayerProvider } from '@/lib/PlayerContext'
import GlobalPlayer from '@/components/GlobalPlayer'

export default function DashboardLayout({
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
