import { createServerSupabaseClient } from '@/lib/supabase-server'
import PublicProjectClient from './PublicProjectClient'

interface Props {
  params: { slug: string }
}

export default async function PublicProjectPage({ params }: Props) {
  const supabase = await createServerSupabaseClient()

  const { data: project } = await supabase
    .from('projects')
    .select('id, title, cover_url, visibility, owner_id')
    .eq('share_slug', params.slug)
    .single()

  if (!project || project.visibility === 'private') {
    return (
      <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center px-4">
        <div className="text-center max-w-xs">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-[#F8F7F4] font-medium mb-2">Proyecto privado</h1>
          <p className="text-[#555966] text-sm">Este proyecto no está disponible públicamente.</p>
        </div>
      </div>
    )
  }

  // Cargar nombre del owner en una query separada para evitar problemas de tipos
  const { data: ownerProfile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', project.owner_id)
    .single()

  const { data: tracks } = await supabase
    .from('tracks')
    .select('id, title, file_path, duration, track_order')
    .eq('project_id', project.id)
    .order('track_order', { ascending: true })

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <PublicProjectClient
      project={{
        id:        project.id,
        title:     project.title,
        cover_url: project.cover_url,
        slug:      params.slug,
        ownerName: ownerProfile?.full_name ?? 'Artista',
      }}
      tracks={tracks ?? []}
      isLoggedIn={!!user}
      userId={user?.id ?? null}
    />
  )
}
