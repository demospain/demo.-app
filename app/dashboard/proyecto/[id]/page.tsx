import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import ProyectoClient from './ProyectoClient'

interface Props {
  params: { id: string }
}

export default async function ProyectoPage({ params }: Props) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select('id, title, cover_url, visibility, status, created_at, share_slug, owner_id')
    .eq('id', params.id)
    .single()

  if (!project) redirect('/dashboard')

  const { data: tracks } = await supabase
    .from('tracks')
    .select('id, title, file_path, track_order, duration, created_at')
    .eq('project_id', params.id)
    .order('track_order', { ascending: true })

  const isMine = project.owner_id === user.id

  const nombre = user.user_metadata?.full_name?.split(' ')[0]
    ?? user.email?.split('@')[0]
    ?? 'artista'

  const inicial = nombre.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-[#0d0d0f] flex flex-col">
      <ProyectoClient
        project={project}
        initialTracks={tracks ?? []}
        isMine={isMine}
        userId={user.id}
        nombre={nombre}
        inicial={inicial}
      />
    </div>
  )
}
