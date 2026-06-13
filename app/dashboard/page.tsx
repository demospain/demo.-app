import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import LogoutButton from '@/components/LogoutButton'
import DashboardClient from '@/components/DashboardClient'

const R2_PUBLIC = 'https://pub-5ad091444ab84f6e979864f025aa8867.r2.dev'

function withCover(p: any) {
  return { ...p, cover_url: p.cover_url ? `${R2_PUBLIC}/${p.cover_url}` : null }
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarded, username')
    .eq('id', user.id)
    .single()

  if (!profile?.onboarded) redirect('/onboarding')

  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, cover_url, visibility, status, created_at, owner_id')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  const { data: savedRaw } = await supabase
    .from('saved_projects')
    .select('project_id, projects(id, title, cover_url, visibility, status, created_at, owner_id)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const savedProjects = (savedRaw ?? [])
    .map((s: any) => s.projects)
    .filter(Boolean)
    .filter((p: any) => !projects?.some(own => own.id === p.id))

  const ownerIds = Array.from(new Set(savedProjects.map((p: any) => p.owner_id).filter(Boolean)))
  const { data: ownerProfiles } = ownerIds.length > 0
    ? await supabase.from('profiles').select('id, username').in('id', ownerIds)
    : { data: [] }

  const ownerNames: Record<string, string> = {}
  for (const p of ownerProfiles ?? []) {
    ownerNames[p.id] = p.username ?? 'Artista'
  }

  const nombre = profile?.username
    ?? user.user_metadata?.full_name?.split(' ')[0]
    ?? user.email?.split('@')[0]
    ?? 'artista'

  const inicial = nombre.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col">

      {/* Header integrado — logo centrado + controles en esquinas */}
      <header className="relative flex items-center justify-center px-6 pt-10 pb-8">
        <a href="/dashboard" className="font-mono text-4xl font-medium tracking-tight hover:opacity-80 transition-opacity">
          demo<span className="text-[#6E62F5]">.</span>
        </a>
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-3">
          <a href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-[#6E62F5] flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
              {inicial}
            </div>
            <span className="text-[#9BA0AD] text-sm hidden sm:block font-mono">{nombre}</span>
          </a>
          <div className="w-px h-4 bg-white/[0.08]"/>
          <LogoutButton/>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 pb-10">
        <DashboardClient
          userId={user.id}
          userName={nombre}
          initialProjects={(projects ?? []).map(withCover)}
          savedProjects={savedProjects.map(withCover)}
          ownerNames={ownerNames}
        />
      </main>
    </div>
  )
}
