import { createServerSupabaseClient } from '@/lib/supabase-server'
import PublicProjectClient from './PublicProjectClient'
import type { Metadata } from 'next'

const R2_PUBLIC = 'https://pub-5ad091444ab84f6e979864f025aa8867.r2.dev'

function withCover(url: string | null) {
  return url ? `${R2_PUBLIC}/${url}` : null
}

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createServerSupabaseClient()
  const { data: project } = await supabase
    .from('projects')
    .select('title, cover_url, owner_id')
    .eq('share_slug', params.slug)
    .single()

  if (!project) return { title: 'demo.' }

  const { data: ownerProfile } = await supabase
    .from('profiles')
    .select('full_name, username')
    .eq('id', project.owner_id)
    .single()

  const displayName = ownerProfile?.username
    ? `@${ownerProfile.username}`
    : ownerProfile?.full_name ?? 'Artista'

  const title       = `${project.title} — ${displayName}`
  const description = 'Escucha este proyecto en demo. antes de que salga al mundo.'
  const image       = withCover(project.cover_url) ?? undefined

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [{ url: image, width: 800, height: 800 }] : [],
      type: 'music.album',
    },
    twitter: {
      card:        'summary_large_image',
      title,
      description,
      images:      image ? [image] : [],
    },
  }
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
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4">
        <div className="text-center max-w-xs">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-[#EAE9E6] font-medium mb-2">Proyecto privado</h1>
          <p className="text-[#555966] text-sm">Este proyecto no está disponible públicamente.</p>
        </div>
      </div>
    )
  }

  const { data: ownerProfile } = await supabase
    .from('profiles')
    .select('full_name, username, avatar_url')
    .eq('id', project.owner_id)
    .single()

  const ownerDisplay = ownerProfile?.username
    ? `@${ownerProfile.username}`
    : ownerProfile?.full_name ?? 'Artista'

  const { data: tracks } = await supabase
    .from('tracks')
    .select('id, title, file_path, duration, track_order')
    .eq('project_id', project.id)
    .order('track_order', { ascending: true })

  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === project.owner_id

  return (
    <PublicProjectClient
      project={{
        id:         project.id,
        title:      project.title,
        cover_url:  withCover(project.cover_url),
        slug:       params.slug,
        ownerName:  ownerDisplay,
        visibility: project.visibility,
      }}
      tracks={tracks ?? []}
      isLoggedIn={!!user}
      userId={user?.id ?? null}
      isOwner={isOwner}
    />
  )
}
