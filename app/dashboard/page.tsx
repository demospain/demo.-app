import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import LogoutButton from '@/components/LogoutButton'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const nombre = user.user_metadata?.full_name
    ?? user.email?.split('@')[0]
    ?? 'artista'

  return (
    <div className="min-h-screen bg-[#111318] flex flex-col">

      {/* Navbar */}
      <nav className="h-14 border-b border-white/6 flex items-center justify-between px-6 bg-[#111318]/95 backdrop-blur sticky top-0 z-50">
        <span className="font-mono text-lg font-medium text-[#F8F7F4] tracking-tight">
          demo<span className="text-[#7C6FFF]">.</span>
        </span>
        <div className="flex items-center gap-4">
          <span className="text-[#9BA0AD] text-sm hidden sm:block">
            {user.email}
          </span>
          <LogoutButton />
        </div>
      </nav>

      {/* Contenido */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">

        {/* Bienvenida */}
        <div className="mb-10">
          <h1 className="text-2xl font-medium text-[#F8F7F4] mb-1">
            Hola, {nombre}<span className="text-[#7C6FFF]">.</span>
          </h1>
          <p className="text-[#9BA0AD] text-sm">
            Aquí vivirá tu música antes de existir para el mundo.
          </p>
        </div>

        {/* Estado vacío — se reemplazará cuando haya proyectos reales */}
        <div className="border border-dashed border-white/10 rounded-2xl p-16 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-xl bg-[#1E2028] border border-[#7C6FFF]/20 flex items-center justify-center text-2xl mb-4">
            💿
          </div>
          <h2 className="text-[#F8F7F4] font-medium mb-2">Tu primer proyecto</h2>
          <p className="text-[#9BA0AD] text-sm max-w-xs mb-6">
            Sube canciones, organízalas en un proyecto tipo álbum y compártelas con quien quieras.
          </p>
          <button className="bg-[#7C6FFF] hover:bg-[#4A3FCC] text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-colors">
            + Nuevo proyecto
          </button>
        </div>

      </main>
    </div>
  )
}
