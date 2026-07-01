import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import ProyectoClient from './ProyectoClient'

const R2_PUBLIC = 'https://pub-5ad091444ab84f6e979864f025aa8867.r2.dev'

interface Props { params: { id: string } }

export default async function ProyectoPage({ params }: Props) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let { data: project } = await supabase
    .from('projects')
    .select('id, title, cover_url, visibility, status, created_at, share_slug, owner_id')
    .eq('id', params.id).single()

  // Si RLS no deja verlo (proyecto privado ajeno), comprobamos si el usuario lo
  // tiene guardado en su biblioteca — en ese caso sí tiene derecho a abrirlo,
  // así que lo recargamos con el cliente admin.
  if (!project) {
    const { data: savedRow } = await supabase
      .from('saved_projects')
      .select('id')
      .eq('user_id', user.id)
      .eq('project_id', params.id)
      .maybeSingle()

    if (savedRow) {
      const admin = createAdminSupabaseClient()
      const { data: adminProject } = await admin
        .from('projects')
        .select('id, title, cover_url, visibility, status, created_at, share_slug, owner_id')
        .eq('id', params.id)
        .single()
      project = adminProject
    }
  }

  if (!project) redirect('/dashboard')

  const isSavedNotMine = project.owner_id !== user.id

  const { data: tracksNormal } = await supabase
    .from('tracks')
    .select('id, title, file_path, track_order, duration, created_at, waveform')
    .eq('project_id', params.id)
    .order('track_order', { ascending: true })

  // Mismo fallback para las canciones si el proyecto es guardado y ajeno
  let tracks = tracksNormal
  if (isSavedNotMine && (!tracksNormal || tracksNormal.length === 0)) {
    const admin = createAdminSupabaseClient()
    const { data: adminTracks } = await admin
      .from('tracks')
      .select('id, title, file_path, track_order, duration, created_at, waveform')
      .eq('project_id', params.id)
      .order('track_order', { ascending: true })
    tracks = adminTracks
  }

  const { data: membership } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', params.id)
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle()

  const isMine  = project.owner_id === user.id
  const isAdmin = !!membership

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  const nombre  = profile?.username ?? user.email?.split('@')[0] ?? 'artista'
  const inicial = nombre.charAt(0).toUpperCase()

  const projectWithCover = {
    ...project,
    cover_url: project.cover_url
      ? project.cover_url.startsWith('http')
        ? project.cover_url
        : `${R2_PUBLIC}/${project.cover_url}`
      : null,
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col">
      <ProyectoClient
        project={projectWithCover}
        initialTracks={tracks ?? []}
        isMine={isMine}
        isAdmin={isAdmin}
        userId={user.id}
        nombre={nombre}
        inicial={inicial}
      />
    </div>
  )
}
