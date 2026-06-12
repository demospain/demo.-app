'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

interface Props {
  userId:            string
  suggestedUsername: string
}

type Role = 'artist' | 'producer' | 'engineer' | 'listener'

const ROLES: { id: Role; label: string; emoji: string; desc: string }[] = [
  { id: 'artist',   label: 'Artista',            emoji: '🎤', desc: 'Subo y comparto mi música' },
  { id: 'producer', label: 'Productor',           emoji: '🎛️', desc: 'Gestiono proyectos con artistas' },
  { id: 'engineer', label: 'Ingeniero de sonido', emoji: '🎚️', desc: 'Mezcla, máster y entrega' },
  { id: 'listener', label: 'Oyente',              emoji: '🎧', desc: 'Escucho música compartida' },
]

const PLANS_ARTIST = [
  {
    id: 'free',
    label: 'Free',
    price: '0',
    period: 'EUR/mes',
    features: ['50 tracks / 3 GB', 'Proyectos ilimitados', 'Reproductor waveform', 'Notificaciones básicas', 'Comentarios en tiempo exacto', 'Historial de versiones']
  },
  {
    id: 'pro_artist',
    label: 'Pro Artista',
    price: '5',
    period: 'EUR/mes',
    highlight: true,
    features: ['Tracks ilimitados', 'Analíticas profundas', 'Links con contraseña', 'Plantillas para redes', 'Speed control y pitch shifting']
  },
]

const PLANS_PRO = [
  {
    id: 'free',
    label: 'Free',
    price: '0',
    period: 'EUR/mes',
    features: ['2 clientes activos', '3 GB almacenamiento', 'Links de compartición']
  },
  {
    id: 'pro_producer',
    label: 'Pro Productor',
    price: '8',
    period: 'EUR/mes',
    highlight: true,
    features: ['15 clientes activos', '30 GB almacenamiento', 'Historial de versiones', 'Notas privadas', 'Estados por track']
  },
  {
    id: 'studio',
    label: 'Studio',
    price: '19',
    period: 'EUR/mes',
    features: ['Clientes ilimitados', '100 GB almacenamiento', 'Dashboard multi-cliente', 'White-label básico']
  },
]

export default function OnboardingClient({ userId, suggestedUsername }: Props) {
  const [step, setStep]                   = useState(1)
  const [username, setUsername]           = useState(suggestedUsername)
  const [usernameError, setUsernameError] = useState('')
  const [checking, setChecking]           = useState(false)
  const [roles, setRoles]                 = useState<Role[]>([])
  const [selectedPlan, setSelectedPlan]   = useState('free')
  const [saving, setSaving]               = useState(false)
  const supabase = createClient()

  const isListener    = roles.length === 1 && roles[0] === 'listener'
  const needsProPlan  = roles.includes('producer') || roles.includes('engineer')
  const plansToShow   = needsProPlan ? PLANS_PRO : PLANS_ARTIST

  const toggleRole = (role: Role) => {
    if (role === 'listener') {
      // Si ya está seleccionado como oyente, deseleccionar
      if (roles.includes('listener')) {
        setRoles([])
      } else {
        setRoles(['listener'])
      }
      return
    }
    // Si hay otros roles seleccionados (no oyente), toggle normal
    setRoles(prev => {
      const without = prev.filter(r => r !== 'listener')
      if (without.includes(role)) return without.filter(r => r !== role)
      return [...without, role]
    })
  }

  const isDisabled = (role: Role) => {
    if (role === 'listener') return roles.length > 0 && !roles.includes('listener')
    return roles.includes('listener')
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
      .update({ username, roles, plan: selectedPlan, onboarded: true })
      .eq('id', userId)
    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen bg-[#0d0d0f] flex flex-col items-center justify-center px-4 py-12">

      {/* Logo */}
      <div className="mb-10 text-center">
        <span className="font-mono text-4xl font-medium">
          demo<span className="text-[#7C6FFF]">.</span>
        </span>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
              s < step
                ? 'bg-[#7C6FFF] text-white'
                : s === step
                ? 'bg-[#7C6FFF]/20 border border-[#7C6FFF] text-[#7C6FFF]'
                : 'bg-[#1E2028] border border-white/[0.08] text-[#555966]'
            }`}>
              {s < step ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : s}
            </div>
            {s < 3 && <div className={`w-10 h-px ${s < step ? 'bg-[#7C6FFF]' : 'bg-white/[0.08]'}`}/>}
          </div>
        ))}
      </div>

      <div className="w-full max-w-md">

        {/* ── PASO 1: NOMBRE DE USUARIO ── */}
        {step === 1 && (
          <div className="bg-[#1E2028] border border-white/[0.08] rounded-2xl p-8">
            <h1 className="text-2xl font-medium text-[#F8F7F4] mb-2">¿Cómo te llaman?</h1>
            <p className="text-[#9BA0AD] text-sm mb-7">
              Tu nombre de usuario público en demo. Puedes cambiarlo después.
            </p>
            <div className="relative mb-2">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555966] font-mono text-base">@</div>
              <input
                type="text"
                value={username}
                onChange={e => checkUsername(e.target.value.toLowerCase())}
                placeholder="tunombre"
                className="w-full bg-[#111318] border border-white/[0.08] focus:border-[#7C6FFF]/50 text-[#F8F7F4] placeholder:text-[#333] rounded-xl pl-9 pr-4 py-3.5 text-base outline-none transition-colors font-mono"
              />
              {checking && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-[#7C6FFF] rounded-full animate-spin"/>
                </div>
              )}
            </div>
            {usernameError
              ? <p className="text-red-400 text-sm font-mono mb-4">{usernameError}</p>
              : username.length >= 3 && !checking
              ? <p className="text-[#1D9E75] text-sm font-mono mb-4">✓ Disponible</p>
              : <p className="text-[#555966] text-sm font-mono mb-4">Solo letras minúsculas, números y _</p>
            }
            <button
              onClick={() => setStep(2)}
              disabled={username.length < 3 || !!usernameError || checking}
              className="w-full bg-[#7C6FFF] hover:bg-[#4A3FCC] text-white font-medium py-3.5 rounded-xl text-base transition-colors disabled:opacity-40"
            >
              Continuar
            </button>
          </div>
        )}

        {/* ── PASO 2: ROLES ── */}
        {step === 2 && (
          <div className="bg-[#1E2028] border border-white/[0.08] rounded-2xl p-8">
            <h1 className="text-2xl font-medium text-[#F8F7F4] mb-2">¿Cómo usarás demo.?</h1>
            <p className="text-[#9BA0AD] text-sm mb-7">
              Puedes seleccionar varios roles. Esto personaliza tu experiencia.
            </p>
            <div className="flex flex-col gap-3 mb-7">
              {ROLES.map(role => {
                const isSelected = roles.includes(role.id)
                const disabled   = isDisabled(role.id)
                return (
                  <button
                    key={role.id}
                    onClick={() => !disabled && toggleRole(role.id)}
                    className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-[#7C6FFF]/10 border-[#7C6FFF]/40'
                        : disabled
                        ? 'bg-transparent border-white/[0.04] opacity-30 cursor-not-allowed'
                        : 'bg-transparent border-white/[0.08] hover:border-white/25 hover:bg-white/[0.02]'
                    }`}
                  >
                    <span className="text-2xl flex-shrink-0 leading-none">{role.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-base font-medium ${isSelected ? 'text-[#F8F7F4]' : disabled ? 'text-[#555966]' : 'text-[#F8F7F4]'}`}>
                        {role.label}
                      </p>
                      <p className="text-sm text-[#9BA0AD] mt-0.5">{role.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      isSelected ? 'bg-[#7C6FFF] border-[#7C6FFF]' : 'border-white/25'
                    }`}>
                      {isSelected && (
                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                          <path d="M1.5 4.5l2 2 4-4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-white/[0.08] text-[#9BA0AD] py-3 rounded-xl text-base hover:border-white/20 hover:text-[#F8F7F4] transition-colors"
              >
                Atrás
              </button>
              <button
                onClick={() => isListener ? handleFinish() : setStep(3)}
                disabled={roles.length === 0}
                className="flex-1 bg-[#7C6FFF] hover:bg-[#4A3FCC] text-white font-medium py-3 rounded-xl text-base transition-colors disabled:opacity-40"
              >
                {isListener ? 'Empezar' : 'Ver planes'}
              </button>
            </div>
          </div>
        )}

        {/* ── PASO 3: PLANES ── */}
        {step === 3 && (
          <div>
            <div className="text-center mb-7">
              <h1 className="text-2xl font-medium text-[#F8F7F4] mb-2">Elige tu plan</h1>
              <p className="text-[#9BA0AD] text-sm">Puedes cambiar de plan en cualquier momento.</p>
            </div>
            <div className="flex flex-col gap-3 mb-6">
              {plansToShow.map(plan => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`p-6 rounded-xl border text-left transition-all relative overflow-hidden ${
                    selectedPlan === plan.id
                      ? 'bg-[#7C6FFF]/8 border-[#7C6FFF]/40'
                      : 'bg-[#1E2028] border-white/[0.08] hover:border-white/20'
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#4A3FCC] via-[#7C6FFF] to-[#a78bfa]"/>
                  )}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs font-mono text-[#555966] uppercase tracking-wider mb-1">{plan.label}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-medium text-[#F8F7F4]">{plan.price}</span>
                        <span className="text-sm text-[#9BA0AD]">{plan.period}</span>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all ${
                      selectedPlan === plan.id ? 'bg-[#7C6FFF] border-[#7C6FFF]' : 'border-white/25'
                    }`}>
                      {selectedPlan === plan.id && (
                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                          <path d="M1.5 4.5l2 2 4-4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </div>
                  <ul className="flex flex-col gap-2">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-[#9BA0AD]">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0">
                          <path d="M2 6l3 3 5-5" stroke="#7C6FFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 border border-white/[0.08] text-[#9BA0AD] py-3 rounded-xl text-base hover:border-white/20 hover:text-[#F8F7F4] transition-colors"
              >
                Atrás
              </button>
              <button
                onClick={handleFinish}
                disabled={saving}
                className="flex-1 bg-[#7C6FFF] hover:bg-[#4A3FCC] text-white font-medium py-3 rounded-xl text-base transition-colors disabled:opacity-40"
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
