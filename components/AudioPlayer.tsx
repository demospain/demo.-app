'use client'

import { useEffect, useRef, useState } from 'react'

interface AudioPlayerProps {
  trackId:       string
  filePath:      string
  title:         string
  projectTitle?: string
  onClose:       () => void
}

export default function AudioPlayer({ trackId, filePath, title, projectTitle, onClose }: AudioPlayerProps) {
  const audioRef                      = useRef<HTMLAudioElement>(null)
  const containerRef                  = useRef<HTMLDivElement>(null)
  const wsRef                         = useRef<any>(null)
  const [playing, setPlaying]         = useState(false)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration]       = useState(0)
  const [speed, setSpeed]             = useState(1)

  const fmt = (s: number) => {
    const m   = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    let ws: any = null
    let url: string = ''

    const init = async () => {
      try {
        // Presigned URL directa — sin proxy
        const res = await fetch('/api/play-url', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ filePath }),
        })
        if (!res.ok) throw new Error('No se pudo obtener la URL de reproducción')
        const data = await res.json()
        url = data.url

        // Arrancar audio nativo inmediatamente — no espera a la waveform
        const audio = audioRef.current
        if (!audio) return
        audio.src = url
        audio.playbackRate = speed
        await audio.play()
        setPlaying(true)
        setLoading(false)

        // Cargar WaveSurfer en segundo plano para la waveform
        const WaveSurfer = (await import('wavesurfer.js')).default
        if (!containerRef.current) return

        ws = WaveSurfer.create({
          container:     containerRef.current,
          waveColor:     '#2E3140',
          progressColor: '#7C6FFF',
          cursorColor:   'rgba(255,255,255,0.3)',
          barWidth:      2,
          barRadius:     2,
          height:        40,
          normalize:     true,
          barGap:        1,
          media:         audio, // usar el audio nativo — no descarga de nuevo
        })

        wsRef.current = ws
        ws.load(url)

      } catch (err: any) {
        setError(err.message || 'Error desconocido')
        setLoading(false)
      }
    }

    init()

    return () => {
      ws?.destroy()
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
    }
  }, [filePath])

  // Sincronizar tiempo desde el audio nativo
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => setCurrentTime(audio.currentTime)
    const onMeta = () => setDuration(audio.duration)
    const onEnd  = () => setPlaying(false)
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    audio.addEventListener('timeupdate',    onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('ended',         onEnd)
    audio.addEventListener('play',          onPlay)
    audio.addEventListener('pause',         onPause)
    return () => {
      audio.removeEventListener('timeupdate',    onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('ended',         onEnd)
      audio.removeEventListener('play',          onPlay)
      audio.removeEventListener('pause',         onPause)
    }
  }, [])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.paused ? audio.play() : audio.pause()
  }

  const changeSpeed = (s: number) => {
    if (audioRef.current) audioRef.current.playbackRate = s
    wsRef.current?.setPlaybackRate(s)
    setSpeed(s)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value)
    if (audioRef.current) audioRef.current.currentTime = t
    setCurrentTime(t)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#13141a]/95 backdrop-blur-md border-t border-white/[0.06] px-5 py-3">
      <audio ref={audioRef}/>
      <div className="max-w-6xl mx-auto flex flex-col gap-1.5">

        <div className="flex items-center gap-4">
          <button
            onClick={togglePlay}
            disabled={loading}
            className="w-10 h-10 rounded-full bg-[#7C6FFF] hover:bg-[#6B5FE8] flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-40"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
            ) : playing ? (
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

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#F8F7F4] truncate">{title}</p>
            <p className="text-xs font-mono text-[#555966] truncate">{projectTitle}</p>
          </div>

          <span className="text-xs font-mono text-[#555966] flex-shrink-0 hidden sm:block">
            {fmt(currentTime)} / {fmt(duration)}
          </span>

          <div className="hidden sm:flex items-center gap-1">
            {[0.75, 1, 1.25, 1.5].map(s => (
              <button
                key={s}
                onClick={() => changeSpeed(s)}
                className={`font-mono text-xs px-2 py-1 rounded transition-colors ${
                  speed === s
                    ? 'bg-[#7C6FFF]/20 text-[#7C6FFF]'
                    : 'text-[#555966] hover:text-[#9BA0AD]'
                }`}
              >
                {s}×
              </button>
            ))}
          </div>

          <button
            onClick={() => { wsRef.current?.destroy(); audioRef.current?.pause(); onClose() }}
            className="text-[#555966] hover:text-[#F8F7F4] transition-colors ml-1"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {error ? (
          <p className="text-red-400 text-xs font-mono">{error}</p>
        ) : (
          <div ref={containerRef} className="w-full cursor-pointer"/>
        )}
      </div>
    </div>
  )
}
