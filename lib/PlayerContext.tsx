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

interface PlayerContextType {
  currentTrack:  Track | null
  isPlaying:     boolean
  playTrack:     (track: Track, queue?: Track[]) => void
  closePlayer:   () => void
}

const PlayerContext = createContext<PlayerContextType | null>(null)

// Waveform simulado — seed determinista por ID de track, estilo untitled
function generateBars(trackId: string, count = 60): number[] {
  let hash = 0
  for (let i = 0; i < trackId.length; i++) {
    hash = ((hash << 5) - hash) + trackId.charCodeAt(i)
    hash |= 0
  }
  const pseudo = (n: number) => Math.abs(Math.sin(hash * n * 127.1 + 311.7) * 43758.5453) % 1
  return Array.from({ length: count }, (_, i) => {
    const r = pseudo(i + 1)
    // Picos altos con valles muy bajos — como audio real
    const spike = r > 0.75 ? 0.7 + r * 0.3 : r > 0.5 ? 0.3 + r * 0.4 : 0.05 + r * 0.25
    return spike
  })
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [queue, setQueue]               = useState<Track[]>([])
  const [isPlaying, setIsPlaying]       = useState(false)
  const [currentTime, setCurrentTime]   = useState(0)
  const [duration, setDuration]         = useState(0)
  const [loading, setLoading]           = useState(false)
  const [repeatMode, setRepeatMode]     = useState<RepeatMode>('none')
  const [isDragging, setIsDragging]     = useState(false)

  const audioRef        = useRef<HTMLAudioElement | null>(null)
  const currentTrackRef = useRef<Track | null>(null)
  const queueRef        = useRef<Track[]>([])
  const repeatModeRef   = useRef<RepeatMode>('none')

  // Mantener refs sincronizados
  useEffect(() => { currentTrackRef.current = currentTrack }, [currentTrack])
  useEffect(() => { queueRef.current = queue }, [queue])
  useEffect(() => { repeatModeRef.current = repeatMode }, [repeatMode])

  const loadTrackRef = useRef<((track: Track, newQueue?: Track[]) => Promise<void>) | null>(null)

  useEffect(() => {
    const audio = new Audio()
    audioRef.current = audio

    const onTime  = () => { if (!isDragging) setCurrentTime(audio.currentTime) }
    const onMeta  = () => setDuration(audio.duration)
    const onPlay  = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnd   = () => {
      setIsPlaying(false)
      const track = currentTrackRef.current
      const q     = queueRef.current
      const mode  = repeatModeRef.current

      if (mode === 'one') {
        // Repetir canción actual
        audio.currentTime = 0
        audio.play().catch(() => {})
        return
      }

      if (!track || q.length === 0) return
      const idx = q.findIndex(t => t.id === track.id)

      if (idx < q.length - 1) {
        // Hay siguiente — avanzar
        loadTrackRef.current?.(q[idx + 1])
      } else if (mode === 'all') {
        // Repetir proyecto — volver al primero
        loadTrackRef.current?.(q[0])
      }
      // Si mode === 'none' y es la última, se para (setIsPlaying(false) ya lo hizo)
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
    if (newQueue) {
      setQueue(newQueue)
      queueRef.current = newQueue
    }
    setLoading(true)
    setCurrentTime(0)
    setDuration(0)
    try {
      const audio = audioRef.current
      if (!audio) return

      audio.pause()
      audio.src = ''

      // Notificar reproducción (fire & forget)
      fetch('/api/play-url', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ filePath: track.file_path }),
      }).catch(() => {})

      const audioUrl = `https://pub-5ad091444ab84f6e979864f025aa8867.r2.dev/${track.file_path}`
      audio.src = audioUrl
      audio.load()
      await audio.play()

      // Media Session API — pantalla de bloqueo
      if ('mediaSession' in navigator) {
        const artwork = track.coverUrl
          ? [
              { src: track.coverUrl, sizes: '96x96',   type: 'image/jpeg' },
              { src: track.coverUrl, sizes: '256x256',  type: 'image/jpeg' },
              { src: track.coverUrl, sizes: '512x512',  type: 'image/jpeg' },
            ]
          : [{ src: '/icon-512.png', sizes: '512x512', type: 'image/png' }]

        navigator.mediaSession.metadata = new MediaMetadata({
          title:  track.title,
          artist: track.projectTitle ?? 'demo.',
          album:  track.projectTitle ?? 'demo.',
          artwork,
        })
        navigator.mediaSession.setActionHandler('play',          () => audio.play())
        navigator.mediaSession.setActionHandler('pause',         () => audio.pause())
        navigator.mediaSession.setActionHandler('previoustrack', () => playPrev())
        navigator.mediaSession.setActionHandler('nexttrack',     () => playNext())
        navigator.mediaSession.setActionHandler('seekto', (e) => {
          if (e.seekTime !== undefined && audioRef.current) {
            audioRef.current.currentTime = e.seekTime
            setCurrentTime(e.seekTime)
          }
        })
        navigator.mediaSession.setActionHandler('seekbackward', (e) => {
          const skip = e.seekOffset ?? 10
          if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - skip)
        })
        navigator.mediaSession.setActionHandler('seekforward', (e) => {
          const skip = e.seekOffset ?? 10
          if (audioRef.current) audioRef.current.currentTime = Math.min(audio.duration, audioRef.current.currentTime + skip)
        })
      }
    } catch {}
    setLoading(false)
  }, [])

  // Guardar referencia de loadTrack para usarla en el closure de onEnd
  useEffect(() => { loadTrackRef.current = loadTrack }, [loadTrack])

  const playTrack = useCallback(async (track: Track, newQueue?: Track[]) => {
    if (currentTrackRef.current?.id === track.id) {
      const audio = audioRef.current
      if (!audio) return
      audio.paused ? audio.play() : audio.pause()
      return
    }
    const q = newQueue ?? [track]
    await loadTrack(track, q)
  }, [loadTrack])

  const playPrev = useCallback(() => {
    const q   = queueRef.current
    const idx = q.findIndex(t => t.id === currentTrackRef.current?.id)
    if (idx > 0) loadTrack(q[idx - 1])
    else if (audioRef.current) audioRef.current.currentTime = 0
  }, [loadTrack])

  const playNext = useCallback(() => {
    const q   = queueRef.current
    const idx = q.findIndex(t => t.id === currentTrackRef.current?.id)
    if (idx < q.length - 1) loadTrack(q[idx + 1])
  }, [loadTrack])

  const closePlayer = useCallback(() => {
    const audio = audioRef.current
    if (audio) { audio.pause(); audio.src = '' }
    setCurrentTrack(null)
    currentTrackRef.current = null
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setQueue([])
    queueRef.current = []
  }, [])

  const cycleRepeat = useCallback(() => {
    setRepeatMode(prev => {
      const next = prev === 'none' ? 'all' : prev === 'all' ? 'one' : 'none'
      repeatModeRef.current = next
      return next
    })
  }, [])

  const fmt = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`

  const currentIdx = queue.findIndex(t => t.id === currentTrack?.id)
  const hasPrev    = currentIdx > 0
  const hasNext    = currentIdx < queue.length - 1

  // Waveform bars para la canción actual
  const bars = currentTrack ? generateBars(currentTrack.id) : []
  const progressPct = duration > 0 ? currentTime / duration : 0

  // Swipe handling
  const swipeStartX  = useRef<number | null>(null)
  const swipeStarted = useRef(false)

  const handleTouchStart = (e: React.TouchEvent) => {
    swipeStartX.current  = e.touches[0].clientX
    swipeStarted.current = false
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (swipeStartX.current === null) return
    const dx = e.changedTouches[0].clientX - swipeStartX.current
    if (Math.abs(dx) > 60) {
      if (dx < 0 && hasNext) playNext()
      if (dx > 0 && hasPrev) playPrev()
    }
    swipeStartX.current = null
  }

  return (
    <PlayerContext.Provider value={{ currentTrack, isPlaying, playTrack, closePlayer }}>
      {children}

      {currentTrack && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pointer-events-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="max-w-2xl mx-auto pointer-events-auto">

            {/* Player pill — waveform integrado dentro, estilo untitled */}
            <div className="bg-[#1a1c24]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl px-3 py-2.5 flex items-center gap-2.5 shadow-2xl">

              {/* Portada circular */}
              <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden bg-[#252830]">
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

              {/* Columna central: título + waveform */}
              <div className="flex-1 min-w-0 flex flex-col justify-center gap-1 overflow-hidden">
                {/* Título y tiempo */}
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-xs font-medium text-[#EAE9E6] truncate leading-tight">{currentTrack.title}</p>
                  {duration > 0 && (
                    <p className="text-[10px] font-mono text-[#555966] flex-shrink-0">{fmt(currentTime)} / {fmt(duration)}</p>
                  )}
                </div>

                {/* Waveform clickeable dentro del pill */}
                <div
                  className="relative h-7 flex items-center cursor-pointer select-none"
                  style={{ gap: '1.5px' }}
                  onClick={(e) => {
                    if (!duration) return
                    const rect = e.currentTarget.getBoundingClientRect()
                    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
                    const t    = pct * duration
                    if (audioRef.current) audioRef.current.currentTime = t
                    setCurrentTime(t)
                  }}
                >
                  {bars.map((h, i) => (
                    <div
                      key={i}
                      style={{
                        width:        '2px',
                        flexShrink:   0,
                        height:       `${Math.max(h * 100, 6)}%`,
                        background:   'rgba(255,255,255,0.3)',
                        borderRadius: '1px',
                      }}
                    />
                  ))}
                  {/* Línea de progreso vertical amarilla — como untitled */}
                  <div
                    className="absolute top-0 bottom-0 w-[1.5px] pointer-events-none"
                    style={{
                      left:       `${progressPct * 100}%`,
                      background: '#F5C842',
                      transition: 'left 0.1s linear',
                    }}
                  />
                </div>
              </div>

              {/* Botón repetir */}
              <button
                onClick={cycleRepeat}
                title={repeatMode === 'none' ? 'Sin repetir' : repeatMode === 'all' ? 'Repetir proyecto' : 'Repetir canción'}
                className={`w-7 h-7 flex-shrink-0 flex items-center justify-center transition-colors ${
                  repeatMode !== 'none' ? 'text-[#6E62F5]' : 'text-[#555966] hover:text-[#9BA0AD]'
                }`}
              >
                {repeatMode === 'one' ? (
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                    <path d="M2 4h10a2 2 0 012 2v2a2 2 0 01-2 2H4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                    <path d="M4 7L2 10l2 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    <text x="7.5" y="9.5" fontSize="4.5" fill="currentColor" fontFamily="monospace" fontWeight="bold" textAnchor="middle">1</text>
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                    <path d="M2 4h10a2 2 0 012 2v2a2 2 0 01-2 2H4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                    <path d="M4 7L2 10l2 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>

              {/* Play / Pause */}
              <button
                onClick={() => { const a = audioRef.current; if (!a) return; a.paused ? a.play() : a.pause() }}
                disabled={loading}
                className="w-9 h-9 flex-shrink-0 rounded-full bg-[#6E62F5] hover:bg-[#5A4FD4] flex items-center justify-center transition-colors disabled:opacity-40"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                ) : isPlaying ? (
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="white">
                    <rect x="1" y="1" width="4" height="10" rx="1"/>
                    <rect x="7" y="1" width="4" height="10" rx="1"/>
                  </svg>
                ) : (
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="white">
                    <path d="M2 1.5l9 4.5-9 4.5V1.5z"/>
                  </svg>
                )}
              </button>

              {/* Cerrar */}
              <button onClick={closePlayer} className="w-7 h-7 flex-shrink-0 flex items-center justify-center text-[#555966] hover:text-[#EAE9E6] transition-colors">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider')
  return ctx
}
