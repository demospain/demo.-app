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
    .select('id, title, cover_url, visibility, status, created_at')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  const { data: savedRaw } = await supabase
    .from('saved_projects')
    .select('project_id, projects(id, title, cover_url, visibility, status, created_at)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const savedProjects = (savedRaw ?? [])
    .map((s: any) => s.projects)
    .filter(Boolean)

  const nombre = user.user_metadata?.full_name?.split(' ')[0]
    ?? user.email?.split('@')[0]
    ?? 'artista'

  const inicial = nombre.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-[#0d0d0f] flex flex-col">

      <nav className="h-11 border-b border-white/[0.04] flex items-center justify-between px-5 sticky top-0 z-50 bg-[#0d0d0f]/95 backdrop-blur-md">
        <a href="/dashboard" className="font-mono text-sm font-medium tracking-tight hover:opacity-70 transition-opacity">
          demo<span className="text-[#7C6FFF]">.</span>
        </a>
        <div className="flex items-center gap-2.5">
          <a href="/profile" className="flex items-center gap-2 hover:opacity-75 transition-opacity group">
            <div className="w-6 h-6 rounded-full bg-[#7C6FFF]/20 border border-[#7C6FFF]/30 flex items-center justify-center text-[10px] font-bold text-[#7C6FFF] flex-shrink-0">
              {inicial}
            </div>
            <span className="text-[#555966] text-xs font-mono group-hover:text-[#9BA0AD] transition-colors hidden sm:block">{nombre}</span>
          </a>
          <div className="w-px h-3.5 bg-white/[0.06]"/>
          <LogoutButton/>
        </div>
      </nav>

      <main className="flex-1 max-w-4xl mx-auto w-full px-5 py-10">
        <div className="mb-10">
          <h1 className="text-lg font-medium text-[#F8F7F4] tracking-tight">
            Hola, {nombre}<span className="text-[#7C6FFF]">.</span>
          </h1>
          <p className="text-[#383C47] text-xs font-mono mt-1 tracking-wide">
            Tu música, antes de existir para el mundo.
          </p>
        </div>

        <DashboardClient
          userId={user.id}
          initialProjects={projects ?? []}
          savedProjects={savedProjects}
          nombre={nombre}
        />
      </main>
    </div>
  )
}
