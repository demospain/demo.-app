'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

interface Props {
  userId:            string
  suggestedUsername: string
}

type Role = 'artist' | 'producer' | 'engineer' | 'listener'

const ROLES: { id: Role; label: string; emoji: string; desc: string }[] = [
  { id: 'artist',   label: 'Artista',             emoji: '🎤', desc: 'Subo y comparto mi música' },
  { id: 'producer', label: 'Productor',            emoji: '🎛️', desc: 'Gestiono proyectos con artistas' },
  { id: 'engineer', label: 'Ingeniero de sonido',  emoji: '🎚️', desc: 'Mezcla, máster y entrega' },
  { id: 'listener', label: 'Oyente',               emoji: '🎧', desc: 'Escucho música compartida' },
]

const PLANS_ARTIST = [
  { id: 'free',     label: 'Free',          price: '0',  period: 'EUR/mes', features: ['50 tracks / 3 GB', 'Proyectos ilimitados', 'Reproductor waveform', 'Notificaciones básicas', 'Comentarios en tiempo exacto', 'Historial de versiones'] },
  { id: 'pro_artist', label: 'Pro Artista', price: '5',  period: 'EUR/mes', features: ['Tracks ilimitados', 'Analíticas profundas', 'Links con contraseña', 'Plantillas para redes', 'Speed control y pitch shifting'], highlight: true },
]

const PLANS_PRO = [
  { id: 'free',         label: 'Free',              price: '0',  period: 'EUR/mes', features: ['2 clientes activos', '3 GB almacenamiento', 'Links de compartición'] },
  { id: 'pro_producer', label: 'Pro Productor',     price: '8',  period: 'EUR/mes', features: ['15 clientes activos', '30 GB almacenamiento', 'Historial de versiones', 'Notas privadas', 'Estados por track'], highlight: true },
  { id: 'studio',       label: 'Studio',            price: '19', period: 'EUR/mes', features: ['Clientes ilimitados', '100 GB almacenamiento', 'Dashboard multi-cliente', 'White-label básico'] },
]

export default function OnboardingClient({ userId, suggestedUsername }: Props) {
  const [step, setStep]           = useState(1)
  const [username, setUsername]   = useState(suggestedUsername)
  const [usernameError, setUsernameError] = useState('')
  const [checking, setChecking]   = useState(false)
  const [roles, setRoles]         = useState<Role[]>([])
  const [selectedPlan, setSelectedPlan] = useState('free')
  const [saving, setSaving]       = useState(false)
  const supabase = createClient()

  const isListener = roles.length === 1 && roles[0] === 'listener'
  const needsProPlan = roles.includes('producer') || roles.includes('engineer')
  const plansToShow = needsProPlan ? PLANS_PRO : PLANS_ARTIST

  const toggleRole = (role: Role) => {
    if (role === 'listener') {
      setRoles(['listener'])
      return
    }
    setRoles(prev => {
      const without = prev.filter(r => r !== 'listener')
      if (without.includes(role)) return without.filter(r => r !== role)
      return [...without, role]
    })
  }

  const checkUsername = async (val: string) => {
    setUsername(val)
    setUsernameError('')
    if (val.length < 3) return
    if (!/^[a-z0-9_]+$/.test(val)) {
      setUsernameError('Solo letras minúsculas, números y guiones bajos')
      return
    }
    setChecking(true)
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', val)
      .neq('id', userId)
      .single()
    if (data) setUsernameError('Este nombre de usuario ya está en uso')
    setChecking(false)
  }

  const handleFinish = async () => {
    setSaving(true)
    await supabase
      .from('profiles')
      .update({
        username,
        roles,
        plan: selectedPlan,
        onboarded: true,
      })
      .eq('id', userId)
    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen bg-[#0d0d0f] flex flex-col items-center justify-center px-4 py-12">

      {/* Logo */}
      <div className="mb-10 text-center">
        <span className="font-mono text-3xl font-medium">
          demo<span className="text-[#7C6FFF]">.</span>
        </span>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
              s < step ? 'bg-[#7C6FFF] text-white' :
              s === step ? 'bg-[#7C6FFF]/20 border border-[#7C6FFF] text-[#7C6FFF]' :
              'bg-[#1E2028] border border-white/[0.08] text-[#555966]'
            }`}>
              {s < step ? (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : s}
            </div>
            {s < 3 && <div className={`w-8 h-px ${s < step ? 'bg-[#7C6FFF]' : 'bg-white/[0.08]'}`}/>}
          </div>
        ))}
      </div>

      <div className="w-full max-w-md">

        {/* ── PASO 1: NOMBRE DE USUARIO ── */}
        {step === 1 && (
          <div className="bg-[#1E2028] border border-white/[0.08] rounded-2xl p-7">
            <h1 className="text-xl font-medium text-[#F8F7F4] mb-1">¿Cómo te llaman?</h1>
            <p className="text-[#555966] text-sm font-mono mb-6">
              Tu nombre de usuario público en demo. Puedes cambiarlo después.
            </p>
            <div className="relative mb-1">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555966] font-mono text-sm">@</div>
              <input
                type="text"
                value={username}
                onChange={e => checkUsername(e.target.value.toLowerCase())}
                placeholder="tunombre"
                className="w-full bg-[#111318] border border-white/[0.08] focus:border-[#7C6FFF]/50 text-[#F8F7F4] placeholder:text-[#333] rounded-xl pl-8 pr-4 py-3 text-sm outline-none transition-colors font-mono"
              />
              {checking && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-[#7C6FFF] rounded-full animate-spin"/>
                </div>
              )}
            </div>
            {usernameError && <p className="text-red-400 text-xs font-mono mt-1 mb-3">{usernameError}</p>}
            {!usernameError && username.length >= 3 && !checking && (
              <p className="text-[#1D9E75] text-xs font-mono mt-1 mb-3">✓ Disponible</p>
            )}
            {(!usernameError || username.length < 3) && !(!usernameError && username.length >= 3 && !checking) && (
              <p className="text-[#555966] text-xs font-mono mt-1 mb-3">Solo letras minúsculas, números y _</p>
            )}
            <button
              onClick={() => setStep(2)}
              disabled={username.length < 3 || !!usernameError || checking}
              className="w-full bg-[#7C6FFF] hover:bg-[#4A3FCC] text-white font-medium py-3 rounded-xl text-sm transition-colors disabled:opacity-40 mt-2"
            >
              Continuar
            </button>
          </div>
        )}

        {/* ── PASO 2: ROLES ── */}
        {step === 2 && (
          <div className="bg-[#1E2028] border border-white/[0.08] rounded-2xl p-7">
            <h1 className="text-xl font-medium text-[#F8F7F4] mb-1">¿Cómo usarás demo.?</h1>
            <p className="text-[#555966] text-sm font-mono mb-6">
              Puedes seleccionar varios roles. Esto personaliza tu experiencia.
            </p>
            <div className="flex flex-col gap-2 mb-6">
              {ROLES.map(role => {
                const isSelected = roles.includes(role.id)
                const isDisabled = role.id !== 'listener' && roles.includes('listener')
                  || role.id === 'listener' && roles.length > 0 && !roles.includes('listener')
                return (
                  <button
                    key={role.id}
                    onClick={() => !isDisabled && toggleRole(role.id)}
                    disabled={isDisabled}
                    className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-[#7C6FFF]/10 border-[#7C6FFF]/40 text-[#F8F7F4]'
                        : isDisabled
                        ? 'bg-transparent border-white/[0.04] text-[#333] cursor-not-allowed'
                        : 'bg-transparent border-white/[0.08] text-[#9BA0AD] hover:border-white/20 hover:text-[#F8F7F4]'
                    }`}
                  >
                    <span className="text-2xl flex-shrink-0">{role.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{role.label}</p>
                      <p className={`text-xs font-mono mt-0.5 ${isSelected ? 'text-[#9BA0AD]' : 'text-[#555966]'}`}>
                        {role.desc}
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${
                      isSelected ? 'bg-[#7C6FFF] border-[#7C6FFF]' : 'border-white/20'
                    }`}>
                      {isSelected && (
                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                          <path d="M1.5 4.5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-white/[0.08] text-[#9BA0AD] py-2.5 rounded-xl text-sm hover:border-white/20 transition-colors"
              >
                Atrás
              </button>
              <button
                onClick={() => isListener ? handleFinish() : setStep(3)}
                disabled={roles.length === 0}
                className="flex-1 bg-[#7C6FFF] hover:bg-[#4A3FCC] text-white font-medium py-2.5 rounded-xl text-sm transition-colors disabled:opacity-40"
              >
                {isListener ? 'Empezar' : 'Ver planes'}
              </button>
            </div>
          </div>
        )}

        {/* ── PASO 3: PLANES ── */}
        {step === 3 && (
          <div>
            <div className="text-center mb-6">
              <h1 className="text-xl font-medium text-[#F8F7F4] mb-1">Elige tu plan</h1>
              <p className="text-[#555966] text-sm font-mono">Puedes cambiar de plan en cualquier momento.</p>
            </div>
            <div className="flex flex-col gap-3 mb-6">
              {plansToShow.map(plan => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`p-5 rounded-xl border text-left transition-all relative ${
                    selectedPlan === plan.id
                      ? 'bg-[#7C6FFF]/8 border-[#7C6FFF]/40'
                      : 'bg-[#1E2028] border-white/[0.08] hover:border-white/20'
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#4A3FCC] via-[#7C6FFF] to-[#a78bfa] rounded-t-xl"/>
                  )}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs font-mono text-[#555966] uppercase tracking-wider mb-0.5">{plan.label}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-medium text-[#F8F7F4]">{plan.price}</span>
                        <span className="text-sm text-[#9BA0AD]">{plan.period}</span>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mt-1 transition-all ${
                      selectedPlan === plan.id ? 'bg-[#7C6FFF] border-[#7C6FFF]' : 'border-white/20'
                    }`}>
                      {selectedPlan === plan.id && (
                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                          <path d="M1.5 4.5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </div>
                  <ul className="flex flex-col gap-1.5">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-[#9BA0AD]">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="flex-shrink-0">
                          <path d="M2 5l2 2 4-4" stroke="#7C6FFF" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep(2)}
                className="flex-1 border border-white/[0.08] text-[#9BA0AD] py-2.5 rounded-xl text-sm hover:border-white/20 transition-colors"
              >
                Atrás
              </button>
              <button
                onClick={handleFinish}
                disabled={saving}
                className="flex-1 bg-[#7C6FFF] hover:bg-[#4A3FCC] text-white font-medium py-2.5 rounded-xl text-sm transition-colors disabled:opacity-40"
              >
                {saving ? 'Guardando...' : 'Empezar en demo.'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
