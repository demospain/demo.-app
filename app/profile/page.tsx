import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, full_name, avatar_url, roles, plan, onboarded')
    .eq('id', user.id)
    .single()

  return (
    <ProfileClient
      userId={user.id}
      email={user.email ?? ''}
      profile={{
        username:   profile?.username   ?? '',
        full_name:  profile?.full_name  ?? '',
        avatar_url: profile?.avatar_url ?? null,
        roles:      profile?.roles      ?? [],
        plan:       profile?.plan       ?? 'free',
      }}
    />
  )
}
