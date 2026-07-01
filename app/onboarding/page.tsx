import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import OnboardingClient from './OnboardingClient'

interface Props {
  searchParams: { next?: string }
}

export default async function OnboardingPage({ searchParams }: Props) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarded, username')
    .eq('id', user.id)
    .single()

  if (profile?.onboarded) redirect(searchParams.next ?? '/dashboard')

  const suggestedUsername = user.user_metadata?.full_name
    ?.toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9_]/g, '')
    ?? user.email?.split('@')[0]
    ?? ''

  return (
    <OnboardingClient
      userId={user.id}
      suggestedUsername={suggestedUsername}
      next={searchParams.next ?? '/dashboard'}
    />
  )
}
