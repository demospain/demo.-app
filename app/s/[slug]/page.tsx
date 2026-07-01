import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import SingleClient from './SingleClient'

export const dynamic = 'force-dynamic'

interface Props { params: { slug: string } }

const R2 = 'https://pub-5ad091444ab84f6e979864f025aa8867.r2.dev'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createServerSupabaseClient()
  const { data: single } = await supabase
    .from('singles')
    .select('track_title, artist_name, cover_url')
    .eq('slug', params.slug)
    .single()

  if (!single) return {}

  const title = single.artist_name
    ? `Escucha ${single.track_title} de ${single.artist_name}`
    : `Escucha ${single.track_title}`

  const imageUrl = single.cover_url
    ? (single.cover_url.startsWith('http') ? single.cover_url : `${R2}/${single.cover_url}`)
    : undefined

  return {
    title,
    description: 'Compartido con demo.',
    openGraph: {
      title,
      description: 'Compartido con demo.',
      images: imageUrl ? [{ url: imageUrl, width: 512, height: 512 }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: 'Compartido con demo.',
      images: imageUrl ? [imageUrl] : undefined,
    },
  }
}

export default async function SinglePage({ params }: Props) {
  const supabase = await createServerSupabaseClient()

  const { data: single } = await supabase
    .from('singles')
    .select('*, tracks(waveform)')
    .eq('slug', params.slug)
    .single()

  if (!single) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  return <SingleClient single={single} userId={user?.id ?? null} />
}
