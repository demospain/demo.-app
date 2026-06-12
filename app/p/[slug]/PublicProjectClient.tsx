'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import AudioPlayer from '@/components/AudioPlayer'

interface Track {
  id:          string
  title:       string
  file_path:   string
  duration:    number | null
  track_order: number
}

interface Project {
  id:        string
  title:     string
  cover_url: string | null
  slug:      string
  ownerName: string
}

interface Props {
  project:    Project
  tracks:     Track[]
  isLoggedIn: boolean
  userId:     string | null
}

type AuthMode = 'signup' | 'login'

export default function PublicProjectClient({ project, tracks, isLoggedIn, userId }: Props) {
  const [playingTrack, setPlayingTrack] = useState<Track | null>(null)
  const [showAuth, setShowAuth]         = useState(false)
  const [authMode, setAuthMode]         = useState<AuthMode>('signup')
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [sent, setSent]                 = useState(false)
  const supabase                        = createClient()

  const fmt = (s: number | null) => {
    if (!s) return ''
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const handlePlayAttempt = (track: Track) => {
    if (isLoggedIn) {
      setPlayingTrack(playingTrack?.id === track.id ? null : track)
    } else {
      setShowAuth(true)
    }
  }

  const handleGoogle = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/p/${project.slug}` },
    })
    if (error) { setError(error.message); setLoading(false) }
  }

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (authMode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/p/${project.slug}` },
      })
      if (error) { setError(error.message); setLoading(false) }
      else setSent(true)
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError('Email o contraseña incorrectos.'); setLoading(false) }
      else window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-[#0d0d0f]">

      {/* Navbar mínima */}
      <nav className="h-12 border-b border-white/[0.05] flex items-center justify-between px-5 sticky top-0 z-50 bg-[#0d0d0f]/90 backdrop-blur-md">
        <span className="font-mono text-base font-medium tracking-tight">
          demo<span className="text-[#7C6FFF]">.</span>
        </span>
        {!isLoggedIn && (
          <button
            onClick={() => { setShowAuth(true); setAuthMode('login') }}
            className="text-[#9BA0AD] hover:text-[#F8F7F4] text-sm transition-colors"
          >
            Entrar
          </button>
        )}
        {isLoggedIn && (
          <a href="/dashboard" className="text-[#9BA0AD] hover:text-[#F8F7F4] text-sm transition-colors">
            Mi dashboard →
          </a>
        )}
      </nav>

      <main className="max-w-2xl mx-auto px-5 py-10 pb-36">

        {/* Cabecera del proyecto */}
        <div className="flex items-end gap-6 mb-8">
          {/* Portada */}
          <div className="w-36 h-36 flex-shrink-0 rounded-2xl bg-gradient-to-br from-[#1E2028] to-[#16171c] border border-white/[0.06] flex items-center justify-center shadow-2xl">
            {project.cover_url ? (
              <img src={project.cover_url} alt={project.title} className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <span className="text-5xl opacity-20">💿</span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 pb-1">
            <p className="text-[#555966] text-xs font-mono uppercase tracking-wider mb-1">Proyecto</p>
            <h1 className="text-2xl font-medium text-[#F8F7F4] leading-tight mb-1">{project.title}</h1>
            <p className="text-[#9BA0AD] text-sm">{project.ownerName}</p>
            <p className="text-[#555966] text-xs font-mono mt-1">
              {tracks.length} {tracks.length === 1 ? 'canción' : 'canciones'}
            </p>
          </div>
        </div>

        {/* Tracklist */}
        <div className="bg-[#0d0d0f] border border-white/[0.06] rounded-xl overflow-hidden mb-6">
          {tracks.length === 0 ? (
            <div className="px-4 py-8 text-center text-[#555966] text-sm font-mono">
              Sin canciones todavía.
            </div>
          ) : tracks.map((track, i) => (
            <div
              key={track.id}
              className={`flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.04] last:border-0 group transition-colors cursor-pointer ${
                playingTrack?.id === track.id ? 'bg-[#7C6FFF]/5' : 'hover:bg-white/[0.02]'
              }`}
              onClick={() => handlePlayAttempt(track)}
            >
              {/* Botón play */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                playingTrack?.id === track.id
                  ? 'bg-[#7C6FFF]'
                  : 'bg-[#1E2028] border border-white/[0.06] group-hover:border-[#7C6FFF]/30'
              }`}>
                {playingTrack?.id === track.id ? (
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="white">
                    <rect x="0.5" y="0.5" width="2.5" height="7" rx="0.5"/>
                    <rect x="5" y="0.5" width="2.5" height="7" rx="0.5"/>
                  </svg>
                ) : (
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 1l5.5 3-5.5 3V1z" fill={isLoggedIn ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)'}/>
                  </svg>
                )}
              </div>

              <span className="font-mono text-xs text-[#333] w-4 text-right flex-shrink-0">{i + 1}</span>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate transition-colors ${
                  playingTrack?.id === track.id ? 'text-[#7C6FFF]' : 'text-[#F8F7F4]'
                }`}>
                  {track.title}
                </p>
              </div>

              {track.duration && (
                <span className="text-[#555966] text-xs font-mono flex-shrink-0">{fmt(track.duration)}</span>
              )}

              {!isLoggedIn && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1a3 3 0 013 3v1H3V4a3 3 0 013-3z" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
                    <rect x="1" y="5" width="10" height="7" rx="1.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA para no logueados */}
        {!isLoggedIn && (
          <div className="bg-[#1E2028] border border-[#7C6FFF]/15 rounded-xl p-5 text-center">
            <p className="text-[#F8F7F4] font-medium mb-1">Crea una cuenta gratis para escuchar</p>
            <p className="text-[#555966] text-xs font-mono mb-4">
              demo. es gratis. Sin tarjeta. Sin spam.
            </p>
            <button
              onClick={() => { setShowAuth(true); setAuthMode('signup') }}
              className="bg-[#7C6FFF] hover:bg-[#4A3FCC] text-white font-medium px-6 py-2.5 rounded-xl text-sm transition-colors"
            >
              Crear cuenta gratis
            </button>
          </div>
        )}
      </main>

      {/* Reproductor */}
      {playingTrack && isLoggedIn && (
        <AudioPlayer
          trackId={playingTrack.id}
          filePath={playingTrack.file_path}
          title={playingTrack.title}
          onClose={() => setPlayingTrack(null)}
        />
      )}

      {/* Modal de autenticación */}
      {showAuth && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E2028] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">

            {sent ? (
              <div className="text-center py-4">
                <div className="text-3xl mb-3">📬</div>
                <p className="text-[#F8F7F4] font-medium mb-2">Revisa tu email</p>
                <p className="text-[#9BA0AD] text-sm">
                  Te hemos enviado un enlace. Al confirmar volverás automáticamente a este proyecto.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-5">
                  <h2 className="text-[#F8F7F4] font-medium mb-0.5">
                    {authMode === 'signup' ? 'Crear cuenta para escuchar' : 'Entrar en demo.'}
                  </h2>
                  <p className="text-[#555966] text-xs font-mono">
                    {authMode === 'signup' ? 'Gratis, sin tarjeta.' : 'Bienvenido de nuevo.'}
                  </p>
                </div>

                {/* Google */}
                <button
                  onClick={handleGoogle}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-[#111318] hover:bg-[#0d0d0f] border border-white/10 hover:border-white/20 text-[#F8F7F4] font-medium py-3 px-4 rounded-xl transition-all text-sm mb-4 disabled:opacity-50"
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
                  <div className="flex-1 h-px bg-white/[0.06]" />
                  <span className="text-[#333] text-xs font-mono">o</span>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                </div>

                <form onSubmit={handleEmail} className="flex flex-col gap-3">
                  <input
                    type="email" placeholder="tu@email.com" value={email}
                    onChange={e => setEmail(e.target.value)} required
                    className="bg-[#111318] border border-white/[0.08] focus:border-[#7C6FFF]/50 text-[#F8F7F4] placeholder:text-[#333] rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                  />
                  <input
                    type="password" placeholder="Contraseña" value={password}
                    onChange={e => setPassword(e.target.value)} required minLength={6}
                    className="bg-[#111318] border border-white/[0.08] focus:border-[#7C6FFF]/50 text-[#F8F7F4] placeholder:text-[#333] rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                  />
                  {error && <p className="text-red-400 text-xs font-mono">{error}</p>}
                  <button
                    type="submit" disabled={loading}
                    className="bg-[#7C6FFF] hover:bg-[#4A3FCC] text-white font-medium py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Cargando...' : authMode === 'signup' ? 'Crear cuenta' : 'Entrar'}
                  </button>
                </form>

                <p className="text-center text-[#555966] text-xs mt-4">
                  {authMode === 'signup' ? (
                    <>¿Ya tienes cuenta?{' '}
                      <button onClick={() => { setAuthMode('login'); setError('') }} className="text-[#7C6FFF] hover:underline">Entrar</button>
                    </>
                  ) : (
                    <>¿Sin cuenta?{' '}
                      <button onClick={() => { setAuthMode('signup'); setError('') }} className="text-[#7C6FFF] hover:underline">Crear cuenta gratis</button>
                    </>
                  )}
                </p>
              </>
            )}

            <button
              onClick={() => { setShowAuth(false); setError(''); setSent(false) }}
              className="absolute top-4 right-4 text-[#555966] hover:text-[#9BA0AD] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
