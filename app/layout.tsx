import { PlayerProvider } from '@/lib/PlayerContext'
import GlobalPlayer from '@/components/GlobalPlayer'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <PlayerProvider>
      <div className="min-h-screen bg-[#0d0d0f]">
        {children}
        <GlobalPlayer/>
      </div>
    </PlayerProvider>
  )
}
