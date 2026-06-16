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
  currentTrack: Track | null
  isPlaying:    boolean
  playTrack:    (track: Track, queue?: Track[]) => void
  closePlayer:  () => void
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

  const audioRef        = useRef<HTMLAudioElement | null>(null)
  const currentTrackRef = useRef<Track | null>(null)
  const queueRef        = useRef<Track[]>([])
  const repeatModeRef   = useRef<RepeatMode>('none')
  const loadTrackRef    = useRef<((track: Track, newQueue?: Track[]) => Promise<void>) | null>(null)

  useEffect(() => { currentTrackRef.current = currentTrack }, [currentTrack])
  useEffect(() => { queueRef.current = queue }, [queue])
  useEffect(() => { repeatModeRef.current = repeatMode }, [repeatMode])

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
      if (idx < q.length - 1) loadTrackRef.current?.(q[idx + 1])
      else if (mode === 'all') loadTrackRef.current?.(q[0])
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
      audio.src = `https://pub-5ad091444ab84f6e979864f025aa8867.r2.dev/${track.file_path}`
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
        navigator.mediaSession.setActionHandler('seekto', (e) => {
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
    const q   = queueRef.current
    const idx = q.findIndex(t => t.id === currentTrackRef.current?.id)
    if (idx < q.length - 1) loadTrackRef.current?.(q[idx + 1])
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

  const handleVolumeChange = useCallback((v: number) => {
    setVolume(v)
    if (audioRef.current) audioRef.current.volume = v
  }, [])

  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const t    = pct * duration
    if (audioRef.current) audioRef.current.currentTime = t
    setCurrentTime(t)
  }, [duration])

  const fmt = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`

  const currentIdx  = queue.findIndex(t => t.id === currentTrack?.id)
  const hasPrev     = currentIdx > 0
  const hasNext     = currentIdx < queue.length - 1
  const progressPct = duration > 0 ? currentTime / duration : 0

  // Swipe móvil
  const swipeStartX = useRef<number | null>(null)
  const handleTouchStart = (e: React.TouchEvent) => { swipeStartX.current = e.touches[0].clientX }
  const handleTouchEnd   = (e: React.TouchEvent) => {
    if (swipeStartX.current === null) return
    const dx = e.changedTouches[0].clientX - swipeStartX.current
    if (Math.abs(dx) > 60) { dx < 0 && hasNext ? playNext() : dx > 0 && hasPrev ? playPrev() : null }
    swipeStartX.current = null
  }

  // Iconos SVG reutilizables
  const IconPrev = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 3v10M13 3L6 8l7 5V3z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  const IconNext = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M13 3v10M3 3l7 5-7 5V3z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  const IconRepeat = () => repeatMode === 'one' ? (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M2 5h9a2 2 0 012 2v2a2 2 0 01-2 2H5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M5 8L3 11l2 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <text x="10" y="8.5" fontSize="4" fill="currentColor" fontFamily="monospace" fontWeight="bold" textAnchor="middle">1</text>
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M2 5h9a2 2 0 012 2v2a2 2 0 01-2 2H5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M5 8L3 11l2 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )

  const coverEl = (size: string, rounded: string) => (
    <div className={`${size} ${rounded} flex-shrink-0 overflow-hidden bg-[#1E2028]`}>
      {currentTrack?.coverUrl
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

  const playPauseBtn = (size: string) => (
    <button
      onClick={() => { const a = audioRef.current; if (!a) return; a.paused ? a.play() : a.pause() }}
      disabled={loading}
      className={`${size} rounded-full bg-[#6E62F5] hover:bg-[#5A4FD4] flex items-center justify-center transition-colors disabled:opacity-40 flex-shrink-0`}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
      ) : isPlaying ? (
        <svg width="11" height="11" viewBox="0 0 12 12" fill="white"><rect x="1" y="1" width="4" height="10" rx="1"/><rect x="7" y="1" width="4" height="10" rx="1"/></svg>
      ) : (
        <svg width="11" height="11" viewBox="0 0 12 12" fill="white"><path d="M2 1.5l9 4.5-9 4.5V1.5z"/></svg>
      )}
    </button>
  )

  const progressBar = (
    <div className="relative flex-1 h-1 bg-white/10 rounded-full cursor-pointer group" onClick={seek}>
      <div
        className="absolute left-0 top-0 h-full bg-white/70 rounded-full pointer-events-none"
        style={{ width: `${progressPct * 100}%` }}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ left: `calc(${progressPct * 100}% - 5px)` }}
      />
    </div>
  )

  if (!currentTrack) {
    return (
      <PlayerContext.Provider value={{ currentTrack, isPlaying, playTrack, closePlayer }}>
        {children}
      </PlayerContext.Provider>
    )
  }

  return (
    <PlayerContext.Provider value={{ currentTrack, isPlaying, playTrack, closePlayer }}>
      {children}

      {/* Cola de reproducción — panel flotante encima del player */}
      {showQueue && (
        <div className="fixed bottom-[76px] left-0 right-0 z-50 px-4 flex justify-center pointer-events-none">
          <div className="w-full max-w-2xl bg-[#13141a]/98 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl pointer-events-auto overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
              <span className="text-xs font-mono text-[#555966] uppercase tracking-wider">Cola de reproducción</span>
              <span className="text-xs text-[#555966]">{queue.length} canciones</span>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {queue.map((track, i) => {
                const isActive = track.id === currentTrack.id
                return (
                  <div
                    key={track.id}
                    onClick={() => loadTrackRef.current?.(track)}
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                      isActive ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <span className={`text-xs font-mono w-5 text-right flex-shrink-0 ${isActive ? 'text-[#6E62F5]' : 'text-[#555966]'}`}>
                      {isActive ? (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="#6E62F5"><path d="M1 1l8 4-8 4V1z"/></svg>
                      ) : i + 1}
                    </span>
                    {track.coverUrl
                      ? <img src={track.coverUrl} alt="" className="w-7 h-7 rounded object-cover flex-shrink-0"/>
                      : <div className="w-7 h-7 rounded bg-[#252830] flex-shrink-0"/>
                    }
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] truncate ${isActive ? 'text-[#EAE9E6] font-medium' : 'text-[#9BA0AD]'}`}>{track.title}</p>
                      {track.projectTitle && <p className="text-[11px] text-[#555966] truncate">{track.projectTitle}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── REPRODUCTOR ─── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-3"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#13141a]/96 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">

            {/* ── VERSIÓN MÓVIL (md:hidden) ── */}
            <div className="flex items-center gap-2 px-2 py-2 md:hidden">
              {coverEl('w-10 h-10', 'rounded-lg')}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[#EAE9E6] truncate">{currentTrack.title}</p>
                <p className="text-[11px] text-[#555966] truncate">{currentTrack.projectTitle ?? 'demo.'}</p>
              </div>
              <button
                onClick={cycleRepeat}
                className={`w-8 h-8 flex items-center justify-center flex-shrink-0 transition-colors ${repeatMode !== 'none' ? 'text-[#6E62F5]' : 'text-[#555966]'}`}
              ><IconRepeat /></button>
              {playPauseBtn('w-9 h-9')}
              <button onClick={closePlayer} className="w-8 h-8 flex items-center justify-center text-[#555966] hover:text-[#EAE9E6] transition-colors flex-shrink-0">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
            {/* Barra de progreso móvil */}
            <div className="px-2 pb-2 md:hidden" onClick={seek}>
              <div className="relative h-0.5 bg-white/10 rounded-full cursor-pointer">
                <div className="absolute left-0 top-0 h-full bg-white/60 rounded-full" style={{ width: `${progressPct * 100}%` }}/>
              </div>
            </div>

            {/* ── VERSIÓN DESKTOP (hidden md:flex) ── */}
            <div className="hidden md:flex items-center gap-3 px-4 py-3">

              {/* Izquierda: portada + info */}
              <div className="flex items-center gap-3 w-56 flex-shrink-0">
                {coverEl('w-11 h-11', 'rounded-lg')}
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[#EAE9E6] truncate">{currentTrack.title}</p>
                  <p className="text-[11px] text-[#555966] truncate">{currentTrack.projectTitle ?? 'demo.'}</p>
                </div>
              </div>

              {/* Centro: controles + barra de progreso */}
              <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                {/* Controles de transporte */}
                <div className="flex items-center gap-1">
                  <button onClick={playPrev} disabled={!hasPrev} className="w-8 h-8 flex items-center justify-center text-[#555966] hover:text-[#EAE9E6] disabled:opacity-25 transition-colors">
                    <IconPrev />
                  </button>
                  {playPauseBtn('w-9 h-9')}
                  <button onClick={playNext} disabled={!hasNext} className="w-8 h-8 flex items-center justify-center text-[#555966] hover:text-[#EAE9E6] disabled:opacity-25 transition-colors">
                    <IconNext />
                  </button>
                </div>
                {/* Barra de progreso + tiempos */}
                <div className="w-full flex items-center gap-2">
                  <span className="text-[10px] font-mono text-[#555966] w-8 text-right flex-shrink-0">{fmt(currentTime)}</span>
                  {progressBar}
                  <span className="text-[10px] font-mono text-[#555966] w-8 flex-shrink-0">{duration > 0 ? fmt(duration) : '--:--'}</span>
                </div>
              </div>

              {/* Derecha: repeat, cola, volumen, cerrar */}
              <div className="flex items-center gap-0.5 w-56 justify-end flex-shrink-0">
                {/* Repetir */}
                <button onClick={cycleRepeat} className={`w-8 h-8 flex items-center justify-center transition-colors ${repeatMode !== 'none' ? 'text-[#6E62F5]' : 'text-[#555966] hover:text-[#9BA0AD]'}`}>
                  <IconRepeat />
                </button>

                {/* Cola */}
                <button
                  onClick={() => setShowQueue(q => !q)}
                  className={`w-8 h-8 flex items-center justify-center transition-colors ${showQueue ? 'text-[#6E62F5]' : 'text-[#555966] hover:text-[#9BA0AD]'}`}
                >
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                    <path d="M2 4h12M2 8h8M2 12h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                    <circle cx="13" cy="11" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
                    <path d="M13 9.5V11l1 0.8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {/* Volumen */}
                <div className="flex items-center gap-1.5 ml-1">
                  <button
                    onClick={() => handleVolumeChange(volume > 0 ? 0 : 1)}
                    className="w-7 h-7 flex items-center justify-center text-[#555966] hover:text-[#9BA0AD] transition-colors flex-shrink-0"
                  >
                    {volume === 0 ? (
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                        <path d="M3 6H1v4h2l4 3V3L3 6z" fill="currentColor"/>
                        <path d="M13 5l-4 4M9 5l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                      </svg>
                    ) : volume < 0.5 ? (
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                        <path d="M3 6H1v4h2l4 3V3L3 6z" fill="currentColor"/>
                        <path d="M10 6.5a2.5 2.5 0 010 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                        <path d="M3 6H1v4h2l4 3V3L3 6z" fill="currentColor"/>
                        <path d="M10 5a4 4 0 010 6M12 3.5a6.5 6.5 0 010 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                      </svg>
                    )}
                  </button>
                  <input
                    type="range" min={0} max={1} step={0.01} value={volume}
                    onChange={e => handleVolumeChange(Number(e.target.value))}
                    className="w-18 h-1 appearance-none bg-white/10 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                    style={{ width: '72px' }}
                  />
                </div>

                {/* Cerrar */}
                <button onClick={closePlayer} className="w-8 h-8 flex items-center justify-center text-[#555966] hover:text-[#EAE9E6] transition-colors ml-1">
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
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
