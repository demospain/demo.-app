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

  // Swipe móvil
  const swipeStartX = useRef<number | null>(null)
  const handleTouchStart = (e: React.TouchEvent) => { swipeStartX.current = e.touches[0].clientX }
  const handleTouchEnd   = (e: React.TouchEvent) => {
    if (swipeStartX.current === null) return
    const dx = e.changedTouches[0].clientX - swipeStartX.current
    if (Math.abs(dx) > 60) { dx < 0 && hasNext ? playNext() : dx > 0 && hasPrev ? playPrev() : null }
    swipeStartX.current = null
  }

  if (!currentTrack) {
    return (
      <PlayerContext.Provider value={{ currentTrack, isPlaying, playTrack, closePlayer }}>
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
    <PlayerContext.Provider value={{ currentTrack, isPlaying, playTrack, closePlayer }}>
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
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* ── MÓVIL ─────────────────────────────────────────────────────── */}
        <div className="md:hidden w-full max-w-lg bg-[#13141a]/96 backdrop-blur-xl border border-white/[0.07] rounded-2xl shadow-2xl overflow-hidden">
          {/* Fila principal */}
          <div className="flex items-center gap-3 px-4 py-3">
            <Cover size="w-11 h-11" rounded="rounded-xl"/>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium text-[#EAE9E6] truncate leading-tight">{currentTrack.title}</p>
              <p className="text-[11px] text-[#555966] truncate font-mono mt-0.5">{currentTrack.projectTitle ?? 'demo.'}</p>
            </div>
            <button onClick={cycleRepeat} className={`w-8 h-8 ${btnCls(repeatMode !== 'none')}`}><IconRepeat /></button>
            <PlayPauseBtn size="w-9 h-9"/>
            <button onClick={closePlayer} className={`w-8 h-8 ${btnCls()}`}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
          </div>
          {/* Barra de progreso móvil — arrastrable con área de toque grande */}
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono text-[#555966]">{fmt(currentTime)}</span>
              <div className="flex-1 relative">
                {/* Área de toque grande invisible */}
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
                {/* Track */}
                <div className="h-1 bg-white/[0.1] rounded-full">
                  <div className="h-full bg-white/70 rounded-full" style={{ width: `${progressPct * 100}%` }}/>
                </div>
                {/* Thumb */}
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
            <button className={`w-7 h-7 ${btnCls()}`}><IconShuffle /></button>
            <button onClick={cycleRepeat} className={`w-7 h-7 ${btnCls(repeatMode !== 'none')}`}><IconRepeat /></button>
            <button onClick={() => setShowQueue(q => !q)} className={`w-7 h-7 ${btnCls(showQueue)}`}><IconQueue /></button>
            <button onClick={() => handleVolumeChange(volume > 0 ? 0 : 1)} className={`w-6 h-7 ${btnCls()}`}><IconVolume /></button>
            <input
              type="range" min={0} max={1} step={0.02} value={volume}
              onChange={e => handleVolumeChange(Number(e.target.value))}
              className="h-1 rounded-full cursor-pointer appearance-none bg-white/10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white flex-shrink-0"
              style={{ width: '48px' }}
            />
            <button onClick={closePlayer} className={`w-7 h-7 ${btnCls()}`}>
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
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
