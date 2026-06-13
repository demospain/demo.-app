'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'

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

function formatDuration(s: number | null): string {
  if (!s) return ''
  const m   = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function formatTotalDuration(tracks: Track[]): string {
  const total = tracks.reduce((acc, t) => acc + (t.duration ?? 0), 0)
  if (!total) return ''
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export default function PublicProjectClient({ project, tracks, isLoggedIn, userId }: Props) {
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null)
  const [audioUrl, setAudioUrl]             = useState<string | null>(null)
  const [loadingTrackId, setLoadingTrackId] = useState<string | null>(null)
  const [currentTime, setCurrentTime]       = useState(0)
  const [duration, setDuration]             = useState(0)
  const [showAuth, setShowAuth]             = useState(false)
  const [authMode, setAuthMode]             = useState<AuthMode>('signup')
  const [email, setEmail]                   = useState('')
  const [password, setPassword]             = useState('')
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState('')
  const [sent, setSent]                     = useState(false)
  const [saved, setSaved]                   = useState(false)
  const [savingLoading, setSavingLoading]   = useState(false)
  const audioRef                            = useRef<HTMLAudioElement>(null)
  const supabase                            = createClient()

  const playingTrack = tracks.find(t => t.id === playingTrackId) ?? null

  useEffect(() => {
    if (!isLoggedIn || !userId) return
    const check = async () => {
      const { data } = await supabase
        .from('saved_projects')
        .select('id')
        .eq('user_id', userId)
        .eq('project_id', project.id)
        .single()
      if (data) setSaved(true)
    }
    check()
  }, [isLoggedIn, userId, project.id])

  // Cargar URL de audio directamente desde R2 (sin proxy)
  const loadAndPlay = async (track: Track) => {
    if (!isLoggedIn) { setShowAuth(true); setAuthMode('signup'); return }
    if (playingTrackId === track.id) {
      const audio = audioRef.current
      if (!audio) return
      audio.paused ? audio.play() : audio.pause()
      return
    }
    setLoadingTrackId(track.id)
    try {
      const res = await fetch('/api/play-url', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ filePath: track.file_path }),
      })
      const { url } = await res.json()
      setAudioUrl(url)
      setPlayingTrackId(track.id)
    } catch {}
    setLoadingTrackId(null)
  }

  useEffect(() => {
    if (!audioUrl || !audioRef.current) return
    audioRef.current.src = audioUrl
    audioRef.current.play()
  }, [audioUrl])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => setCurrentTime(audio.currentTime)
    const onMeta = () => setDuration(audio.duration)
    const onEnd  = () => {
      // Pasar a la siguiente canción automáticamente
      const idx = tracks.findIndex(t => t.id === playingTrackId)
      if (idx < tracks.length - 1) loadAndPlay(tracks[idx + 1])
      else setPlayingTrackId(null)
    }
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('ended', onEnd)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('ended', onEnd)
    }
  }, [playingTrackId, tracks])

  const handleSave = async () => {
    if (!isLoggedIn) { setShowAuth(true); setAuthMode('signup'); return }
    setSavingLoading(true)
    if (saved) {
      await supabase.from('saved_projects').delete().eq('user_id', userId!).eq('project_id', project.id)
      setSaved(false)
    } else {
      await supabase.from('saved_projects').insert({ user_id: userId!, project_id: project.id })
      setSaved(true)
    }
    setSavingLoading(false)
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

  const totalDuration = formatTotalDuration(tracks)

  return (
    <div className={`min-h-screen bg-[#0d0d0f] flex flex-col ${playingTrack ? 'pb-28' : ''}`}>

      <audio ref={audioRef}/>

      {/* Navbar */}
      <nav className="h-14 border-b border-white/[0.05] flex items-center justify-between px-6 sticky top-0 z-50 bg-[#0d0d0f]/95 backdrop-blur-md">
        <span className="font-mono text-lg font-medium tracking-tight">
          demo<span className="text-[#7C6FFF]">.</span>
        </span>
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <a href="/dashboard" className="text-[#9BA0AD] hover:text-[#F8F7F4] text-sm transition-colors font-mono">
              Mi biblioteca →
            </a>
          ) : (
            <button
              onClick={() => { setShowAuth(true); setAuthMode('login') }}
              className="text-[#9BA0AD] hover:text-[#F8F7F4] text-sm transition-colors font-mono"
            >
              Entrar
            </button>
          )}
        </div>
      </nav>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-10">

          {/* Columna izquierda */}
          <div className="flex flex-col gap-5">

            {/* Portada */}
            <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-[#252830] to-[#1a1a20] border border-white/[0.06] flex items-center justify-center overflow-hidden">
              {project.cover_url
                ? <img src={project.cover_url} alt={project.title} className="w-full h-full object-cover"/>
                : <div className="text-6xl opacity-30">💿</div>
              }
            </div>

            {/* Info */}
            <div>
              <h1 className="text-xl font-medium text-[#F8F7F4] mb-1.5">{project.title}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-[#9BA0AD]">{project.ownerName}</span>
                <span className="text-[#252830]">·</span>
                <span className="text-sm font-mono text-[#555966]">
                  {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
                </span>
                {totalDuration && (
                  <>
                    <span className="text-[#252830]">·</span>
                    <span className="text-sm font-mono text-[#555966]">{totalDuration}</span>
                  </>
                )}
              </div>
            </div>

            {/* Guardar */}
            <button
              onClick={handleSave}
              disabled={savingLoading}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                saved
                  ? 'bg-[#7C6FFF]/10 border-[#7C6FFF]/30 text-[#7C6FFF]'
                  : 'bg-transparent border-white/[0.08] text-[#9BA0AD] hover:border-white/20 hover:text-[#F8F7F4]'
              }`}
            >
              {saved ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M2 6.5l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Guardado en biblioteca
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Guardar en biblioteca
                </>
              )}
            </button>

            {/* CTA no logueados */}
            {!isLoggedIn && (
              <div className="bg-[#13141a] border border-[#7C6FFF]/15 rounded-xl p-4">
                <p className="text-[#F8F7F4] text-sm font-medium mb-1">Crea una cuenta para escuchar</p>
                <p className="text-[#555966] text-xs font-mono mb-3">Gratis. Sin tarjeta. Sin spam.</p>
                <button
                  onClick={() => { setShowAuth(true); setAuthMode('signup') }}
                  className="w-full bg-[#7C6FFF] hover:bg-[#6B5FE8] text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-colors"
                >
                  Crear cuenta gratis
                </button>
              </div>
            )}
          </div>

          {/* Columna derecha — tracklist */}
          <div className="flex flex-col gap-4">
            {tracks.length > 0 && (
              <div className="bg-[#0d0d0f] border border-white/[0.06] rounded-xl overflow-visible">
                <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
                  <span className="text-[#555966] text-sm font-mono uppercase tracking-wider">Tracklist</span>
                  <span className="text-[#555966] text-sm font-mono">
                    {tracks.length} {tracks.length === 1 ? 'canción' : 'canciones'}
                    {totalDuration && ` · ${totalDuration}`}
                  </span>
                </div>

                {tracks.map((track, i) => {
                  const isPlaying  = playingTrackId === track.id
                  const isLoading  = loadingTrackId === track.id
                  return (
                    <div
                      key={track.id}
                      onClick={() => loadAndPlay(track)}
                      className={`flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.04] last:border-0 group transition-colors cursor-pointer ${
                        isPlaying ? 'bg-[#7C6FFF]/5' : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <button className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        isPlaying
                          ? 'bg-[#7C6FFF] text-white'
                          : 'bg-[#1E2028] text-[#555966] group-hover:bg-[#252830] group-hover:text-[#9BA0AD]'
                      }`}>
                        {isLoading ? (
                          <div className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin"/>
                        ) : isPlaying ? (
                          <svg width="9" height="9" viewBox="0 0 9 9" fill="white">
                            <rect x="0.5" y="0.5" width="3" height="8" rx="0.5"/>
                            <rect x="5.5" y="0.5" width="3" height="8" rx="0.5"/>
                          </svg>
                        ) : (
                          <svg width="9" height="9" viewBox="0 0 9 9" fill="currentColor">
                            <path d="M2 1l6 3.5L2 8V1z"/>
                          </svg>
                        )}
                      </button>

                      <span className="text-[#2E3140] font-mono text-sm w-5 text-right flex-shrink-0 group-hover:text-[#555966] transition-colors">
                        {i + 1}
                      </span>

                      <div className="flex-1 min-w-0">
                        <p className={`text-base font-medium truncate transition-colors ${
                          isPlaying ? 'text-[#7C6FFF]' : 'text-[#F8F7F4]'
                        }`}>
                          {track.title}
                        </p>
                      </div>

                      {track.duration && (
                        <span className="text-[#555966] text-sm font-mono flex-shrink-0">
                          {formatDuration(track.duration)}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {tracks.length === 0 && (
              <div className="border border-dashed border-white/[0.06] rounded-xl p-10 text-center">
                <p className="text-[#555966] text-sm font-mono">Sin canciones todavía.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Reproductor inline */}
      {playingTrack && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#13141a]/95 backdrop-blur-md border-t border-white/[0.06] px-6 py-3">
          <div className="max-w-6xl mx-auto flex items-center gap-4">
            <button
              onClick={() => audioRef.current?.paused ? audioRef.current.play() : audioRef.current?.pause()}
              className="w-9 h-9 rounded-full bg-[#7C6FFF] hover:bg-[#6B5FE8] flex items-center justify-center flex-shrink-0 transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="white">
                <rect x="0.5" y="0.5" width="3.5" height="9" rx="0.5"/>
                <rect x="6" y="0.5" width="3.5" height="9" rx="0.5"/>
              </svg>
            </button>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#F8F7F4] truncate">{playingTrack.title}</p>
              <p className="text-xs font-mono text-[#555966]">{project.ownerName}</p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-xs font-mono text-[#555966]">
                {formatDuration(Math.floor(currentTime))} / {formatDuration(Math.floor(duration))}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 0}
                value={currentTime}
                onChange={e => {
                  const t = Number(e.target.value)
                  if (audioRef.current) audioRef.current.currentTime = t
                  setCurrentTime(t)
                }}
                className="w-32 accent-[#7C6FFF]"
              />
              <button
                onClick={() => { audioRef.current?.pause(); setPlayingTrackId(null); setAudioUrl(null) }}
                className="text-[#555966] hover:text-[#9BA0AD] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal auth */}
      {showAuth && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#13141a] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm relative">
            {sent ? (
              <div className="text-center py-4">
                <div className="text-3xl mb-3">📬</div>
                <p className="text-[#F8F7F4] font-medium mb-2">Revisa tu email</p>
                <p className="text-[#9BA0AD] text-sm">Al confirmar volverás automáticamente a este proyecto.</p>
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

                <button
                  onClick={handleGoogle}
                  disabled={loading}
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
                    className="bg-[#0d0d0f] border border-white/[0.06] focus:border-[#7C6FFF]/40 text-[#F8F7F4] placeholder:text-[#2E3140] rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                  />
                  <input
                    type="password" placeholder="Contraseña" value={password}
                    onChange={e => setPassword(e.target.value)} required minLength={6}
                    className="bg-[#0d0d0f] border border-white/[0.06] focus:border-[#7C6FFF]/40 text-[#F8F7F4] placeholder:text-[#2E3140] rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                  />
                  {error && <p className="text-red-400 text-xs font-mono">{error}</p>}
                  <button
                    type="submit" disabled={loading}
                    className="bg-[#7C6FFF] hover:bg-[#6B5FE8] text-white font-medium py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
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
