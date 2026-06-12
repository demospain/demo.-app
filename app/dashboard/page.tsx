import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import LogoutButton from '@/components/LogoutButton'
import DashboardClient from '@/components/DashboardClient'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Cargar proyectos del usuario
  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, cover_url, visibility, status, created_at')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  const nombre = user.user_metadata?.full_name
    ?? user.email?.split('@')[0]
    ?? 'artista'

  return (
    <div className="min-h-screen bg-[#111318] flex flex-col">
      {/* Navbar */}
      <nav className="h-14 border-b border-white/[0.06] flex items-center justify-between px-6 bg-[#111318]/95 backdrop-blur sticky top-0 z-50">
        <span className="font-mono text-lg font-medium tracking-tight">
          demo<span className="text-[#7C6FFF]">.</span>
        </span>
        <div className="flex items-center gap-4">
          <span className="text-[#9BA0AD] text-sm hidden sm:block">{user.email}</span>
          <LogoutButton />
        </div>
      </nav>

      {/* Contenido */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-medium">
              Hola, {nombre}<span className="text-[#7C6FFF]">.</span>
            </h1>
            <p className="text-[#9BA0AD] text-sm mt-1">
              Aquí vivirá tu música antes de existir para el mundo.
            </p>
          </div>
        </div>

        <DashboardClient
          userId={user.id}
          initialProjects={projects ?? []}
        />
      </main>
    </div>
  )
}
