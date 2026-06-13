'use client'

import { useEffect, useRef, useState } from 'react'
import { usePlayer } from '@/lib/PlayerContext'

export default function GlobalPlayer() {
  const { currentTrack, closePlayer, wsRef } = usePlayer()
  const containerRef                          = useRef<HTMLDivElement>(null)
  const [loading, setLoading]                 = useState(false)
  const [currentTime, setCurrentTime]         = useState(0)
  const [duration, setDuration]               = useState(0)
  const [speed, setSpeed]                     = useState(1)
  const [localPlaying, setLocalPlaying]       = useState(false)

  const fmt = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    if (!currentTrack) return
    let ws: any = null
    setLoading(true)
    setCurrentTime(0)
    setDuration(0)

    const init = async () => {
      try {
        const res = await fetch(`/api/play-url?path=${encodeURIComponent(currentTrack.file_path)}`)
        if (!res.ok) throw new Error('No se pudo obtener la URL')
        const audioUrl = `/api/play-url?path=${encodeURIComponent(currentTrack.file_path)}`
        ws.load(audioUrl)

        const WaveSurfer = (await import('wavesurfer.js')).default
        if (!containerRef.current) return

        ws = WaveSurfer.create({
          container:     containerRef.current,
          waveColor:     'rgba(255,255,255,0.1)',
          progressColor: '#7C6FFF',
          cursorColor:   'rgba(124,111,255,0.5)',
          barWidth:      2,
          barRadius:     2,
          height:        32,
          normalize:     true,
          barGap:        2,
        })

        wsRef.current = ws

        ws.on('ready', () => {
          setDuration(ws.getDuration())
          setLoading(false)
          ws.play()
          setLocalPlaying(true)
        })

        ws.on('audioprocess', (t: number) => setCurrentTime(t))
        ws.on('pause',  () => setLocalPlaying(false))
        ws.on('play',   () => setLocalPlaying(true))
        ws.on('finish', () => { setLocalPlaying(false); setCurrentTime(0) })
      } catch {
        setLoading(false)
      }
    }

    init()
    return () => { ws?.destroy() }
  }, [currentTrack?.id])

  const togglePlay = () => {
    if (!wsRef.current) return
    wsRef.current.playPause()
  }

  const changeSpeed = (s: number) => {
    wsRef.current?.setPlaybackRate(s)
    setSpeed(s)
  }

  if (!currentTrack) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#111318]/95 backdrop-blur-md border-t border-white/[0.06]">
      <div className="max-w-5xl mx-auto px-5 py-2">

        {/* Waveform */}
        <div ref={containerRef} className="w-full cursor-pointer mb-2"/>

        {/* Controles */}
        <div className="flex items-center gap-4 pb-2">
          {/* Play/pause */}
          <button
            onClick={togglePlay}
            disabled={loading}
            className="w-8 h-8 rounded-full bg-[#7C6FFF] hover:bg-[#4A3FCC] flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-40"
          >
            {loading ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
            ) : localPlaying ? (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="white">
                <rect x="1" y="1" width="3" height="8" rx="0.5"/>
                <rect x="6" y="1" width="3" height="8" rx="0.5"/>
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="white">
                <path d="M2 1.5l7 3.5-7 3.5V1.5z"/>
              </svg>
            )}
          </button>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#F8F7F4] truncate leading-tight">{currentTrack.title}</p>
            {currentTrack.projectTitle && (
              <p className="text-xs text-[#555966] font-mono truncate">{currentTrack.projectTitle}</p>
            )}
          </div>

          {/* Tiempo */}
          <span className="text-xs font-mono text-[#555966] flex-shrink-0 hidden sm:block">
            {fmt(currentTime)} / {fmt(duration)}
          </span>

          {/* Velocidad */}
          <div className="hidden sm:flex items-center gap-1">
            {[0.75, 1, 1.25, 1.5].map(s => (
              <button
                key={s}
                onClick={() => changeSpeed(s)}
                className={`font-mono text-xs px-2 py-1 rounded-lg transition-colors ${
                  speed === s
                    ? 'bg-[#7C6FFF]/20 text-[#7C6FFF]'
                    : 'text-[#555966] hover:text-[#9BA0AD]'
                }`}
              >
                {s}×
              </button>
            ))}
          </div>

          {/* Cerrar */}
          <button
            onClick={closePlayer}
            className="text-[#555966] hover:text-[#F8F7F4] transition-colors flex-shrink-0 p-1"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
