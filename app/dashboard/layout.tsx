import { PlayerProvider } from '@/lib/PlayerContext'

export default function DashboardLayout({
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
