'use client'

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'

interface Track {
  id:            string
  title:         string
  file_path:     string
  projectTitle?: string
}

interface PlayerContextType {
  currentTrack: Track | null
  isPlaying:    boolean
  playTrack:    (track: Track) => void
  closePlayer:  () => void
}

const PlayerContext = createContext<PlayerContextType | null>(null)

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying]       = useState(false)
  const [currentTime, setCurrentTime]   = useState(0)
  const [duration, setDuration]         = useState(0)
  const [speed, setSpeed]               = useState(1)
  const [loading, setLoading]           = useState(false)
  const audioRef                        = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = new Audio()
    audioRef.current = audio
    const onTime  = () => setCurrentTime(audio.currentTime)
    const onMeta  = () => setDuration(audio.duration)
    const onPlay  = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnd   = () => setIsPlaying(false)
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

  const playTrack = async (track: Track) => {
    if (currentTrack?.id === track.id) {
      const audio = audioRef.current
      if (!audio) return
      audio.paused ? audio.play() : audio.pause()
      return
    }
    setCurrentTrack(track)
    setLoading(true)
    setCurrentTime(0)
    setDuration(0)
    try {
      const res = await fetch('/api/play-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: track.file_path }),
      })
      const { url } = await res.json()
      const audio = audioRef.current
      if (!audio) return
      audio.src          = url
      audio.playbackRate = speed
      await audio.play()
    } catch {}
    setLoading(false)
  }

  const closePlayer = () => {
    const audio = audioRef.current
    if (audio) { audio.pause(); audio.src = '' }
    setCurrentTrack(null)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`

  return (
    <PlayerContext.Provider value={{ currentTrack, isPlaying, playTrack, closePlayer }}>
      {children}

      {currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f1117]/95 backdrop-blur-md border-t border-white/[0.07] px-6 py-3">
          <div className="max-w-6xl mx-auto flex items-center gap-4">

            <button
              onClick={() => { const a = audioRef.current; if (!a) return; a.paused ? a.play() : a.pause() }}
              disabled={loading}
              className="w-10 h-10 rounded-full bg-[#6E62F5] hover:bg-[#5A4FD4] flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-40"
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

            <div className="flex-1 min-w-0 flex items-center gap-4">
              <div className="min-w-0 flex-shrink-0 max-w-[200px]">
                <p className="text-sm font-medium text-[#EAE9E6] truncate">{currentTrack.title}</p>
                {currentTrack.projectTitle && (
                  <p className="text-xs font-mono text-[#555966] truncate">{currentTrack.projectTitle}</p>
                )}
              </div>
              <div className="flex-1 flex items-center gap-3">
                <span className="text-xs font-mono text-[#555966] flex-shrink-0 w-10 text-right">{fmt(currentTime)}</span>
                <input
                  type="range" min={0} max={duration || 0} step={0.1} value={currentTime}
                  onChange={e => { const t = Number(e.target.value); if (audioRef.current) audioRef.current.currentTime = t; setCurrentTime(t) }}
                  className="flex-1 accent-[#6E62F5] cursor-pointer"
                />
                <span className="text-xs font-mono text-[#555966] flex-shrink-0 w-10">{fmt(duration)}</span>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
              {[0.75, 1, 1.25, 1.5].map(s => (
                <button key={s}
                  onClick={() => { if (audioRef.current) audioRef.current.playbackRate = s; setSpeed(s) }}
                  className={`font-mono text-xs px-2 py-1 rounded transition-colors ${
                    speed === s ? 'bg-[#6E62F5]/20 text-[#6E62F5]' : 'text-[#555966] hover:text-[#9BA0AD]'
                  }`}
                >{s}×</button>
              ))}
            </div>

            <button onClick={closePlayer} className="text-[#555966] hover:text-[#EAE9E6] transition-colors flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
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
