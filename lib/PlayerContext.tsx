'use client'

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'

interface Track {
  id:            string
  title:         string
  file_path:     string
  projectTitle?: string
  coverUrl?:     string
}

interface PlayerContextType {
  currentTrack:  Track | null
  isPlaying:     boolean
  playTrack:     (track: Track, queue?: Track[]) => void
  closePlayer:   () => void
}

const PlayerContext = createContext<PlayerContextType | null>(null)

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [queue, setQueue]               = useState<Track[]>([])
  const [isPlaying, setIsPlaying]       = useState(false)
  const [currentTime, setCurrentTime]   = useState(0)
  const [duration, setDuration]         = useState(0)
  const [loading, setLoading]           = useState(false)
  const audioRef                        = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = new Audio()
    audioRef.current = audio
    const onTime  = () => setCurrentTime(audio.currentTime)
    const onMeta  = () => setDuration(audio.duration)
    const onPlay  = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnd   = () => {
      setIsPlaying(false)
      // Auto-siguiente
      setQueue(prev => {
        if (prev.length > 1) {
          const next = prev[1]
          loadTrack(next, prev.slice(1))
        }
        return prev
      })
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

  const loadTrack = async (track: Track, newQueue?: Track[]) => {
    setCurrentTrack(track)
    if (newQueue) setQueue(newQueue)
    setLoading(true)
    setCurrentTime(0)
    setDuration(0)
    try {
      const res = await fetch('/api/play-url', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ filePath: track.file_path }),
      })
      const { url } = await res.json()
      const audio = audioRef.current
      if (!audio) return
      audio.src = url
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
  }

  const playTrack = async (track: Track, newQueue?: Track[]) => {
    if (currentTrack?.id === track.id) {
      const audio = audioRef.current
      if (!audio) return
      audio.paused ? audio.play() : audio.pause()
      return
    }
    const q = newQueue ?? [track]
    await loadTrack(track, q)
  }

  const playPrev = () => {
    const idx = queue.findIndex(t => t.id === currentTrack?.id)
    if (idx > 0) loadTrack(queue[idx - 1])
    else if (audioRef.current) audioRef.current.currentTime = 0
  }

  const playNext = () => {
    const idx = queue.findIndex(t => t.id === currentTrack?.id)
    if (idx < queue.length - 1) loadTrack(queue[idx + 1])
  }

  const closePlayer = () => {
    const audio = audioRef.current
    if (audio) { audio.pause(); audio.src = '' }
    setCurrentTrack(null)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setQueue([])
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`

  const currentIdx = queue.findIndex(t => t.id === currentTrack?.id)
  const hasPrev    = currentIdx > 0
  const hasNext    = currentIdx < queue.length - 1

  return (
    <PlayerContext.Provider value={{ currentTrack, isPlaying, playTrack, closePlayer }}>
      {children}

      {currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pointer-events-none">
          <div className="max-w-2xl mx-auto pointer-events-auto">
            {/* Barra de progreso encima del player */}
            <div className="px-3 mb-[-2px]">
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={currentTime}
                onChange={e => {
                  const t = Number(e.target.value)
                  if (audioRef.current) audioRef.current.currentTime = t
                  setCurrentTime(t)
                }}
                style={{ '--progress': `${duration ? (currentTime / duration) * 100 : 0}%` } as React.CSSProperties}
                className="w-full h-1 appearance-none bg-transparent cursor-pointer [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-white/10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:mt-[-4px]"
              />
            </div>

            {/* Player pill */}
            <div className="bg-[#1a1c24]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl px-3 py-2.5 flex items-center gap-3 shadow-2xl">

              {/* Portada */}
              <div className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden bg-[#252830]">
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

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#EAE9E6] truncate leading-tight">{currentTrack.title}</p>
                <p className="text-xs font-mono text-[#555966] truncate">
                  {currentTrack.projectTitle ?? 'demo.'}{duration > 0 ? ` · ${fmt(currentTime)}` : ''}
                </p>
              </div>

              {/* Controles */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={playPrev}
                  disabled={!hasPrev}
                  className="w-8 h-8 flex items-center justify-center text-[#555966] hover:text-[#EAE9E6] disabled:opacity-20 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 3v10M13 3L6 8l7 5V3z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                <button
                  onClick={() => { const a = audioRef.current; if (!a) return; a.paused ? a.play() : a.pause() }}
                  disabled={loading}
                  className="w-9 h-9 rounded-full bg-[#6E62F5] hover:bg-[#5A4FD4] flex items-center justify-center transition-colors disabled:opacity-40"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  ) : isPlaying ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
                      <rect x="1" y="1" width="4" height="10" rx="1"/>
                      <rect x="7" y="1" width="4" height="10" rx="1"/>
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
                      <path d="M2 1.5l9 4.5-9 4.5V1.5z"/>
                    </svg>
                  )}
                </button>

                <button
                  onClick={playNext}
                  disabled={!hasNext}
                  className="w-8 h-8 flex items-center justify-center text-[#555966] hover:text-[#EAE9E6] disabled:opacity-20 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M13 3v10M3 3l7 5-7 5V3z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                <button onClick={closePlayer} className="w-8 h-8 flex items-center justify-center text-[#555966] hover:text-[#EAE9E6] transition-colors">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
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
