import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardClient from './DashboardClient'

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

  const { data: myProjects } = await supabase
    .from('projects')
    .select('id, title, cover_url, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { data: savedProjects } = await supabase
    .from('saved_projects')
    .select('project_id, projects(id, title, cover_url, profiles(username))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const inicial = (profile?.username?.[0] ?? user.email?.[0] ?? '?').toUpperCase()

  return (
    <div className="min-h-screen bg-[#0C0D0F] text-[#F8F7F4]">
      {/* NAVBAR — más alto, logo grande, botones blancos */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-[72px] bg-[#0C0D0F]/95 backdrop-blur-sm border-b border-[#1A1B1F]">
        <div className="max-w-7xl mx-auto px-8 h-full flex items-center justify-between">
          {/* Logo */}
          <a href="/dashboard" className="font-mono text-[28px] font-medium tracking-tight hover:opacity-80 transition-opacity leading-none">
            demo<span className="text-[#6E62F5]">.</span>
          </a>

          {/* Botones de la derecha */}
          <div className="flex items-center gap-2">
            {/* Notificaciones */}
            <a
              href="/notifications"
              className="relative h-10 w-10 rounded-xl bg-[#F8F7F4] text-[#0C0D0F] flex items-center justify-center hover:bg-white transition-colors"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {/* Badge de notificaciones — solo si hay */}
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#6E62F5] rounded-full text-white text-[10px] flex items-center justify-center font-bold leading-none">4</span>
            </a>

            {/* Avatar / Perfil */}
            <a href="/profile">
              <div className="h-10 w-10 rounded-xl bg-[#F8F7F4] flex items-center justify-center text-sm font-bold text-[#0C0D0F] overflow-hidden hover:ring-2 hover:ring-white/30 transition-all">
                {profile?.avatar_url ? (
                  <img
                    src={`https://pub-5ad091444ab84f6e979864f025aa8867.r2.dev/${profile.avatar_url}`}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  inicial
                )}
              </div>
            </a>
          </div>
        </div>
      </nav>

      {/* CONTENIDO — padding top para compensar navbar fija + espaciado lateral generoso como en untitled */}
      <main className="pt-[72px]">
        <div className="max-w-7xl mx-auto px-16 py-16">
          <DashboardClient
            myProjects={myProjects ?? []}
            savedProjects={savedProjects ?? []}
            username={profile?.username ?? ''}
          />
        </div>
      </main>
    </div>
  )
}
