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

  if (!profile?.onboarded) {
    redirect('/onboarding')
  }

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
    .filter((p: any) => !projects?.some(own => own.id === p.id))

  const nombre = user.user_metadata?.full_name?.split(' ')[0]
    ?? user.email?.split('@')[0]
    ?? 'artista'

  const inicial = nombre.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-[#0d0d0f] flex flex-col">

      {/* Navbar */}
      <nav className="h-12 border-b border-white/[0.05] flex items-center justify-between px-5 sticky top-0 z-50 bg-[#0d0d0f]/90 backdrop-blur-md">
        <a href="/dashboard" className="font-mono text-base font-medium tracking-tight hover:opacity-80 transition-opacity flex-shrink-0">
          demo<span className="text-[#7C6FFF]">.</span>
        </a>
        <div className="flex items-center gap-3">
          <a href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#7C6FFF] to-[#4A3FCC] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {inicial}
            </div>
            <span className="text-[#9BA0AD] text-xs hidden sm:block font-mono">{nombre}</span>
          </a>
          <div className="w-px h-4 bg-white/[0.08]"/>
          <LogoutButton/>
        </div>
      </nav>

      {/* Contenido */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-5 py-8">
        <div className="mb-8">
          <h1 className="text-xl font-medium text-[#F8F7F4]">
            Hola, {nombre}<span className="text-[#7C6FFF]">.</span>
          </h1>
          <p className="text-[#555966] text-sm font-mono mt-0.5">
            Tu biblioteca. Tu música, antes de existir para el mundo.
          </p>
        </div>

        <DashboardClient
          userId={user.id}
          initialProjects={projects ?? []}
          savedProjects={savedProjects}
        />
      </main>
    </div>
  )
}
