'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

interface Single {
  id:          string
  slug:        string
  track_id:    string
  track_title: string
  file_path:   string
  project_id:  string
  cover_url:   string | null
  artist_name: string | null
  created_at:  string
  tracks?:     { waveform: number[] | null } | null
}

const R2 = 'https://pub-5ad091444ab84f6e979864f025aa8867.r2.dev'

function fmt(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

// Patrón de respaldo — igual que en NowPlayingModal, para singles sin waveform guardada
const FALLBACK_HEIGHTS = [0.3, 0.5, 0.8, 0.6, 1, 0.7, 0.4, 0.9, 0.5, 0.7, 1, 0.6, 0.3,
  0.8, 0.5, 1, 0.7, 0.4, 0.9, 0.6, 0.3, 0.8, 0.5, 0.7, 1, 0.6, 0.4, 0.9,
  0.5, 0.8, 0.6, 1, 0.4, 0.7, 0.5, 0.9, 0.6, 0.3, 0.8, 0.5, 0.7, 1, 0.6,
  0.4, 0.9, 0.5, 0.8, 0.6, 1, 0.4, 0.7, 0.3, 0.5, 0.8, 0.6, 1, 0.7, 0.4,
  0.9, 0.5, 0.7, 1, 0.6, 0.3, 0.8, 0.5, 1, 0.7, 0.4, 0.9, 0.6, 0.3, 0.8,
  0.5, 0.7, 1, 0.6, 0.4, 0.9, 0.5, 0.8, 0.6, 1, 0.4, 0.7, 0.3, 0.5, 0.8,
  0.6, 1, 0.7, 0.4, 0.9, 0.5, 0.7, 1, 0.6, 0.3, 0.8, 0.5]

type AuthMode = 'signup' | 'login'

export default function SingleClient({ single, userId }: { single: Single; userId: string | null }) {
  const audioRef    = useRef<HTMLAudioElement | null>(null)
  const waveformRef = useRef<HTMLDivElement>(null)

  const [playing, setPlaying]   = useState(false)
  const [current, setCurrent]   = useState(0)
  const [duration, setDuration] = useState(0)
  const [loading, setLoading]   = useState(false)
  const [saved, setSaved]       = useState(false)
  const [saving, setSaving]     = useState(false)
  const [dragging, setDragging] = useState(false)
  const [dragTime, setDragTime] = useState(0)

  // Auth modal
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>('signup')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError]     = useState('')
  const [sent, setSent]               = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const audio = new Audio(`${R2}/${single.file_path}`)
    audioRef.current = audio
    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration))
    audio.addEventListener('timeupdate', () => setCurrent(audio.currentTime))
    audio.addEventListener('play',  () => setPlaying(true))
    audio.addEventListener('pause', () => setPlaying(false))
    audio.addEventListener('ended', () => { setPlaying(false); setCurrent(0) })
    return () => { audio.pause(); audio.src = '' }
  }, [single.file_path])

  // Comprobar si ya está guardado
  useEffect(() => {
    if (!userId) return
    supabase
      .from('saved_projects')
      .select('project_id')
      .eq('user_id', userId)
      .then(({ data }) => {
        if (data?.some(r => r.project_id === single.project_id)) setSaved(true)
      })
  }, [userId, single.project_id])

  const toggle = async () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      setLoading(true)
      await audio.play().catch(() => {})
      setLoading(false)
    } else {
      audio.pause()
    }
  }

  const waveform = single.tracks?.waveform && single.tracks.waveform.length > 0
    ? single.tracks.waveform
    : FALLBACK_HEIGHTS

  const shownTime = dragging ? dragTime : current
  const pct = duration > 0 ? (shownTime / duration) * 100 : 0

  const timeFromClientX = (clientX: number) => {
    if (!waveformRef.current || !duration) return 0
    const rect = waveformRef.current.getBoundingClientRect()
    const p = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    return p * duration
  }

  const onThumbDown = (clientX: number) => {
    setDragging(true)
    setDragTime(timeFromClientX(clientX))
    const onMove = (e: MouseEvent | TouchEvent) => {
      const x = 'touches' in e ? e.touches[0].clientX : e.clientX
      setDragTime(timeFromClientX(x))
    }
    const onUp = (e: MouseEvent | TouchEvent) => {
      const x = 'changedTouches' in e ? e.changedTouches[0].clientX : (e as MouseEvent).clientX
      const t = timeFromClientX(x)
      if (audioRef.current) audioRef.current.currentTime = t
      setCurrent(t)
      setDragging(false)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onUp)
  }

  const handleSave = async () => {
    if (!userId) {
      setAuthMode('signup')
      setShowAuth(true)
      return
    }
    setSaving(true)

    // Guardamos referencia al proyecto ORIGINAL del single, no una copia.
    // Así el nombre, portada y cambios del dueño se reflejan automáticamente
    // en la biblioteca del usuario que lo guardó.
    const { error } = await supabase
      .from('saved_projects')
      .insert({ project_id: single.project_id, user_id: userId })

    if (error) {
      console.error('Error al guardar single:', error)
      setSaving(false)
      return
    }

    setSaved(true)
    setSaving(false)
  }

  // Auth handlers — idénticos a PublicProjectClient, redirigen de vuelta al single
  const handleGoogle = async () => {
    setAuthLoading(true)
    setAuthError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(`/s/${single.slug}`)}` },
    })
    if (error) { setAuthError(error.message); setAuthLoading(false) }
  }

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError('')
    if (authMode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(`/s/${single.slug}`)}` },
      })
      if (error) { setAuthError(error.message); setAuthLoading(false) }
      else setSent(true)
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setAuthError('Email o contraseña incorrectos.'); setAuthLoading(false) }
      else window.location.reload()
    }
  }

  return (
    <main className="min-h-screen bg-[#0f1117] text-[#EAE9E6] flex flex-col items-center justify-center px-4 py-12">

      {/* Cabecera */}
      <div className="flex items-center justify-between w-full max-w-sm mb-10">
        <Link href={userId ? '/dashboard' : '/landing'} className="flex items-center gap-2 text-[#555966] hover:text-[#EAE9E6] transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-sm">{userId ? 'Mi biblioteca' : 'Volver'}</span>
        </Link>
        <Link href="/landing" className="font-mono text-lg font-medium tracking-tight opacity-50 hover:opacity-100 transition-opacity">
          demo<span className="text-[#6E62F5]">.</span>
        </Link>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm">
        {/* Portada */}
        <div className="w-full aspect-square rounded-2xl overflow-hidden mb-6" style={{ boxShadow: '0 24px 48px rgba(0,0,0,.6)' }}>
          {single.cover_url
            ? <img src={single.cover_url} alt="" className="w-full h-full object-cover"/>
            : <div className="w-full h-full bg-[#181c27] flex items-center justify-center text-6xl opacity-20">💿</div>
          }
        </div>

        {/* Info */}
        <div className="mb-5">
          <p className="text-xl font-medium truncate">{single.track_title}</p>
          {single.artist_name && (
            <p className="text-sm font-mono text-[#555966] mt-1">@{single.artist_name}</p>
          )}
        </div>

        {/* Waveform interactiva — mismo estilo que NowPlayingModal */}
        <div className="mb-5">
          <div
            ref={waveformRef}
            className="relative flex items-center gap-[2px] h-10 cursor-pointer touch-none"
            onMouseDown={e => onThumbDown(e.clientX)}
            onTouchStart={e => onThumbDown(e.touches[0].clientX)}
          >
            {waveform.map((h, i) => {
              const barPct = (i / waveform.length) * 100
              const isPast = barPct <= pct
              return (
                <div
                  key={i}
                  className="flex-1 rounded-full"
                  style={{
                    height: `${Math.max(h * 100, 8)}%`,
                    background: isPast ? '#6E62F5' : 'rgba(255,255,255,0.14)',
                    transition: dragging ? 'none' : 'background 0.1s ease',
                  }}
                />
              )
            })}
            <div
              className="absolute top-1/2 -translate-y-1/2 rounded-full bg-[#6E62F5] pointer-events-none"
              style={{
                width: dragging ? '4px' : '3px',
                height: dragging ? '130%' : '120%',
                left: `${pct}%`,
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 0 8px rgba(110,98,245,0.6)',
                transition: dragging ? 'none' : 'left 0.1s linear',
              }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="font-mono text-xs text-[#555966]">{fmt(shownTime)}</span>
            <span className="font-mono text-xs text-[#555966]">{duration > 0 ? fmt(duration) : '--:--'}</span>
          </div>
        </div>

        {/* Play */}
        <button
          onClick={toggle}
          disabled={loading}
          className="w-full h-14 rounded-xl bg-[#6E62F5] hover:bg-[#5A4FD4] flex items-center justify-center mb-3 transition-colors disabled:opacity-60"
          style={{ boxShadow: '0 6px 20px rgba(110,98,245,.4)' }}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
          ) : playing ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="white"><rect x="3" y="2" width="5" height="16" rx="1.5"/><rect x="12" y="2" width="5" height="16" rx="1.5"/></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="white"><path d="M4 2l14 8-14 8V2z"/></svg>
          )}
        </button>

        {/* Guardar */}
        <button
          onClick={handleSave}
          disabled={saved || saving}
          className={`w-full h-12 rounded-xl border flex items-center justify-center gap-2 text-sm font-medium transition-all ${
            saved
              ? 'border-[#1D9E75]/30 bg-[#1D9E75]/10 text-[#1D9E75]'
              : 'border-white/10 bg-white/[0.03] text-[#9BA0AD] hover:border-white/20 hover:text-[#EAE9E6]'
          }`}
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin"/>
          ) : saved ? (
            <>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Guardado en tu biblioteca
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v8M4 6l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 10v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
              Guardar en mi biblioteca
            </>
          )}
        </button>

        <p className="text-center text-xs font-mono text-[#383C47] mt-4">
          Compartido con demo<span className="text-[#6E62F5]">.</span>
        </p>
      </div>

      {/* Auth modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#13141a] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm relative">
            {sent ? (
              <div className="text-center py-4">
                <div className="text-3xl mb-3">📬</div>
                <p className="text-[#F8F7F4] font-medium mb-2">Revisa tu email</p>
                <p className="text-[#9BA0AD] text-sm">Al confirmar volverás automáticamente a esta canción.</p>
              </div>
            ) : (
              <>
                <div className="mb-5">
                  <h2 className="text-[#F8F7F4] font-medium mb-0.5">
                    {authMode === 'signup' ? 'Crear cuenta para guardar' : 'Entrar en demo.'}
                  </h2>
                  <p className="text-[#555966] text-xs font-mono">
                    {authMode === 'signup' ? 'Gratis, sin tarjeta.' : 'Bienvenido de nuevo.'}
                  </p>
                </div>

                <button
                  onClick={handleGoogle}
                  disabled={authLoading}
                  className="w-full flex items-center justify-center gap-3 bg-[#1E2028] hover:bg-[#252830] border border-white/[0.08] text-[#F8F7F4] font-medium py-3 px-4 rounded-xl transition-all text-sm mb-4 disabled:opacity-50"
                >
                  <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                    <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                  Continuar con Google
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-white/[0.06]"/>
                  <span className="text-[#333] text-xs font-mono">o</span>
                  <div className="flex-1 h-px bg-white/[0.06]"/>
                </div>

                <form onSubmit={handleEmail} className="flex flex-col gap-3">
                  <input
                    type="email" placeholder="tu@email.com" value={email}
                    onChange={e => setEmail(e.target.value)} required
                    className="bg-[#0d0d0f] border border-white/[0.06] focus:border-[#6E62F5]/40 text-[#F8F7F4] placeholder:text-[#2E3140] rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                  />
                  <input
                    type="password" placeholder="Contraseña" value={password}
                    onChange={e => setPassword(e.target.value)} required minLength={6}
                    className="bg-[#0d0d0f] border border-white/[0.06] focus:border-[#6E62F5]/40 text-[#F8F7F4] placeholder:text-[#2E3140] rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                  />
                  {authError && <p className="text-red-400 text-xs font-mono">{authError}</p>}
                  <button
                    type="submit" disabled={authLoading}
                    className="bg-[#6E62F5] hover:bg-[#5A4FD4] text-white font-medium py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
                  >
                    {authLoading ? 'Cargando...' : authMode === 'signup' ? 'Crear cuenta' : 'Entrar'}
                  </button>
                </form>

                <p className="text-center text-[#555966] text-xs mt-4">
                  {authMode === 'signup' ? (
                    <>¿Ya tienes cuenta?{' '}
                      <button onClick={() => { setAuthMode('login'); setAuthError('') }} className="text-[#6E62F5] hover:underline">Entrar</button>
                    </>
                  ) : (
                    <>¿Sin cuenta?{' '}
                      <button onClick={() => { setAuthMode('signup'); setAuthError('') }} className="text-[#6E62F5] hover:underline">Crear cuenta gratis</button>
                    </>
                  )}
                </p>
              </>
            )}

            <button
              onClick={() => { setShowAuth(false); setAuthError(''); setSent(false) }}
              className="absolute top-4 right-4 text-[#555966] hover:text-[#9BA0AD] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
