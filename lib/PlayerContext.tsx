'use client'

import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase'
import NowPlayingModal from '@/components/NowPlayingModal'

interface Track {
  id:            string
  title:         string
  file_path:     string
  projectTitle?: string
  coverUrl?:     string
}

type RepeatMode  = 'none' | 'one' | 'all'
type ShuffleMode = 'none' | 'project' | 'library'

interface PlayerContextType {
  currentTrack:        Track | null
  isPlaying:           boolean
  shuffleMode:         ShuffleMode
  repeatMode:          RepeatMode
  currentTime:         number
  duration:            number
  queue:               Track[]
  loading:             boolean
  showNowPlaying:      boolean
  playTrack:           (track: Track, queue?: Track[]) => void
  closePlayer:         () => void
  shuffleProject:      () => void
  playShuffledLibrary: (tracks: Track[]) => void
  setLibraryUserId:    (userId: string) => void
  playNext:            () => void
  playPrev:            () => void
  cycleRepeat:         () => void
  seekTo:              (t: number) => void
  setShowNowPlaying:   (v: boolean) => void
}

const PlayerContext = createContext<PlayerContextType | null>(null)

// Fisher-Yates shuffle — fuera del componente para no recrearse
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [queue, setQueue]               = useState<Track[]>([])
  const [isPlaying, setIsPlaying]       = useState(false)
  const [showNowPlaying, setShowNowPlaying] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const [currentTime, setCurrentTime]   = useState(0)
  const [duration, setDuration]         = useState(0)
  const [loading, setLoading]           = useState(false)
  const [repeatMode, setRepeatMode]     = useState<RepeatMode>('none')
  const [volume, setVolume]             = useState(1)
  const [showQueue, setShowQueue]       = useState(false)
  const [shuffleMode, setShuffleMode]   = useState<ShuffleMode>('none')
  const [shuffleLoading, setShuffleLoading] = useState(false)
  const [showVolume, setShowVolume]         = useState(false)

  const audioRef           = useRef<HTMLAudioElement | null>(null)
  const currentTrackRef    = useRef<Track | null>(null)
  const queueRef           = useRef<Track[]>([])
  const repeatModeRef      = useRef<RepeatMode>('none')
  const shuffleModeRef     = useRef<ShuffleMode>('none')
  const shufflePendingRef  = useRef<Track[]>([])
  const loadTrackRef       = useRef<((track: Track, newQueue?: Track[]) => Promise<void>) | null>(null)
  const pickNextShuffleRef = useRef<(() => void) | null>(null)
  const userIdRef          = useRef<string | null>(null)
  const loadTokenRef       = useRef(0)
  const pendingPlayRef     = useRef(false) // iOS: play() bloqueado en background, reintenta al volver a primer plano
  const supabase           = createClient()

  useEffect(() => { currentTrackRef.current = currentTrack }, [currentTrack])
  useEffect(() => { queueRef.current = queue }, [queue])
  useEffect(() => { repeatModeRef.current = repeatMode }, [repeatMode])
  useEffect(() => { shuffleModeRef.current = shuffleMode }, [shuffleMode])

  useEffect(() => {
    const audio = new Audio()
    audioRef.current = audio
    if (typeof window !== 'undefined') (window as any).__demoAudio = audio

    const onTime  = () => setCurrentTime(audio.currentTime)
    const onMeta  = () => setDuration(audio.duration)
    const onPlay  = () => {
      setIsPlaying(true)
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing'
        // Refrescar metadata con la canción actual por si cambió
        const track = currentTrackRef.current
        if (track) {
          const origin  = typeof window !== 'undefined' ? window.location.origin : ''
          // Siempre mismo origen (sin problemas de CORS) y siempre un JPEG
          // 512x512 normalizado por el proxy — ver /api/artwork
          const artwork = track.coverUrl
            ? [{ src: `${origin}/api/artwork?url=${encodeURIComponent(track.coverUrl)}`, sizes: '512x512', type: 'image/jpeg' }]
            : [{ src: `${origin}/icon-512.png`, sizes: '512x512', type: 'image/png' }]
          navigator.mediaSession.metadata = new MediaMetadata({
            title: track.title, artist: track.projectTitle ?? 'demo.',
            album: track.projectTitle ?? 'demo.', artwork,
          })
        }
      }
    }
    const onPause = () => {
      setIsPlaying(false)
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'
    }
    const onEnd   = () => {
      setIsPlaying(false)
      const track = currentTrackRef.current
      const q     = queueRef.current
      const mode  = repeatModeRef.current
      if (mode === 'one') { audio.currentTime = 0; audio.play().catch(() => {}); return }
      if (!track || q.length === 0) return
      if (shuffleModeRef.current !== 'none') {
        pickNextShuffleRef.current?.()
      } else {
        const idx = q.findIndex(t => t.id === track.id)
        if (idx < q.length - 1) loadTrackRef.current?.(q[idx + 1])
        else if (mode === 'all') loadTrackRef.current?.(q[0])
      }
    }

    audio.addEventListener('timeupdate',     onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('play',           onPlay)
    audio.addEventListener('pause',          onPause)
    audio.addEventListener('ended',          onEnd)

    // iOS Safari: cuando el usuario salta canción desde la pantalla de bloqueo,
    // el audio.play() queda pendiente hasta que se vuelve a primer plano.
    // Detectamos esa situación y reintentamos el play al volver.
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && pendingPlayRef.current) {
        pendingPlayRef.current = false
        audioRef.current?.play().catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      audio.pause()
      audio.removeEventListener('timeupdate',     onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('play',           onPlay)
      audio.removeEventListener('pause',          onPause)
      audio.removeEventListener('ended',          onEnd)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  const loadTrack = useCallback(async (track: Track, newQueue?: Track[]) => {
    const token = ++loadTokenRef.current
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
      await audio.play().catch((err) => {
        // 'NotAllowedError' o 'AbortError' en background (iOS pantalla de bloqueo)
        // → marcamos para reintentar cuando la página vuelva a primer plano
        if (err?.name === 'NotAllowedError' || err?.name === 'AbortError') {
          pendingPlayRef.current = true
        }
      })
      // Si mientras esperábamos ya se lanzó una carga más nueva, no seguimos pisando su estado.
      if (token !== loadTokenRef.current) return
      if ('mediaSession' in navigator) {
        const origin  = typeof window !== 'undefined' ? window.location.origin : ''
        // Siempre mismo origen y normalizado a JPEG 512x512 válido (ver onPlay)
        const artwork = track.coverUrl
          ? [{ src: `${origin}/api/artwork?url=${encodeURIComponent(track.coverUrl)}`, sizes: '512x512', type: 'image/jpeg' }]
          : [{ src: `${origin}/icon-512.png`, sizes: '512x512', type: 'image/png' }]
        navigator.mediaSession.metadata = new MediaMetadata({
          title: track.title, artist: track.projectTitle ?? 'demo.',
          album: track.projectTitle ?? 'demo.', artwork,
        })
        navigator.mediaSession.playbackState = 'playing'
        navigator.mediaSession.setActionHandler('play',          () => audio.play().catch(() => {}))
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
    if (token === loadTokenRef.current) setLoading(false)
  }, [volume])

  useEffect(() => { loadTrackRef.current = loadTrack }, [loadTrack])

  // Elige la siguiente en modo aleatorio sin repetir hasta agotar todas
  const pickNextShuffle = useCallback(() => {
    const current = currentTrackRef.current
    if (shufflePendingRef.current.length === 0) {
      // Ciclo agotado — remezclar
      const all = shuffleArray(queueRef.current.filter(t => t.id !== current?.id))
      shufflePendingRef.current = all
    }
    const next = shufflePendingRef.current.shift()
    if (next) loadTrackRef.current?.(next)
  }, [])

  useEffect(() => { pickNextShuffleRef.current = pickNextShuffle }, [pickNextShuffle])

  const playTrack = useCallback(async (track: Track, newQueue?: Track[]) => {
    if (currentTrackRef.current?.id === track.id) {
      const audio = audioRef.current
      if (!audio) return
      audio.paused ? audio.play().catch(() => {}) : audio.pause()
      return
    }
    await loadTrack(track, newQueue ?? [track])
  }, [loadTrack])

  const playPrev = useCallback(() => {
    const q   = queueRef.current
    const idx = q.findIndex(t => t.id === currentTrackRef.current?.id)
    if (idx > 0) {
      loadTrackRef.current?.(q[idx - 1])
    } else if (audioRef.current) {
      audioRef.current.currentTime = 0
      setCurrentTime(0)
    }
  }, [])

  const playNext = useCallback(() => {
    if (shuffleModeRef.current !== 'none') {
      pickNextShuffle()
    } else {
      const q   = queueRef.current
      const idx = q.findIndex(t => t.id === currentTrackRef.current?.id)
      if (idx < q.length - 1) loadTrackRef.current?.(q[idx + 1])
    }
  }, [pickNextShuffle])

  const closePlayer = useCallback(() => {
    const audio = audioRef.current
    if (audio) { audio.pause(); audio.src = '' }
    setCurrentTrack(null); currentTrackRef.current = null
    setIsPlaying(false); setCurrentTime(0); setDuration(0)
    setQueue([]); queueRef.current = []
    setShowQueue(false)
    setShuffleMode('none'); shuffleModeRef.current = 'none'
    shufflePendingRef.current = []
  }, [])

  const cycleRepeat = useCallback(() => {
    setRepeatMode(prev => {
      const next = prev === 'none' ? 'all' : prev === 'all' ? 'one' : 'none'
      repeatModeRef.current = next
      return next
    })
  }, [])

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

  const seekTo = useCallback((t: number) => {
    if (audioRef.current) audioRef.current.currentTime = t
    setCurrentTime(t)
  }, [])

  const setLibraryUserId = useCallback((userId: string) => {
    userIdRef.current = userId
  }, [])

  // Fetch de todos los tracks de la biblioteca del usuario
  const fetchLibraryTracks = useCallback(async (): Promise<Track[]> => {
    const userId = userIdRef.current
    if (!userId) return []

    // Query 1: proyectos propios del usuario
    const { data: myProjects } = await supabase
      .from('projects')
      .select('id, title, cover_url')
      .eq('owner_id', userId)

    const myProjectIds = (myProjects ?? []).map((p: any) => p.id)

    // Query 2: proyectos guardados
    const { data: savedRows } = await supabase
      .from('saved_projects')
      .select('project_id, projects(id, title, cover_url)')
      .eq('user_id', userId)

    const savedProjects = (savedRows ?? []).map((r: any) => r.projects).filter(Boolean)
    const savedIds      = savedProjects.map((p: any) => p.id)

    const allProjectIds = Array.from(new Set([...myProjectIds, ...savedIds]))
    if (allProjectIds.length === 0) return []

    // Mapa id → proyecto para cover_url y título
    const projectMap: Record<string, any> = {}
    for (const p of [...(myProjects ?? []), ...savedProjects]) {
      if (p?.id) projectMap[p.id] = p
    }

    // Query 3: todos los tracks de esos proyectos
    const { data: tracks } = await supabase
      .from('tracks')
      .select('id, title, file_path, project_id')
      .in('project_id', allProjectIds)
      .limit(600)

    return (tracks ?? []).map((t: any) => {
      const proj = projectMap[t.project_id]
      return {
        id:           t.id,
        title:        t.title,
        file_path:    t.file_path,
        projectTitle: proj?.title ?? undefined,
        coverUrl:     proj?.cover_url
          ? `https://pub-5ad091444ab84f6e979864f025aa8867.r2.dev/${proj.cover_url}`
          : undefined,
      }
    })
  }, [])

  // Shuffle proyecto: mezcla la queue actual, la actual queda primero
  const shuffleProject = useCallback(() => {
    setShuffleMode(prev => {
      if (prev !== 'none') {
        shufflePendingRef.current = []
        shuffleModeRef.current = 'none'
        return 'none'
      }
      const q       = queueRef.current
      const current = currentTrackRef.current
      if (q.length === 0) return 'none'
      const rest     = q.filter(t => t.id !== current?.id)
      const shuffled = current ? [current, ...shuffleArray(rest)] : shuffleArray(rest)
      setQueue(shuffled)
      queueRef.current = shuffled
      shufflePendingRef.current = shuffled.filter(t => t.id !== current?.id)
      shuffleModeRef.current = 'project'
      return 'project'
    })
  }, [])

  // Shuffle biblioteca: recibe todos los tracks mezclados y arranca
  const playShuffledLibrary = useCallback((tracks: Track[]) => {
    if (tracks.length === 0) {
      setShuffleMode('none'); shuffleModeRef.current = 'none'
      shufflePendingRef.current = []
      return
    }
    if (shuffleModeRef.current === 'library') {
      setShuffleMode('none'); shuffleModeRef.current = 'none'
      shufflePendingRef.current = []
      return
    }
    const shuffled = shuffleArray(tracks)
    shufflePendingRef.current = shuffled.slice(1)
    setShuffleMode('library'); shuffleModeRef.current = 'library'
    loadTrackRef.current?.(shuffled[0], shuffled)
  }, [])

  // Cicla none → project → library → none
  const handleShuffleClick = useCallback(async () => {
    const current = shuffleModeRef.current
    if (current === 'none') {
      shuffleProject()
    } else if (current === 'project') {
      setShuffleLoading(true)
      shufflePendingRef.current = []
      const tracks = await fetchLibraryTracks()
      if (tracks.length > 0) {
        playShuffledLibrary(tracks)
      }
      setShuffleLoading(false)
    } else {
      setShuffleMode('none'); shuffleModeRef.current = 'none'
      shufflePendingRef.current = []
    }
  }, [shuffleProject, fetchLibraryTracks, playShuffledLibrary])

  const fmt = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`

  const currentIdx  = queue.findIndex(t => t.id === currentTrack?.id)
  const hasPrev     = currentIdx > 0
  const hasNext     = currentIdx < queue.length - 1
  const progressPct = duration > 0 ? currentTime / duration : 0

  // Swipe móvil animado
  const swipeStartX    = useRef<number | null>(null)
  const swipeStartY    = useRef<number | null>(null)
  const swipeIsHoriz   = useRef<boolean | null>(null)
  const pillMobileRef  = useRef<HTMLDivElement | null>(null)
  const [swipeDx, setSwipeDx]     = useState(0)
  const [swipeAnim, setSwipeAnim] = useState<'none' | 'snap-left' | 'snap-right' | 'return'>('none')
  const SWIPE_THRESHOLD = 80

  useEffect(() => {
    const el = pillMobileRef.current
    if (!el) return
    const onTouchMove = (e: TouchEvent) => {
      if (swipeStartX.current === null) return
      const dx = e.touches[0].clientX - swipeStartX.current
      const dy = e.touches[0].clientY - (swipeStartY.current ?? 0)
      if (swipeIsHoriz.current === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        swipeIsHoriz.current = Math.abs(dx) > Math.abs(dy)
      }
      if (swipeIsHoriz.current) {
        e.preventDefault()
        const limited = Math.max(hasPrev ? -120 : -16, Math.min(hasNext ? 120 : 16, dx))
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
    swipeStartX.current = null; swipeStartY.current = null; swipeIsHoriz.current = null
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

  const prevTrack = hasPrev ? queue[currentIdx - 1] : null
  const nextTrack = hasNext ? queue[currentIdx + 1] : null
  const swipeLabel = swipeDx < -20 && nextTrack ? nextTrack.title
    : swipeDx > 20 && prevTrack ? prevTrack.title
    : null
  const swipeLabelOpacity = Math.min(1, (Math.abs(swipeDx) - 20) / 60)

  if (!currentTrack) {
    return (
      <PlayerContext.Provider value={{ currentTrack, isPlaying, shuffleMode, repeatMode, currentTime, duration, queue, loading, showNowPlaying, setShowNowPlaying, playTrack, closePlayer, shuffleProject, playShuffledLibrary, setLibraryUserId, playNext, playPrev, cycleRepeat, seekTo }}>
        {children}
      </PlayerContext.Provider>
    )
  }

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
      onTouchStart={e => e.stopPropagation()}
      onClick={() => { const a = audioRef.current; if (!a) return; a.paused ? a.play().catch(() => {}) : a.pause() }}
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
  const IconShuffle = ({ mode }: { mode: ShuffleMode }) => (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M2 4h3l7 8h2M14 4h-2l-2-2M14 12l-2 2M2 12h3l2-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      {mode === 'library' && (
        <circle cx="13" cy="8" r="2.5" fill="currentColor"/>
      )}
    </svg>
  )
  const IconRepeat = () => repeatMode === 'one' ? (
    // Loop 1 — flecha más corta + badge "1" en círculo
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M3 5h7a2 2 0 012 2v2a2 2 0 01-2 2H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M5 8L3 11l2 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="13" cy="5" r="2.5" fill="currentColor"/>
      <text x="13" y="6.5" fontSize="3.5" fill="#0f1117" fontFamily="monospace" fontWeight="bold" textAnchor="middle">1</text>
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
    <PlayerContext.Provider value={{ currentTrack, isPlaying, shuffleMode, repeatMode, currentTime, duration, queue, loading, showNowPlaying, setShowNowPlaying, playTrack, closePlayer, shuffleProject, playShuffledLibrary, setLibraryUserId, playNext, playPrev, cycleRepeat, seekTo }}>
      {children}

      {mounted && createPortal(
        <>
          <NowPlayingModal />

          {/* Cola de reproducción */}
      {showQueue && (
        <div className="fixed bottom-[88px] left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
          <div className="w-full max-w-[700px] bg-[#13141a]/98 backdrop-blur-xl border border-white/[0.07] rounded-2xl shadow-2xl pointer-events-auto overflow-hidden">
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

      {/* Reproductor */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
        style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom, 16px) + 12px)' }}
      >
        {/* MÓVIL */}
        <div
          ref={pillMobileRef}
          className="md:hidden w-full max-w-lg bg-[#13141a]/96 backdrop-blur-xl border border-white/[0.07] rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <div onClick={() => setShowNowPlaying(true)} className="cursor-pointer">
              <Cover size="w-11 h-11" rounded="rounded-xl"/>
            </div>
            <div
              className="flex-1 min-w-0 relative cursor-pointer"
              onClick={() => setShowNowPlaying(true)}
              style={{
                overflow: 'hidden',
                maskImage: swipeDx !== 0 ? 'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)' : undefined,
                WebkitMaskImage: swipeDx !== 0 ? 'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)' : undefined,
              }}
            >
              <div
                style={{
                  transform: `translateX(${
                    swipeAnim === 'snap-left'  ? '-140%' :
                    swipeAnim === 'snap-right' ? '140%'  :
                    `${swipeDx}px`
                  })`,
                  transition: swipeAnim === 'none' ? 'none'
                    : swipeAnim === 'return' ? 'transform 0.34s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    : 'transform 0.26s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <p className="text-[14px] font-medium text-[#EAE9E6] truncate leading-tight"
                  style={{ opacity: swipeLabel ? 1 - swipeLabelOpacity : 1 }}>
                  {currentTrack.title}
                </p>
                {swipeLabel && (
                  <p className="text-[14px] font-medium text-[#EAE9E6] truncate leading-tight absolute top-0 left-0 right-0"
                    style={{ opacity: swipeLabelOpacity }}>
                    {swipeLabel}
                  </p>
                )}
                <p className="text-[11px] text-[#555966] truncate font-mono mt-0.5">
                  {currentTrack.projectTitle ?? 'demo.'}
                </p>
              </div>
            </div>
            <button
              onTouchStart={e => e.stopPropagation()}
              onClick={cycleRepeat}
              className={`w-8 h-8 ${btnCls(repeatMode !== 'none')}`}
            ><IconRepeat /></button>
            <button
              onTouchStart={e => e.stopPropagation()}
              onClick={handleShuffleClick}
              disabled={shuffleLoading}
              className={`w-8 h-8 relative ${btnCls(shuffleMode !== 'none')} disabled:opacity-50`}
            >
              {shuffleLoading
                ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"/>
                : <IconShuffle mode={shuffleMode} />
              }
            </button>
            <PlayPauseBtn size="w-9 h-9"/>
            <button
              onTouchStart={e => e.stopPropagation()}
              onClick={closePlayer}
              className={`w-8 h-8 ${btnCls()}`}
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
          </div>
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
                <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow pointer-events-none"
                  style={{ left: `calc(${progressPct * 100}% - 6px)` }}/>
              </div>
              <span className="text-[10px] font-mono text-[#555966]">{duration > 0 ? fmt(duration) : '--:--'}</span>
            </div>
          </div>
        </div>

        {/* DESKTOP */}
        <div className="hidden md:flex w-full max-w-[700px] bg-[#13141a]/96 backdrop-blur-xl border border-white/[0.07] rounded-2xl shadow-2xl items-center gap-3 px-4 pointer-events-auto" style={{ height: '64px' }}>

          {/* Izq: portada + info */}
          <div className="flex items-center gap-3 flex-shrink-0" style={{ width: '190px' }}>
            <Cover size="w-10 h-10" rounded="rounded-lg"/>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-[#EAE9E6] truncate leading-tight">{currentTrack.title}</p>
              <p className="text-[11px] text-[#555966] truncate font-mono">{currentTrack.projectTitle ?? 'demo.'}</p>
            </div>
          </div>

          {/* Centro: barra de progreso */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-mono text-[#555966] flex-shrink-0 w-8 text-right tabular-nums">{fmt(currentTime)}</span>
            <div className="flex-1 relative group cursor-pointer">
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
              <div className="h-1 bg-white/[0.1] rounded-full">
                <div className="h-full bg-white/70 rounded-full pointer-events-none" style={{ width: `${progressPct * 100}%` }}/>
              </div>
              <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${progressPct * 100}% - 6px)` }}/>
            </div>
            <span className="text-[10px] font-mono text-[#555966] flex-shrink-0 w-8 tabular-nums">{duration > 0 ? fmt(duration) : '--:--'}</span>
          </div>

          {/* Der: controles */}
          <div className="flex items-center flex-shrink-0 gap-1" style={{ width: '220px' }}>
            <button onClick={playPrev} disabled={!hasPrev} className={`w-7 h-7 ${btnCls()} disabled:opacity-20`}><IconPrev /></button>
            <PlayPauseBtn size="w-9 h-9"/>
            <button onClick={playNext} disabled={!hasNext && shuffleMode === 'none'} className={`w-7 h-7 ${btnCls()} disabled:opacity-20`}><IconNext /></button>
            <button onClick={handleShuffleClick} disabled={shuffleLoading} className={`w-7 h-7 relative ${btnCls(shuffleMode !== 'none')} disabled:opacity-50`}>
              {shuffleLoading ? (
                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"/>
              ) : (
                <IconShuffle mode={shuffleMode} />
              )}
            </button>
            <button onClick={cycleRepeat} className={`w-7 h-7 ${btnCls(repeatMode !== 'none')}`}><IconRepeat /></button>
            <button onClick={() => setShowQueue(q => !q)} className={`w-7 h-7 ${btnCls(showQueue)}`}><IconQueue /></button>
            {/* Volumen con popup — estado en vez de hover para evitar gap */}
            <div
              className="relative flex-shrink-0"
              onMouseEnter={() => setShowVolume(true)}
              onMouseLeave={() => setShowVolume(false)}
            >
              <button onClick={() => handleVolumeChange(volume > 0 ? 0 : 1)} className={`w-7 h-7 ${btnCls()}`}>
                <IconVolume />
              </button>
              {showVolume && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 pointer-events-auto" style={{ paddingBottom: '8px' }}>
                  <div className="bg-[#1a1c24] border border-white/[0.08] rounded-xl px-3 py-3 shadow-xl flex flex-col items-center gap-2">
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
                      <div className="absolute bottom-0 left-0 w-full bg-white/70 rounded-full pointer-events-none"
                        style={{ height: `${volume * 100}%` }}/>
                      <div className="absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow pointer-events-none"
                        style={{ bottom: `calc(${volume * 100}% - 6px)` }}/>
                    </div>
                    <span className="text-[9px] font-mono text-[#555966] tabular-nums">{Math.round(volume * 100)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
        </>,
        document.body
      )}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider')
  return ctx
}
