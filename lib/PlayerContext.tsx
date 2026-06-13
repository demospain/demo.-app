'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

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

// Estado global fuera de React — nunca se destruye al navegar
let globalTrack: Track | null = null
let globalSetTrack: ((track: Track | null) => void) | null = null

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(globalTrack)
  const [isPlaying, setIsPlaying]       = useState(false)

  useEffect(() => {
    globalSetTrack = (track) => {
      globalTrack = track
      setCurrentTrack(track)
    }
    return () => { globalSetTrack = null }
  }, [])

  const playTrack = (track: Track) => {
    globalTrack = track
    setCurrentTrack(track)
    setIsPlaying(true)
  }

  const closePlayer = () => {
    globalTrack = null
    setCurrentTrack(null)
    setIsPlaying(false)
  }

  return (
    <PlayerContext.Provider value={{ currentTrack, isPlaying, playTrack, closePlayer }}>
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider')
  return ctx
}
