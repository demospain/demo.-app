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
  userId:     string
  email:      string
  profile:    Profile
  trackCount: number
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

export default function ProfileClient({ userId, email, profile: initialProfile, trackCount }: Props) {
  const [profile, setProfile]               = useState(initialProfile)
  const [tab, setTab]                       = useState<Tab>('profile')
  const [editing, setEditing]               = useState(false)
  const [username, setUsername]             = useState(initialProfile.username)
  const [roles, setRoles]                   = useState<string[]>(initialProfile.roles ?? [])
  const [saving, setSaving]                 = useState(false)
  const [saved, setSaved]                   = useState(false)
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError]       = useState('')
  const [showDotsMenu, setShowDotsMenu]     = useState(false)
  const [confirmModal, setConfirmModal]     = useState<{ title: string; desc: string; onConfirm: () => void } | null>(null)
  const dotsMenuRef                         = useRef<HTMLDivElement>(null)
  const avatarInputRef                      = useRef<HTMLInputElement>(null)
  const supabase                            = createClient()

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
    setAvatarError('')
    setAvatarUploading(true)
    try {
      const res = await fetch('/api/upload-avatar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ fileName: file.name, fileType: file.type, fileSize: file.size }),
      })
      const { uploadUrl, filePath, error } = await res.json()
      if (error) { setAvatarError(error); setAvatarUploading(false); return }
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
      const { error: dbError } = await supabase.from('profiles').update({ avatar_url: filePath }).eq('id', userId)
      if (!dbError) {
        setProfile(p => ({ ...p, avatar_url: filePath }))
        setShowAvatarModal(false)
      }
    } catch {
      setAvatarError('Error al subir la imagen. Inténtalo de nuevo.')
    }
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

      <input
        ref={avatarInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleAvatarUpload}
      />

      {/* Modal foto de perfil */}
      {showAvatarModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowAvatarModal(false) }}
        >
          <div className="bg-[#181c27] border border-white/[0.07] rounded-2xl p-6 w-full max-w-sm">
            <p className="font-mono text-xs text-[#555966] uppercase tracking-widest mb-1">Foto de perfil</p>
            <h3 className="font-medium text-[#EAE9E6] text-base mb-6">Elige una nueva foto</h3>

            {/* Preview */}
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 rounded-2xl bg-[#6E62F5] flex items-center justify-center text-3xl font-bold text-white overflow-hidden">
                {avatarUrl
                  ? <img src={avatarUrl} alt="" className="w-full h-full object-cover"/>
                  : inicial
                }
              </div>
            </div>

            <p className="text-[#555966] text-xs font-mono text-center mb-4">
              JPG, PNG o WEBP · Máx. 5MB
            </p>

            {avatarError && (
              <p className="text-red-400 text-xs font-mono text-center mb-3">{avatarError}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => { setShowAvatarModal(false); setAvatarError('') }}
                className="flex-1 border border-white/[0.07] text-[#555966] hover:text-[#9BA0AD] py-2.5 rounded-xl text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                className="flex-1 bg-[#6E62F5] hover:bg-[#5A4FD4] disabled:opacity-40 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                {avatarUploading ? 'Subiendo...' : 'Elegir foto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-[#181c27] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-[#F8F7F4] font-medium text-base mb-2">{confirmModal.title}</h3>
            <p className="text-[#9BA0AD] text-sm mb-6 leading-relaxed">{confirmModal.desc}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 border border-white/[0.08] text-[#9BA0AD] hover:text-[#F8F7F4] py-2.5 rounded-xl text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => { confirmModal.onConfirm(); setConfirmModal(null) }}
                className="flex-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="h-[72px] flex items-center justify-between px-5 sticky top-0 z-50 bg-[#0f1117]/95 backdrop-blur-sm">
        <a
          href="/dashboard"
          className="w-10 h-10 rounded-xl bg-[#F8F7F4] hover:bg-white flex items-center justify-center transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="#0f1117" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>

        <div className="relative" ref={dotsMenuRef}>
          <button
            onClick={() => setShowDotsMenu(p => !p)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              showDotsMenu
                ? 'bg-white text-[#0f1117]'
                : 'bg-[#F8F7F4] hover:bg-white text-[#0f1117]'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="3.5"  r="1.2" fill="currentColor"/>
              <circle cx="8" cy="8"    r="1.2" fill="currentColor"/>
              <circle cx="8" cy="12.5" r="1.2" fill="currentColor"/>
            </svg>
          </button>

          {showDotsMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDotsMenu(false)}/>
              <div className="absolute right-0 top-12 bg-[#1E2028] border border-white/[0.08] rounded-xl shadow-xl z-50 py-1.5 min-w-[180px]">
                <button
                  onClick={async () => {
                    const supabase = createClient()
                    await supabase.auth.signOut()
                    window.location.href = '/login'
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#9BA0AD] hover:text-[#F8F7F4] hover:bg-white/[0.04] transition-colors text-left"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M5 12H2a1 1 0 01-1-1V3a1 1 0 011-1h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    <path d="M9.5 10L13 7l-3.5-3M13 7H5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Cerrar sesión
                </button>
                <div className="h-px bg-white/[0.06] my-1"/>
                <button
                  onClick={() => {
                    setShowDotsMenu(false)
                    setConfirmModal({
                      title: 'Eliminar cuenta',
                      desc: 'Se eliminarán todos tus proyectos, canciones y datos. Esta acción no se puede deshacer.',
                      onConfirm: async () => {
                        const supabase = createClient()
                        await supabase.from('profiles').delete().eq('id', userId)
                        await supabase.auth.signOut()
                        window.location.href = '/login'
                      }
                    })
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/5 transition-colors text-left"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 3.5h10M4.5 3.5V2.5h5v1M5.5 6v4M8.5 6v4M3 3.5l.5 9h7l.5-9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Eliminar cuenta
                </button>
              </div>
            </>
          )}
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-8 py-10">

        {/* Tarjeta de perfil */}
        <div className="bg-[#181c27] border border-white/[0.07] rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-5">

            {/* Avatar — click abre modal */}
            <div
              onClick={() => setShowAvatarModal(true)}
              className="relative w-20 h-20 rounded-2xl bg-[#6E62F5] flex items-center justify-center text-2xl font-bold text-white overflow-hidden flex-shrink-0 cursor-pointer group"
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
              <span className="text-2xl font-medium text-[#EAE9E6] font-mono block truncate">
                @{profile.username || 'sin nombre'}
              </span>
              <span className={`text-xs font-mono mt-1 block ${plan.color}`}>
                {plan.label}
              </span>
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
              <p className="text-[#555966] text-xs font-mono uppercase tracking-wider mb-3">Nombre de usuario</p>
              {editing ? (
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555966] font-mono text-sm">@</div>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase())}
                    className="w-full bg-[#0f1117] border border-white/[0.07] focus:border-[#6E62F5]/40 text-[#EAE9E6] rounded-xl pl-8 pr-4 py-2.5 text-sm outline-none transition-colors font-mono"
                  />
                </div>
              ) : (
                <p className="text-[#EAE9E6] font-mono">@{profile.username || 'sin nombre'}</p>
              )}
            </div>

            <div className="bg-[#181c27] border border-white/[0.07] rounded-xl p-5">
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
                            ? 'bg-[#6E62F5]/10 border-[#6E62F5]/25 text-[#EAE9E6]'
                            : isDisabled
                            ? 'opacity-20 cursor-not-allowed border-white/[0.04]'
                            : 'border-white/[0.07] text-[#9BA0AD] hover:border-white/[0.14] hover:text-[#EAE9E6]'
                        }`}
                      >
                        <span>{emoji}</span>
                        <span className="text-sm font-medium flex-1">{label}</span>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'bg-[#6E62F5] border-[#6E62F5]' : 'border-white/20'
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
                      <span key={r} className="flex items-center gap-1.5 text-sm bg-[#1f2335] border border-white/[0.07] text-[#9BA0AD] px-3 py-1.5 rounded-xl font-mono">
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
          <div className="bg-[#181c27] border border-white/[0.07] rounded-xl p-5">
            <p className="text-[#555966] text-xs font-mono uppercase tracking-wider mb-4">Correo electrónico</p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#1f2335] border border-white/[0.07] flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="3" width="12" height="8" rx="1" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
                  <path d="M1 4l6 4 6-4" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <p className="text-[#EAE9E6] text-sm font-mono">{email}</p>
                <p className="text-[#555966] text-xs mt-0.5">Privado — no visible públicamente</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Plan */}
        {tab === 'plan' && (
          <div className="bg-[#181c27] border border-white/[0.07] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[#555966] text-xs font-mono uppercase tracking-wider">Plan actual</p>
              {profile.plan !== 'free' && (
                <span className="text-xs bg-[#6E62F5]/10 text-[#6E62F5] font-mono px-2 py-0.5 rounded-md border border-[#6E62F5]/20">Activo</span>
              )}
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className={`text-2xl font-medium ${plan.color}`}>{plan.label}</span>
              <span className="text-[#555966] text-sm font-mono">{plan.price}</span>
            </div>

            {/* Contador de tracks */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-mono text-[#555966]">Canciones subidas</span>
                <span className="text-xs font-mono text-[#9BA0AD]">{trackCount} / 50</span>
              </div>
              <div className="w-full bg-white/[0.06] rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: `${Math.min((trackCount / 50) * 100, 100)}%`,
                    backgroundColor: trackCount >= 50 ? '#EF4444' : trackCount >= 40 ? '#F59E0B' : '#6E62F5',
                  }}
                />
              </div>
            </div>

            {profile.plan === 'free' && (
              <p className="text-[#555966] text-sm leading-relaxed">
                Mejora tu plan para acceder a analíticas, links con contraseña y más.
              </p>
            )}
          </div>
        )}

        {/* Enlaces legales */}
        <div className="mt-4 bg-[#181c27] border border-white/[0.07] rounded-xl overflow-hidden">
          {[
            { label: 'Política de Privacidad', href: '/privacy' },
            { label: 'Términos de Uso',        href: '/terms' },
            { label: 'Política de Cookies',    href: '/cookies' },
          ].map(({ label, href }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.04] last:border-0 text-[#9BA0AD] hover:text-[#F8F7F4] hover:bg-white/[0.02] transition-colors"
            >
              <span className="text-sm">{label}</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 10L10 2M10 2H5M10 2v5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          ))}
        </div>
      </main>
    </div>
  )
}
