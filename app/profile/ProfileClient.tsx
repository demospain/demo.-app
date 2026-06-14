'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import LogoutButton from '@/components/LogoutButton'

const R2_PUBLIC = 'https://pub-5ad091444ab84f6e979864f025aa8867.r2.dev'

interface Profile {
  username:   string
  full_name:  string | null
  avatar_url: string | null
  roles:      string[]
  plan:       string
}

interface Props {
  userId:  string
  email:   string
  profile: Profile
}

const ROLE_LABELS: Record<string, { label: string; emoji: string }> = {
  artist:   { label: 'Artista',            emoji: '🎤' },
  producer: { label: 'Productor',           emoji: '🎛️' },
  engineer: { label: 'Ingeniero de sonido', emoji: '🎚️' },
  listener: { label: 'Oyente',              emoji: '🎧' },
}

const PLAN_LABELS: Record<string, { label: string; price: string; color: string }> = {
  free:         { label: 'Free',          price: '0 EUR/mes',  color: 'text-[#9BA0AD]' },
  pro_artist:   { label: 'Pro Artista',   price: '5 EUR/mes',  color: 'text-[#6E62F5]' },
  pro_producer: { label: 'Pro Productor', price: '8 EUR/mes',  color: 'text-[#6E62F5]' },
  studio:       { label: 'Studio',        price: '19 EUR/mes', color: 'text-[#F59E0B]' },
}

type Tab = 'profile' | 'security' | 'plan'

export default function ProfileClient({ userId, email, profile: initialProfile }: Props) {
  const [profile, setProfile]         = useState(initialProfile)
  const [tab, setTab]                 = useState<Tab>('profile')
  const [editing, setEditing]         = useState(false)
  const [username, setUsername]       = useState(initialProfile.username)
  const [roles, setRoles]             = useState<string[]>(initialProfile.roles ?? [])
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const avatarInputRef                = useRef<HTMLInputElement>(null)
  const supabase                      = createClient()

  const inicial = (profile.username || profile.full_name || 'U').charAt(0).toUpperCase()
  const plan    = PLAN_LABELS[profile.plan] ?? PLAN_LABELS.free

  const avatarUrl = profile.avatar_url
    ? profile.avatar_url.startsWith('http')
      ? profile.avatar_url
      : `${R2_PUBLIC}/${profile.avatar_url}`
    : null

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    try {
      const res = await fetch('/api/upload-avatar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ fileName: file.name, fileType: file.type, fileSize: file.size }),
      })
      const { uploadUrl, filePath } = await res.json()
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
      const { error } = await supabase.from('profiles').update({ avatar_url: filePath }).eq('id', userId)
      if (!error) {
        setProfile(p => ({ ...p, avatar_url: filePath }))
      }
    } catch {}
    setAvatarUploading(false)
    e.target.value = ''
  }

  const toggleRole = (role: string) => {
    if (role === 'listener') {
      setRoles(prev => prev.includes('listener') ? [] : ['listener'])
      return
    }
    setRoles(prev => {
      const without = prev.filter(r => r !== 'listener')
      return without.includes(role) ? without.filter(r => r !== role) : [...without, role]
    })
  }

  const handleSave = async () => {
    if (username.length < 3) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ username, roles }).eq('id', userId)
    if (!error) {
      setProfile(p => ({ ...p, username, roles }))
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-[#0f1117]">

      <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarUpload}/>

      <nav className="h-14 border-b border-white/[0.07] flex items-center justify-between px-6 sticky top-0 z-50 bg-[#0f1117]/90 backdrop-blur-md">
        <a href="/dashboard" className="font-mono text-lg font-medium tracking-tight hover:opacity-80 transition-opacity">
          demo<span className="text-[#6E62F5]">.</span>
        </a>
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="text-[#555966] hover:text-[#EAE9E6] text-sm font-mono transition-colors">
            ← Mi biblioteca
          </a>
          <div className="w-px h-4 bg-white/[0.07]"/>
          <LogoutButton/>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-10">

        {/* Tarjeta de perfil */}
        <div className="bg-[#181c27] border border-white/[0.07] rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-5">

            {/* Avatar con hover para cambiar */}
            <div
              onClick={() => avatarInputRef.current?.click()}
              className="relative w-16 h-16 rounded-xl bg-[#6E62F5] flex items-center justify-center text-xl font-bold text-white overflow-hidden flex-shrink-0 cursor-pointer group"
            >
              {avatarUploading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
              ) : avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover"/>
              ) : (
                inicial
              )}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 10V3M5 6l3-3 3 3" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 11v1.5A1.5 1.5 0 003.5 14h9a1.5 1.5 0 001.5-1.5V11" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-lg font-medium text-[#EAE9E6] font-mono">
                  @{profile.username || 'sin nombre'}
                </span>
                <span className={`text-xs font-mono px-2 py-0.5 rounded-md bg-[#1f2335] border border-white/[0.07] ${plan.color}`}>
                  {plan.label}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(profile.roles ?? []).length === 0 ? (
                  <span className="text-xs font-mono text-[#555966]">Sin roles</span>
                ) : (profile.roles ?? []).map(r => (
                  <span key={r} className="text-xs bg-[#1f2335] border border-white/[0.07] text-[#9BA0AD] px-2.5 py-1 rounded-lg font-mono">
                    {ROLE_LABELS[r]?.emoji} {ROLE_LABELS[r]?.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Botón editar */}
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 bg-[#1f2335] hover:bg-[#252a40] border border-white/[0.07] text-[#9BA0AD] hover:text-[#EAE9E6] px-4 py-2 rounded-xl text-sm transition-colors flex-shrink-0"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M8.5 1.5l2 2-7 7H1.5v-2l7-7z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Editar
              </button>
            ) : (
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => { setEditing(false); setUsername(profile.username); setRoles(profile.roles) }}
                  className="border border-white/[0.07] text-[#555966] hover:text-[#9BA0AD] px-3 py-2 rounded-xl text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#6E62F5] hover:bg-[#5A4FD4] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-40"
                >
                  {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#181c27] border border-white/[0.07] rounded-xl p-1 w-fit mb-6">
          {([['profile', 'Perfil'], ['security', 'Seguridad'], ['plan', 'Plan']] as [Tab, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === id ? 'bg-[#1f2335] text-[#EAE9E6]' : 'text-[#555966] hover:text-[#9BA0AD]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab: Perfil */}
        {tab === 'profile' && (
          <div className="flex flex-col gap-3">
            <div className="bg-[#181c27] border border-white/[0.07] rounded-xl p-5">
              <p className="text-[#555966] text-xs font-mono uppercase
