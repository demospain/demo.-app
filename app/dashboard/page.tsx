import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarded, username, avatar_url')
    .eq('id', user.id)
    .single()

  if (!profile?.onboarded) redirect('/onboarding')

  const { data: myProjectsRaw } = await supabase
    .from('projects')
    .select('id, title, cover_url, visibility, status, created_at, owner_id, share_slug, source_single_id, attributed_artist')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  const { data: savedRows } = await supabase
    .from('saved_projects')
    .select('project_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const savedProjectIds = (savedRows ?? []).map(r => r.project_id)

  // Los proyectos guardados pueden ser privados (p.ej. singles guardados como proyecto
  // espejo), así que se resuelven con el cliente admin — el usuario tiene derecho
  // legítimo a ver lo que él mismo guardó, sin depender de la visibilidad del proyecto.
  const admin = createAdminSupabaseClient()
  const { data: savedProjectsRaw } = savedProjectIds.length
    ? await admin
        .from('projects')
        .select('id, title, cover_url, visibility, status, created_at, owner_id, share_slug, source_single_id, attributed_artist')
        .in('id', savedProjectIds)
    : { data: [] as any[] }

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

  // Los proyectos espejo (creados al guardar un single) no son "proyectos propios"
  // reales aunque owner_id sea el usuario — se muestran en "Guardado"
  const realMyProjects = (myProjectsRaw ?? []).filter((p: any) => !p.source_single_id)
  const mirrorProjectsOfMine = (myProjectsRaw ?? []).filter((p: any) => p.source_single_id)

  const myProjects = realMyProjects.map(prefixCover)

  const savedProjects = [...(savedProjectsRaw ?? []), ...mirrorProjectsOfMine]
    .filter((p: any) => p.owner_id !== user.id || p.source_single_id)
    .map(prefixCover) as {
      id: string; title: string; cover_url: string | null;
      visibility: string; status: string; created_at: string;
      owner_id?: string; share_slug?: string; source_single_id?: string; attributed_artist?: string
    }[]

  // Todos los proyectos que necesitan resolución de nombres
  const allProjects = [...myProjects, ...savedProjects]
  const allProjectIds = allProjects.map((p: any) => p.id)

  // Owner names (para proyectos guardados)
  const ownerIds = Array.from(new Set(allProjects.map((p: any) => p.owner_id).filter(Boolean))) as string[]
  const profilesMap: Record<string, string> = {}
  if (ownerIds.length > 0) {
    const { data: owners } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', ownerIds)
    owners?.forEach(o => { profilesMap[o.id] = o.username })
  }
  // Incluir el propio usuario
  if (profile?.username) profilesMap[user.id] = profile.username

  // Admins por proyecto
  const adminsByProject: Record<string, string[]> = {}
  if (allProjectIds.length > 0) {
    const { data: members } = await supabase
      .from('project_members')
      .select('project_id, user_id')
      .in('project_id', allProjectIds)
      .eq('role', 'admin')
    // Resolver usernames de admins que no están ya en profilesMap
    const adminUserIds = Array.from(new Set((members ?? []).map(m => m.user_id)))
    const unknownIds = adminUserIds.filter(id => !profilesMap[id])
    if (unknownIds.length > 0) {
      const { data: adminProfiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', unknownIds)
      adminProfiles?.forEach(p => { profilesMap[p.id] = p.username })
    }
    ;(members ?? []).forEach(m => {
      if (!adminsByProject[m.project_id]) adminsByProject[m.project_id] = []
      adminsByProject[m.project_id].push(m.user_id)
    })
  }

  // Construir el string de autores por proyecto: owner[, admin1, admin2...]
  // Para proyectos espejo (singles guardados), usamos attributed_artist en vez
  // del owner real, ya que el owner_id es quien lo guardó, no quien lo creó
  const ownerNames: Record<string, string> = {}
  allProjects.forEach((p: any) => {
    if (p.source_single_id) {
      ownerNames[p.id] = p.attributed_artist ?? 'Artista'
      return
    }
    const ownerUsername = profilesMap[p.owner_id] ?? p.owner_id ?? ''
    const adminIds = adminsByProject[p.id] ?? []
    const adminUsernames = adminIds
      .filter(id => id !== p.owner_id)
      .map(id => profilesMap[id] ?? id)
      .filter(Boolean)
    ownerNames[p.id] = adminUsernames.length > 0
      ? [ownerUsername, ...adminUsernames].join(', ')
      : ownerUsername
  })

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
                className="h-10 w-10 rounded-xl overflow-hidden flex items-center justify-center text-sm font-bold btn-spring"
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
