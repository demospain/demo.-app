import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/DashboardClient'

const R2_PUBLIC = 'https://pub-5ad091444ab84f6e979864f025aa8867.r2.dev'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarded, username, avatar_url')
    .eq('id', user.id)
    .single()

  if (!profile?.onboarded) redirect('/onboarding')

  const { data: myProjectsRaw } = await supabase
    .from('projects')
    .select('id, title, cover_url, visibility, status, created_at, owner_id, share_slug')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  const { data: savedRaw } = await supabase
    .from('saved_projects')
    .select('project_id, projects(id, title, cover_url, visibility, status, created_at, owner_id, share_slug)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Prefijar cover_url con R2 si es ruta relativa
  const prefixCover = (p: any) => ({
    ...p,
    cover_url: p.cover_url
      ? p.cover_url.startsWith('http') ? p.cover_url : `${R2_PUBLIC}/${p.cover_url}`
      : null
  })

  const myProjects = (myProjectsRaw ?? []).map(prefixCover)

  const savedProjects = (savedRaw ?? [])
    .map(row => row.projects)
    .filter(Boolean)
    .flat()
    .map(prefixCover) as {
      id: string; title: string; cover_url: string | null;
      visibility: string; status: string; created_at: string;
      owner_id?: string; share_slug?: string
    }[]

  const ownerIds = Array.from(new Set(savedProjects.map((p: any) => p.owner_id).filter(Boolean))) as string[]
  let ownerNames: Record<string, string> = {}
  if (ownerIds.length > 0) {
    const { data: owners } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', ownerIds)
    owners?.forEach(o => { ownerNames[o.id] = o.username })
  }

  const avatarUrl = profile?.avatar_url
    ? profile.avatar_url.startsWith('http')
      ? profile.avatar_url
      : `${R2_PUBLIC}/${profile.avatar_url}`
    : null

  const inicial = (profile?.username?.[0] ?? user.email?.[0] ?? '?').toUpperCase()

  return (
    <div className="min-h-screen bg-[#0C0D0F] text-[#F8F7F4]">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-[72px] bg-[#0C0D0F]/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-8 h-full flex items-center justify-between">
          <a href="/dashboard" className="font-mono text-[28px] font-medium tracking-tight hover:opacity-80 transition-opacity leading-none">
            demo<span className="text-[#6E62F5]">.</span>
          </a>
          <div className="flex items-center gap-2">
            <a href="/profile">
              <div className="h-10 w-10 rounded-xl bg-[#F8F7F4] flex items-center justify-center text-sm font-bold text-[#0C0D0F] overflow-hidden hover:bg-white transition-colors">
                {avatarUrl
                  ? <img src={avatarUrl} alt="" className="w-full h-full object-cover"/>
                  : inicial
                }
              </div>
            </a>
          </div>
        </div>
      </nav>

      <main className="pt-[72px]">
        <div className="max-w-6xl mx-auto px-8 py-10">
          <DashboardClient
            userId={user.id}
            userName={profile?.username ?? ''}
            initialProjects={myProjects}
            savedProjects={savedProjects}
            ownerNames={ownerNames}
          />
        </div>
      </main>
    </div>
  )
}
