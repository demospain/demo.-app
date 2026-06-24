import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import SingleClient from './SingleClient'

export const dynamic = 'force-dynamic'

interface Props { params: { slug: string } }

export default async function SinglePage({ params }: Props) {
  const supabase = await createServerSupabaseClient()

  const { data: single } = await supabase
    .from('singles')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (!single) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  return <SingleClient single={single} userId={user?.id ?? null} />
}
