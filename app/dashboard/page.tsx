import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardClient from '@/components/DashboardClient'
import NotificationBell from '@/components/NotificationBell'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const R2_PUBLIC = 'https://pub-5ad091444ab84f6e979864f025aa8867.r2.dev'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  console.log('[dashboard] user.id resuelto en el servidor:', user.id)

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarded, username, avatar_url')
    .eq('id', user.id)
    .single()

  if (!profile?.onboarded) redirect('/onboarding')

  const { data: myProjectsRaw, error: projectsError } = await supabase
    .from('projects')
    .select('id, title, cover_url, visibility, status, created_at, owner_id, share_slug')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  console.log('[dashboard] proyectos encontrados:', myProjectsRaw?.length ?? 0, '— error:', projectsError ?? 'ninguno')

  const { data: savedRaw } = await supabase
    .from('saved_projects')
    .select('project_id, projects(id, title, cover_url, visibility, status, created_at, owner_id, share_slug)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false)

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
    .filter((p: any) => p.owner_id !== user.id)
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
    <div className="min-h-screen text-[#EAE9E6]" style={{ backgroundColor: '#0f1117' }}>
      <nav className="fixed top-0 left-0 right-0 z-50 h-[72px]" style={{ backgroundColor: '#0f1117' }}>
        <div className="px-6 h-full flex items-center justify-between">
          <Link
            href="/dashboard"
            className="hover:opacity-80 transition-opacity"
            style={{ fontFamily: "var(--font-dm-mono), 'DM Mono', monospace", fontSize: '32px', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1, color: '#EAE9E6', textDecoration: 'none' }}
          >
            demo<span style={{ color: '#6E62F5' }}>.</span>
          </Link>

          <div className="flex items-center gap-2">
            <NotificationBell unreadCount={unreadCount ?? 0} userId={user.id} />

            <Link href="/profile">
              <div
                className="h-10 w-10 rounded-xl overflow-hidden flex items-center justify-center text-sm font-bold hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#F8F7F4', color: '#0f1117', fontFamily: "var(--font-inter), 'Inter', sans-serif" }}
              >
                {avatarUrl
                  ? <img src={avatarUrl} alt="" className="w-full h-full object-cover"/>
                  : inicial
                }
              </div>
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-[72px]">
        <div className="max-w-6xl mx-auto px-6 py-12">
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
