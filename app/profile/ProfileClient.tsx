'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import LogoutButton from '@/components/LogoutButton'

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
  pro_artist:   { label: 'Pro Artista',   price: '5 EUR/mes',  color: 'text-[#7C6FFF]' },
  pro_producer: { label: 'Pro Productor', price: '8 EUR/mes',  color: 'text-[#7C6FFF]' },
  studio:       { label: 'Studio',        price: '19 EUR/mes', color: 'text-[#F59E0B]' },
}

type Tab = 'profile' | 'security' | 'plan'

export default function ProfileClient({ userId, email, profile: initialProfile }: Props) {
  const [profile, setProfile]   = useState(initialProfile)
  const [tab, setTab]           = useState<Tab>('profile')
  const [editing, setEditing]   = useState(false)
  const [username, setUsername] = useState(initialProfile.username)
  const [roles, setRoles]       = useState<string[]>(initialProfile.roles ?? [])
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const supabase = createClient()

  const inicial = (profile.username || profile.full_name || 'U').charAt(0).toUpperCase()
  const plan = PLAN_LABELS[profile.plan] ?? PLAN_LABELS.free

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
    const { error } = await supabase
      .from('profiles')
      .update({ username, roles })
      .eq('id', userId)
    if (!error) {
      setProfile(p => ({ ...p, username, roles }))
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-[#0d0d0f]">

      {/* Navbar */}
      <nav className="h-12 border-b border-white/[0.05] flex items-center justify-between px-5 sticky top-0 z-50 bg-[#0d0d0f]/90 backdrop-blur-md">
        <a href="/dashboard" className="font-mono text-base font-medium tracking-tight hover:opacity-80 transition-opacity">
          demo<span className="text-[#7C6FFF]">.</span>
        </a>
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="text-[#9BA0AD] hover:text-[#F8F7F4] text-sm transition-colors">
            ← Mi biblioteca
          </a>
          <div className="w-px h-4 bg-white/[0.08]"/>
          <LogoutButton/>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-5 py-10">

        {/* Header */}
        <div className="flex items-center gap-5 mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#7C6FFF] to-[#4A3FCC] flex items-center justify-center text-2xl font-bold text-white overflow-hidden flex-shrink-0">
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover"/>
              : inicial
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-xl font-medium text-[#F8F7F4]">
                @{profile.username || 'sin nombre'}
              </h1>
              <span className={`text-xs font-mono px-2 py-0.5 rounded-md bg-[#1E2028] border border-white/[0.06] ${plan.color}`}>
                {plan.label}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(profile.roles ?? []).map(r => (
                <span key={r} className="text-xs bg-[#1E2028] border border-white/[0.06] text-[#9BA0AD] px-2 py-0.5 rounded-md font-mono">
                  {ROLE_LABELS[r]?.emoji} {ROLE_LABELS[r]?.label}
                </span>
              ))}
            </div>
          </div>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 bg-[#1E2028] hover:bg-[#252830] border border-white/[0.08] text-[#9BA0AD] hover:text-[#F8F7F4] px-4 py-2 rounded-xl text-sm transition-colors flex-shrink-0"
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
                className="border border-white/[0.08] text-[#9BA0AD] px-3 py-2 rounded-xl text-sm hover:border-white/20 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#7C6FFF] hover:bg-[#4A3FCC] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-40"
              >
                {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar'}
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#1E2028] rounded-xl p-1 w-fit mb-6">
          {([['profile', 'Perfil'], ['security', 'Seguridad'], ['plan', 'Plan']] as [Tab, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === id ? 'bg-[#0d0d0f] text-[#F8F7F4]' : 'text-[#555966] hover:text-[#9BA0AD]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab: Perfil */}
        {tab === 'profile' && (
          <div className="flex flex-col gap-4">
            <div className="bg-[#1E2028] border border-white/[0.06] rounded-xl p-5">
              <p className="text-[#555966] text-xs font-mono uppercase tracking-wider mb-3">Nombre de usuario</p>
              {editing ? (
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555966] font-mono text-sm">@</div>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase())}
                    className="w-full bg-[#111318] border border-white/[0.08] focus:border-[#7C6FFF]/50 text-[#F8F7F4] rounded-xl pl-8 pr-4 py-2.5 text-sm outline-none transition-colors font-mono"
                  />
                </div>
              ) : (
                <p className="text-[#F8F7F4] font-mono">@{profile.username || 'sin nombre'}</p>
              )}
            </div>

            <div className="bg-[#1E2028] border border-white/[0.06] rounded-xl p-5">
              <p className="text-[#555966] text-xs font-mono uppercase tracking-wider mb-3">Roles públicos</p>
              {editing ? (
                <div className="flex flex-col gap-2">
                  {Object.entries(ROLE_LABELS).map(([id, { label, emoji }]) => {
                    const isSelected = roles.includes(id)
                    const isDisabled = (id !== 'listener' && roles.includes('listener')) ||
                      (id === 'listener' && roles.length > 0 && !roles.includes('listener'))
                    return (
                      <button
                        key={id}
                        onClick={() => !isDisabled && toggleRole(id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-[#7C6FFF]/10 border-[#7C6FFF]/30 text-[#F8F7F4]'
                            : isDisabled
                            ? 'opacity-25 cursor-not-allowed border-white/[0.04]'
                            : 'border-white/[0.08] text-[#9BA0AD] hover:border-white/20'
                        }`}
                      >
                        <span>{emoji}</span>
                        <span className="text-sm font-medium">{label}</span>
                        <div className={`ml-auto w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'bg-[#7C6FFF] border-[#7C6FFF]' : 'border-white/20'
                        }`}>
                          {isSelected && (
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                              <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(profile.roles ?? []).length === 0
                    ? <p className="text-[#555966] text-sm font-mono">Sin roles asignados</p>
                    : (profile.roles ?? []).map(r => (
                      <span key={r} className="flex items-center gap-1.5 text-sm bg-[#111318] border border-white/[0.06] text-[#9BA0AD] px-3 py-1.5 rounded-xl">
                        <span>{ROLE_LABELS[r]?.emoji}</span>
                        <span>{ROLE_LABELS[r]?.label}</span>
                      </span>
                    ))
                  }
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Seguridad */}
        {tab === 'security' && (
          <div className="bg-[#1E2028] border border-white/[0.06] rounded-xl p-5">
            <p className="text-[#555966] text-xs font-mono uppercase tracking-wider mb-3">Correo electrónico</p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#111318] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="3" width="12" height="8" rx="1" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
                  <path d="M1 4l6 4 6-4" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <p className="text-[#F8F7F4] text-sm font-mono">{email}</p>
                <p className="text-[#555966] text-xs mt-0.5">Privado — no visible públicamente</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Plan */}
        {tab === 'plan' && (
          <div className="flex flex-col gap-3">
            <div className={`bg-[#1E2028] border rounded-xl p-5 ${
              profile.plan !== 'free' ? 'border-[#7C6FFF]/30' : 'border-white/[0.06]'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[#555966] text-xs font-mono uppercase tracking-wider">Plan actual</p>
                {profile.plan !== 'free' && (
                  <span className="text-xs bg-[#7C6FFF]/10 text-[#7C6FFF] font-mono px-2 py-0.5 rounded-md">Activo</span>
                )}
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className={`text-2xl font-medium ${plan.color}`}>{plan.label}</span>
                <span className="text-[#555966] text-sm font-mono">{plan.price}</span>
              </div>
              {profile.plan === 'free' && (
                <p className="text-[#555966] text-xs leading-relaxed">
                  Mejora tu plan para acceder a analíticas profundas, links con contraseña, plantillas para redes y más.
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
