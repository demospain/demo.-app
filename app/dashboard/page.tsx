import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import LogoutButton from '@/components/LogoutButton'
import DashboardClient from '@/components/DashboardClient'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarded')
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

  // Traer nombres de los owners de proyectos guardados
  const ownerIds = Array.from(new Set(savedProjects.map((p: any) => p.owner_id).filter(Boolean)))
  const { data: ownerProfiles } = ownerIds.length > 0
    ? await supabase.from('profiles').select('id, full_name').in('id', ownerIds)
    : { data: [] }

  const ownerNames: Record<string, string> = {}
  for (const p of ownerProfiles ?? []) {
    ownerNames[p.id] = p.full_name ?? 'Artista'
  }

  const nombre = user.user_metadata?.full_name?.split(' ')[0]
    ?? user.email?.split('@')[0]
    ?? 'artista'

  const inicial = nombre.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-[#16171e] flex flex-col">

      <nav className="h-14 border-b border-white/[0.05] flex items-center justify-between px-6 sticky top-0 z-50 bg-[#16171e]/90 backdrop-blur-md">
        <a href="/dashboard" className="font-mono text-lg font-medium tracking-tight hover:opacity-80 transition-opacity flex-shrink-0">
          demo<span className="text-[#7C6FFF]">.</span>
        </a>
        <div className="flex items-center gap-3">
          <a href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7C6FFF] to-[#4A3FCC] flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
              {inicial}
            </div>
            <span className="text-[#9BA0AD] text-sm hidden sm:block font-mono">{nombre}</span>
          </a>
          <div className="w-px h-4 bg-white/[0.08]"/>
          <LogoutButton/>
        </div>
      </nav>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
        <div className="mb-10">
          <h1 className="text-2xl font-medium text-[#F8F7F4]">
            Hola, {nombre}<span className="text-[#7C6FFF]">.</span>
          </h1>
          <p className="text-[#555966] text-sm font-mono mt-1">
            Tu biblioteca. Tu música, antes de existir para el mundo.
          </p>
        </div>

        <DashboardClient
          userId={user.id}
          userName={nombre}
          initialProjects={projects ?? []}
          savedProjects={savedProjects}
          ownerNames={ownerNames}
        />
      </main>
    </div>
  )
}
