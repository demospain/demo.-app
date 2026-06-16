'use client'

import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react'

interface Track {
  id:            string
  title:         string
  file_path:     string
  projectTitle?: string
  coverUrl?:     string
}

type RepeatMode = 'none' | 'one' | 'all'

type ShuffleMode = 'none' | 'project' | 'library'

interface PlayerContextType {
  currentTrack:        Track | null
  isPlaying:           boolean
  shuffleMode:         ShuffleMode
  playTrack:           (track: Track, queue?: Track[]) => void
  closePlayer:         () => void
  shuffleProject:      () => void
  playShuffledLibrary: (tracks: Track[]) => void
}

const PlayerContext = createContext<PlayerContextType | null>(null)

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [queue, setQueue]               = useState<Track[]>([])
  const [isPlaying, setIsPlaying]       = useState(false)
  const [currentTime, setCurrentTime]   = useState(0)
  const [duration, setDuration]         = useState(0)
  const [loading, setLoading]           = useState(false)
  const [repeatMode, setRepeatMode]     = useState<RepeatMode>('none')
  const [volume, setVolume]             = useState(1)
  const [showQueue, setShowQueue]       = useState(false)
  const [shuffleMode, setShuffleMode]   = useState<ShuffleMode>('none')
  const shuffleModeRef                  = useRef<ShuffleMode>('none')

  const audioRef        = useRef<HTMLAudioElement | null>(null)
  const currentTrackRef = useRef<Track | null>(null)
  const queueRef        = useRef<Track[]>([])
  const repeatModeRef   = useRef<RepeatMode>('none')
  const loadTrackRef    = useRef<((track: Track, newQueue?: Track[]) => Promise<void>) | null>(null)

  useEffect(() => { currentTrackRef.current = currentTrack }, [currentTrack])
  useEffect(() => { queueRef.current = queue }, [queue])
  useEffect(() => { repeatModeRef.current = repeatMode }, [repeatMode])
  useEffect(() => { shuffleModeRef.current = shuffleMode }, [shuffleMode])

  useEffect(() => {
    const audio = new Audio()
    audioRef.current = audio

    const onTime  = () => setCurrentTime(audio.currentTime)
    const onMeta  = () => setDuration(audio.duration)
    const onPlay  = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnd   = () => {
      setIsPlaying(false)
      const track = currentTrackRef.current
      const q     = queueRef.current
      const mode  = repeatModeRef.current
      if (mode === 'one') { audio.currentTime = 0; audio.play().catch(() => {}); return }
      if (!track || q.length === 0) return
      const idx = q.findIndex(t => t.id === track.id)
      if (shuffleModeRef.current !== 'none') {
        const rest = q.filter((_, i) => i !== idx)
        if (rest.length > 0) loadTrackRef.current?.(rest[Math.floor(Math.random() * rest.length)])
      } else if (idx < q.length - 1) {
        loadTrackRef.current?.(q[idx + 1])
      } else if (mode === 'all') {
        loadTrackRef.current?.(q[0])
      }
    }

    audio.addEventListener('timeupdate',     onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('play',           onPlay)
    audio.addEventListener('pause',          onPause)
    audio.addEventListener('ended',          onEnd)
    return () => {
      audio.pause()
      audio.removeEventListener('timeupdate',     onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('play',           onPlay)
      audio.removeEventListener('pause',          onPause)
      audio.removeEventListener('ended',          onEnd)
    }
  }, [])

  const loadTrack = useCallback(async (track: Track, newQueue?: Track[]) => {
    setCurrentTrack(track)
    currentTrackRef.current = track
    if (newQueue) { setQueue(newQueue); queueRef.current = newQueue }
    setLoading(true)
    setCurrentTime(0)
    setDuration(0)
    try {
      const audio = audioRef.current
      if (!audio) return
      audio.pause()
      audio.src = ''
      fetch('/api/play-url', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: track.file_path }),
      }).catch(() => {})
      audio.src    = `https://pub-5ad091444ab84f6e979864f025aa8867.r2.dev/${track.file_path}`
      audio.volume = volume
      audio.load()
      await audio.play()
      if ('mediaSession' in navigator) {
        const artwork = track.coverUrl
          ? [{ src: track.coverUrl, sizes: '512x512', type: 'image/jpeg' }]
          : [{ src: '/icon-512.png', sizes: '512x512', type: 'image/png' }]
        navigator.mediaSession.metadata = new MediaMetadata({
          title: track.title, artist: track.projectTitle ?? 'demo.',
          album: track.projectTitle ?? 'demo.', artwork,
        })
        navigator.mediaSession.setActionHandler('play',          () => audio.play())
        navigator.mediaSession.setActionHandler('pause',         () => audio.pause())
        navigator.mediaSession.setActionHandler('previoustrack', () => playPrev())
        navigator.mediaSession.setActionHandler('nexttrack',     () => playNext())
        navigator.mediaSession.setActionHandler('seekto', e => {
          if (e.seekTime !== undefined && audioRef.current) {
            audioRef.current.currentTime = e.seekTime
            setCurrentTime(e.seekTime)
          }
        })
      }
    } catch {}
    setLoading(false)
  }, [volume])

  useEffect(() => { loadTrackRef.current = loadTrack }, [loadTrack])

  const playTrack = useCallback(async (track: Track, newQueue?: Track[]) => {
    if (currentTrackRef.current?.id === track.id) {
      const audio = audioRef.current
      if (!audio) return
      audio.paused ? audio.play() : audio.pause()
      return
    }
    await loadTrack(track, newQueue ?? [track])
  }, [loadTrack])

  const playPrev = useCallback(() => {
    const q   = queueRef.current
    const idx = q.findIndex(t => t.id === currentTrackRef.current?.id)
    if (idx > 0) loadTrackRef.current?.(q[idx - 1])
    else if (audioRef.current) audioRef.current.currentTime = 0
  }, [])

  const playNext = useCallback(() => {
    const q    = queueRef.current
    const idx  = q.findIndex(t => t.id === currentTrackRef.current?.id)
    if (shuffleModeRef.current !== 'none') {
      // Aleatoria: cualquiera excepto la actual
      const rest = q.filter((_, i) => i !== idx)
      if (rest.length === 0) return
      const pick = rest[Math.floor(Math.random() * rest.length)]
      loadTrackRef.current?.(pick)
    } else {
      if (idx < q.length - 1) loadTrackRef.current?.(q[idx + 1])
    }
  }, [])

  const closePlayer = useCallback(() => {
    const audio = audioRef.current
    if (audio) { audio.pause(); audio.src = '' }
    setCurrentTrack(null); currentTrackRef.current = null
    setIsPlaying(false); setCurrentTime(0); setDuration(0)
    setQueue([]); queueRef.current = []
    setShowQueue(false)
  }, [])

  const cycleRepeat = useCallback(() => {
    setRepeatMode(prev => {
      const next = prev === 'none' ? 'all' : prev === 'all' ? 'one' : 'none'
      repeatModeRef.current = next
      return next
    })
  }, [])

  // Fisher-Yates shuffle
  const shuffleArray = <T,>(arr: T[]): T[] => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  // Shuffle proyecto: mezcla la queue actual, la canción activa queda primera
  const shuffleProject = useCallback(() => {
    setShuffleMode(prev => {
      if (prev !== 'none') {
        // Desactivar — restaurar orden original por posición en queue (no tenemos el original,
        // así que simplemente desactivamos y la queue queda mezclada hasta que se cargue nuevo proyecto)
        setShuffleMode('none')
        return 'none'
      }
      const q       = queueRef.current
      const current = currentTrackRef.current
      if (q.length === 0) return 'none'
      const rest      = q.filter(t => t.id !== current?.id)
      const shuffled  = current ? [current, ...shuffleArray(rest)] : shuffleArray(rest)
      setQueue(shuffled)
      queueRef.current = shuffled
      return 'project'
    })
  }, [])

  // Shuffle biblioteca: recibe todos los tracks de todos los proyectos y los mezcla
  const playShuffledLibrary = useCallback((tracks: Track[]) => {
    if (tracks.length === 0) return
    if (shuffleMode === 'library') {
      // Desactivar shuffle biblioteca
      setShuffleMode('none')
      return
    }
    const shuffled = shuffleArray(tracks)
    setShuffleMode('library')
    loadTrackRef.current?.(shuffled[0], shuffled)
  }, [shuffleMode])

  const handleVolumeChange = useCallback((v: number) => {
    setVolume(v)
    if (audioRef.current) audioRef.current.volume = v
  }, [])

  const seek = (clientX: number, el: HTMLDivElement) => {
    if (!duration) return
    const rect = el.getBoundingClientRect()
    const pct  = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const t    = pct * duration
    if (audioRef.current) audioRef.current.currentTime = t
    setCurrentTime(t)
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`

  const currentIdx  = queue.findIndex(t => t.id === currentTrack?.id)
  const hasPrev     = currentIdx > 0
  const hasNext     = currentIdx < queue.length - 1
  const progressPct = duration > 0 ? currentTime / duration : 0

  // Swipe móvil animado — solo mueve la zona de info, no el pill entero
  const swipeStartX    = useRef<number | null>(null)
  const swipeStartY    = useRef<number | null>(null)
  const swipeIsHoriz   = useRef<boolean | null>(null) // null = no decidido aún
  const pillMobileRef  = useRef<HTMLDivElement | null>(null)
  const [swipeDx, setSwipeDx]     = useState(0)
  const [swipeAnim, setSwipeAnim] = useState<'none' | 'snap-left' | 'snap-right' | 'return'>('none')
  const SWIPE_THRESHOLD = 80

  // Listener no-passive para poder llamar preventDefault y evitar scroll
  useEffect(() => {
    const el = pillMobileRef.current
    if (!el) return
    const onTouchMove = (e: TouchEvent) => {
      if (swipeStartX.current === null) return
      const dx = e.touches[0].clientX - swipeStartX.current
      const dy = e.touches[0].clientY - (swipeStartY.current ?? 0)

      // Decidir dirección dominante en los primeros píxeles
      if (swipeIsHoriz.current === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        swipeIsHoriz.current = Math.abs(dx) > Math.abs(dy)
      }

      if (swipeIsHoriz.current) {
        e.preventDefault() // bloquea scroll vertical
        const limited = Math.max(
          hasPrev ? -120 : -16,
          Math.min(hasNext ? 120 : 16, dx)
        )
        setSwipeDx(limited)
      }
    }
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => el.removeEventListener('touchmove', onTouchMove)
  }, [hasPrev, hasNext])

  const handleTouchStart = (e: React.TouchEvent) => {
    swipeStartX.current  = e.touches[0].clientX
    swipeStartY.current  = e.touches[0].clientY
    swipeIsHoriz.current = null
    setSwipeAnim('none')
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (swipeStartX.current === null) return
    const dx = e.changedTouches[0].clientX - swipeStartX.current
    swipeStartX.current  = null
    swipeStartY.current  = null
    swipeIsHoriz.current = null

    if (!swipeIsHoriz.current && Math.abs(dx) < 5) { setSwipeDx(0); return }

    if (dx < -SWIPE_THRESHOLD && hasNext) {
      setSwipeAnim('snap-left')
      setTimeout(() => { playNext(); setSwipeDx(0); setSwipeAnim('none') }, 260)
    } else if (dx > SWIPE_THRESHOLD && hasPrev) {
      setSwipeAnim('snap-right')
      setTimeout(() => { playPrev(); setSwipeDx(0); setSwipeAnim('none') }, 260)
    } else {
      setSwipeAnim('return')
      setTimeout(() => { setSwipeDx(0); setSwipeAnim('none') }, 340)
    }
  }

  // Títulos adyacentes para el fade durante el swipe
  const prevTrack = hasPrev ? queue[currentIdx - 1] : null
  const nextTrack = hasNext ? queue[currentIdx + 1] : null
  const swipeLabel = swipeDx < -20 && nextTrack ? nextTrack.title
    : swipeDx > 20 && prevTrack ? prevTrack.title
    : null
  const swipeLabelOpacity = Math.min(1, (Math.abs(swipeDx) - 20) / 60)

  if (!currentTrack) {
    return (
      <PlayerContext.Provider value={{ currentTrack, isPlaying, shuffleMode, playTrack, closePlayer, shuffleProject, playShuffledLibrary }}>
        {children}
      </PlayerContext.Provider>
    )
  }

  // ── Elementos compartidos ──────────────────────────────────────────────────

  const Cover = ({ size, rounded }: { size: string; rounded: string }) => (
    <div className={`${size} ${rounded} flex-shrink-0 overflow-hidden bg-[#1E2028]`}>
      {currentTrack.coverUrl
        ? <img src={currentTrack.coverUrl} alt="" className="w-full h-full object-cover"/>
        : <div className="w-full h-full flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 2h6v8a2 2 0 01-2 2H3a2 2 0 01-2-2V4l2-2z" stroke="#555966" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="5" cy="9" r="1.5" stroke="#555966" strokeWidth="1.2"/>
              <path d="M8 4H5" stroke="#555966" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
      }
    </div>
  )

  const PlayPauseBtn = ({ size }: { size: string }) => (
    <button
      onClick={() => { const a = audioRef.current; if (!a) return; a.paused ? a.play() : a.pause() }}
      disabled={loading}
      className={`${size} rounded-full bg-white hover:bg-white/90 flex items-center justify-center transition-colors disabled:opacity-40 flex-shrink-0`}
    >
      {loading ? (
        <div className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin"/>
      ) : isPlaying ? (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="#0f1117"><rect x="1" y="1" width="3" height="8" rx="0.8"/><rect x="6" y="1" width="3" height="8" rx="0.8"/></svg>
      ) : (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="#0f1117"><path d="M2 1.2l7 3.8-7 3.8V1.2z"/></svg>
      )}
    </button>
  )

  const btnCls = (active = false) =>
    `flex items-center justify-center transition-colors flex-shrink-0 ${
      active ? 'text-[#6E62F5]' : 'text-[#555966] hover:text-[#9BA0AD]'
    }`

  const IconPrev = () => (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M3 3v10M13 3L6 8l7 5V3z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  const IconNext = () => (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M13 3v10M3 3l7 5-7 5V3z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  const IconShuffle = () => (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M2 4h3l7 8h2M14 4h-2l-2-2M14 12l-2 2M2 12h3l2-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  const IconRepeat = () => repeatMode === 'one' ? (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M2 5h9a2 2 0 012 2v2a2 2 0 01-2 2H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M5 8L3 11l2 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <text x="10.5" y="9" fontSize="4" fill="currentColor" fontFamily="monospace" fontWeight="bold" textAnchor="middle">1</text>
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M2 5h9a2 2 0 012 2v2a2 2 0 01-2 2H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M5 8L3 11l2 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  const IconQueue = () => (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M2 4h12M2 8h8M2 12h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <circle cx="13" cy="11.5" r="2" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M13 10.2v1.3l.8.6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  const IconVolume = () => volume === 0 ? (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M3 6H1v4h2l4 3V3L3 6z" fill="currentColor"/>
      <path d="M13 5l-4 4M9 5l4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ) : volume < 0.5 ? (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M3 6H1v4h2l4 3V3L3 6z" fill="currentColor"/>
      <path d="M10 6a2.5 2.5 0 010 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M3 6H1v4h2l4 3V3L3 6z" fill="currentColor"/>
      <path d="M10 5a4 4 0 010 6M12 3.5a6.5 6.5 0 010 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )

  return (
    <PlayerContext.Provider value={{ currentTrack, isPlaying, shuffleMode, playTrack, closePlayer, shuffleProject, playShuffledLibrary }}>
      {children}

      {/* ── Cola de reproducción ───────────────────────────────────────────── */}
      {showQueue && (
        <div className="fixed bottom-[88px] left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
          <div
            className="w-full max-w-[660px] bg-[#13141a]/98 backdrop-blur-xl border border-white/[0.07] rounded-2xl shadow-2xl pointer-events-auto overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#555966] uppercase tracking-wider">Cola</span>
              <span className="text-[11px] text-[#555966]">{queue.length} canciones</span>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {queue.map((track, i) => {
                const isActive = track.id === currentTrack.id
                return (
                  <div
                    key={track.id}
                    onClick={() => loadTrackRef.current?.(track)}
                    className={`flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors ${
                      isActive ? 'bg-white/[0.05]' : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <span className={`text-[11px] font-mono w-4 text-right flex-shrink-0 ${isActive ? 'text-[#6E62F5]' : 'text-[#555966]'}`}>
                      {isActive
                        ? <svg width="9" height="9" viewBox="0 0 10 10" fill="#6E62F5"><path d="M2 1.2l7 3.8-7 3.8V1.2z"/></svg>
                        : i + 1}
                    </span>
                    {track.coverUrl
                      ? <img src={track.coverUrl} alt="" className="w-6 h-6 rounded object-cover flex-shrink-0"/>
                      : <div className="w-6 h-6 rounded bg-[#252830] flex-shrink-0"/>
                    }
                    <div className="flex-1 min-w-0">
                      <p className={`text-[12px] truncate ${isActive ? 'text-[#EAE9E6] font-medium' : 'text-[#9BA0AD]'}`}>{track.title}</p>
                    </div>
                    {isActive && isPlaying && (
                      <div className="flex items-end gap-px h-3 flex-shrink-0">
                        {[0, 1, 2].map(j => (
                          <div key={j} className="w-[2px] bg-[#6E62F5] rounded-full animate-pulse" style={{ height: `${40 + j * 20}%`, animationDelay: `${j * 0.15}s` }}/>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Reproductor ───────────────────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-6"
        style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom, 16px) + 12px)' }}
      >
        {/* ── MÓVIL ─────────────────────────────────────────────────────── */}
        <div
          ref={pillMobileRef}
          className="md:hidden w-full max-w-lg bg-[#13141a]/96 backdrop-blur-xl border border-white/[0.07] rounded-2xl shadow-2xl overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex items-center gap-3 px-4 py-3">
            {/* Portada — fija, no se mueve */}
            <Cover size="w-11 h-11" rounded="rounded-xl"/>

            {/* Zona de info — esta es la que se arrastra */}
            <div
              className="flex-1 min-w-0 relative"
              style={{
                overflow: 'hidden',
                maskImage: swipeDx !== 0
                  ? 'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)'
                  : undefined,
                WebkitMaskImage: swipeDx !== 0
                  ? 'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)'
                  : undefined,
              }}
            >
              <div
                style={{
                  transform: `translateX(${
                    swipeAnim === 'snap-left'  ? '-140%' :
                    swipeAnim === 'snap-right' ? '140%'  :
                    `${swipeDx}px`
                  })`,
                  transition: swipeAnim === 'none'
                    ? 'none'
                    : swipeAnim === 'return'
                    ? 'transform 0.34s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    : 'transform 0.26s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
              {/* Título actual */}
              <p
                className="text-[14px] font-medium text-[#EAE9E6] truncate leading-tight"
                style={{ opacity: swipeLabel ? 1 - swipeLabelOpacity : 1 }}
              >
                {currentTrack.title}
              </p>
              {/* Título adyacente en fade */}
              {swipeLabel && (
                <p
                  className="text-[14px] font-medium text-[#EAE9E6] truncate leading-tight absolute top-0 left-0 right-0"
                  style={{ opacity: swipeLabelOpacity }}
                >
                  {swipeLabel}
                </p>
              )}
              <p className="text-[11px] text-[#555966] truncate font-mono mt-0.5">
                {currentTrack.projectTitle ?? 'demo.'}
              </p>
              </div>
            </div>

            {/* Botones — fijos, no se mueven */}
            <button onClick={cycleRepeat} className={`w-8 h-8 ${btnCls(repeatMode !== 'none')}`}><IconRepeat /></button>
            <PlayPauseBtn size="w-9 h-9"/>
            <button onClick={closePlayer} className={`w-8 h-8 ${btnCls()}`}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
          </div>

          {/* Barra de progreso */}
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[#555966]">{fmt(currentTime)}</span>
              <div className="flex-1 relative">
                <div
                  className="absolute inset-0 -top-3 -bottom-3 cursor-pointer"
                  onMouseDown={e => {
                    const el = e.currentTarget.parentElement!
                    seek(e.clientX, el as HTMLDivElement)
                    const onMove = (ev: MouseEvent) => seek(ev.clientX, el as HTMLDivElement)
                    const onUp   = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
                    window.addEventListener('mousemove', onMove)
                    window.addEventListener('mouseup', onUp)
                  }}
                  onTouchStart={e => {
                    e.stopPropagation()
                    const el = e.currentTarget.parentElement!
                    const onMove = (ev: TouchEvent) => seek(ev.touches[0].clientX, el as HTMLDivElement)
                    const onEnd  = () => { window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onEnd) }
                    window.addEventListener('touchmove', onMove, { passive: true })
                    window.addEventListener('touchend', onEnd)
                  }}
                />
                <div className="h-1 bg-white/[0.1] rounded-full">
                  <div className="h-full bg-white/70 rounded-full" style={{ width: `${progressPct * 100}%` }}/>
                </div>
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow pointer-events-none"
                  style={{ left: `calc(${progressPct * 100}% - 6px)` }}
                />
              </div>
              <span className="text-[10px] font-mono text-[#555966]">{duration > 0 ? fmt(duration) : '--:--'}</span>
            </div>
          </div>
        </div>

        {/* ── DESKTOP ───────────────────────────────────────────────────── */}
        <div className="hidden md:flex w-full max-w-[700px] bg-[#13141a]/96 backdrop-blur-xl border border-white/[0.07] rounded-2xl shadow-2xl items-center gap-3 px-4" style={{ height: '64px' }}>

          {/* Izq: portada + info — ancho fijo */}
          <div className="flex items-center gap-3 flex-shrink-0" style={{ width: '190px' }}>
            <Cover size="w-10 h-10" rounded="rounded-lg"/>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-[#EAE9E6] truncate leading-tight">{currentTrack.title}</p>
              <p className="text-[11px] text-[#555966] truncate font-mono">{currentTrack.projectTitle ?? 'demo.'}</p>
            </div>
          </div>

          {/* Centro: tiempo + barra de progreso arrastrable */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-mono text-[#555966] flex-shrink-0 w-8 text-right tabular-nums">{fmt(currentTime)}</span>
            <div className="flex-1 relative group cursor-pointer">
              {/* Área de toque grande */}
              <div
                className="absolute inset-0 -top-4 -bottom-4"
                onMouseDown={e => {
                  const track = e.currentTarget.parentElement!
                  seek(e.clientX, track as HTMLDivElement)
                  const onMove = (ev: MouseEvent) => seek(ev.clientX, track as HTMLDivElement)
                  const onUp   = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
                  window.addEventListener('mousemove', onMove)
                  window.addEventListener('mouseup', onUp)
                }}
              />
              {/* Track */}
              <div className="h-1 bg-white/[0.1] rounded-full">
                <div className="h-full bg-white/70 rounded-full pointer-events-none" style={{ width: `${progressPct * 100}%` }}/>
              </div>
              {/* Thumb — siempre visible */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${progressPct * 100}% - 6px)` }}
              />
            </div>
            <span className="text-[10px] font-mono text-[#555966] flex-shrink-0 w-8 tabular-nums">{duration > 0 ? fmt(duration) : '--:--'}</span>
          </div>

          {/* Der: controles todos en una fila, sin desbordarse */}
          <div className="flex items-center flex-shrink-0 gap-1" style={{ width: '220px' }}>
            <button onClick={playPrev} disabled={!hasPrev} className={`w-7 h-7 ${btnCls()} disabled:opacity-20`}><IconPrev /></button>
            <PlayPauseBtn size="w-9 h-9"/>
            <button onClick={playNext} disabled={!hasNext} className={`w-7 h-7 ${btnCls()} disabled:opacity-20`}><IconNext /></button>
            <button onClick={shuffleProject} disabled={!hasPrev && !hasNext} className={`w-7 h-7 ${btnCls(shuffleMode === 'project')} disabled:opacity-20 relative group/sh`}>
              <IconShuffle />
              {/* Dot indicador modo biblioteca */}
              {shuffleMode === 'library' && (
                <span className="absolute bottom-0.5 right-0.5 w-1 h-1 rounded-full bg-[#6E62F5]"/>
              )}
            </button>
            <button onClick={cycleRepeat} className={`w-7 h-7 ${btnCls(repeatMode !== 'none')}`}><IconRepeat /></button>
            <button onClick={() => setShowQueue(q => !q)} className={`w-7 h-7 ${btnCls(showQueue)}`}><IconQueue /></button>
            {/* Volumen — icono solo, barra vertical al hover */}
            <div className="relative group/vol flex-shrink-0">
              <button
                onClick={() => handleVolumeChange(volume > 0 ? 0 : 1)}
                className={`w-7 h-7 ${btnCls()}`}
              >
                <IconVolume />
              </button>
              {/* Barra vertical desplegable al hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pb-2 opacity-0 group-hover/vol:opacity-100 pointer-events-none group-hover/vol:pointer-events-auto transition-opacity duration-150">
                <div className="bg-[#1a1c24] border border-white/[0.08] rounded-xl px-3 py-3 shadow-xl flex flex-col items-center gap-2">
                  {/* Barra vertical */}
                  <div
                    className="relative w-[3px] bg-white/10 rounded-full cursor-pointer"
                    style={{ height: '64px' }}
                    onMouseDown={e => {
                      e.stopPropagation()
                      const el = e.currentTarget
                      const calc = (ev: MouseEvent) => {
                        const rect = el.getBoundingClientRect()
                        const pct  = 1 - Math.max(0, Math.min(1, (ev.clientY - rect.top) / rect.height))
                        handleVolumeChange(pct)
                      }
                      calc(e.nativeEvent)
                      const onMove = (ev: MouseEvent) => calc(ev)
                      const onUp   = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
                      window.addEventListener('mousemove', onMove)
                      window.addEventListener('mouseup', onUp)
                    }}
                  >
                    {/* Fill */}
                    <div
                      className="absolute bottom-0 left-0 w-full bg-white/70 rounded-full pointer-events-none"
                      style={{ height: `${volume * 100}%` }}
                    />
                    {/* Thumb */}
                    <div
                      className="absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow pointer-events-none"
                      style={{ bottom: `calc(${volume * 100}% - 6px)` }}
                    />
                  </div>
                  {/* Porcentaje */}
                  <span className="text-[9px] font-mono text-[#555966] tabular-nums">{Math.round(volume * 100)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider')
  return ctx
}
