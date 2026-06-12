'use client'

import { createContext, useContext, useState, useRef, useCallback, ReactNode } from 'react'

interface Track {
  id:        string
  title:     string
  file_path: string
  projectTitle?: string
}

interface PlayerContextType {
  currentTrack:  Track | null
  isPlaying:     boolean
  playTrack:     (track: Track) => void
  pauseTrack:    () => void
  closePlayer:   () => void
  wsRef:         React.MutableRefObject<any>
}

const PlayerContext = createContext<PlayerContextType | null>(null)

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying]       = useState(false)
  const wsRef                           = useRef<any>(null)

  const playTrack = useCallback((track: Track) => {
    if (currentTrack?.id === track.id) {
      wsRef.current?.playPause()
      setIsPlaying(p => !p)
      return
    }
    wsRef.current?.destroy()
    wsRef.current = null
    setCurrentTrack(track)
    setIsPlaying(true)
  }, [currentTrack])

  const pauseTrack = useCallback(() => {
    wsRef.current?.pause()
    setIsPlaying(false)
  }, [])

  const closePlayer = useCallback(() => {
    wsRef.current?.destroy()
    wsRef.current = null
    setCurrentTrack(null)
    setIsPlaying(false)
  }, [])

  return (
    <PlayerContext.Provider value={{ currentTrack, isPlaying, playTrack, pauseTrack, closePlayer, wsRef }}>
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider')
  return ctx
}
