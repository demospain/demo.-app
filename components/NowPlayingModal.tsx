'use client'

import { useRef } from 'react'
import { usePlayer } from '@/lib/PlayerContext'

function fmt(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function NowPlayingModal() {
  const {
    currentTrack, isPlaying, repeatMode, currentTime, duration,
    showNowPlaying, setShowNowPlaying,
    playNext, playPrev, cycleRepeat, seekTo,
  } = usePlayer()

  const progressRef = useRef<HTMLDivElement>(null)

  if (!showNowPlaying || !currentTrack) return null

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0

  const handleSeek = (e: React.MouseEvent | React.TouchEvent) => {
    if (!progressRef.current || !duration) return
    const rect = progressRef.current.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    seekTo(pct * duration)
  }

  const repeatLabel = repeatMode === 'one' ? '1' : repeatMode === 'all' ? '∞' : null

  return (
    <div className="fixed inset-0 z-[100] flex flex-col md:hidden" style={{ background: '#0f1117' }}>

      {/* Fondo con blur de portada */}
      {currentTrack.coverUrl && (
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${currentTrack.coverUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(48px) saturate(1.4)',
            transform: 'scale(1.1)',
          }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-[#0f1117]/60 to-[#0f1117]" />

      {/* Contenido */}
      <div className="relative flex flex-col flex-1 px-7 pb-10 pt-14">

        {/* Botón cerrar */}
        <button
          onClick={() => setShowNowPlaying(false)}
          className="absolute top-5 right-6 w-9 h-9 flex items-center justify-center rounded-full bg-white/[0.07]"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 3l8 8M11 3l-8 8" stroke="#9BA0AD" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Portada grande */}
        <div className="flex-1 flex items-center justify-center py-6">
          <div
            className="rounded-2xl overflow-hidden shadow-2xl"
            style={{
              width: 'min(72vw, 320px)',
              height: 'min(72vw, 320px)',
              boxShadow: '0 32px 64px -12px rgba(0,0,0,0.7)',
            }}
          >
            {currentTrack.coverUrl
              ? <img src={currentTrack.coverUrl} alt="" className="w-full h-full object-cover"/>
              : (
                <div className="w-full h-full bg-[#181c27] flex items-center justify-center">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" opacity="0.3">
                    <path d="M18 6h18v30a6 6 0 01-6 6H12a6 6 0 01-6-6V12l6-6z" stroke="#9BA0AD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="18" cy="34" r="4" stroke="#9BA0AD" strokeWidth="2"/>
                    <path d="M28 14H18" stroke="#9BA0AD" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
              )
            }
          </div>
        </div>

        {/* Waveform animado */}
        <div className="flex items-end justify-center gap-[3px] h-8 mb-5">
          {Array.from({ length: 28 }, (_, i) => {
            const heights = [0.3, 0.5, 0.8, 0.6, 1, 0.7, 0.4, 0.9, 0.5, 0.7, 1, 0.6, 0.3,
                             0.8, 0.5, 1, 0.7, 0.4, 0.9, 0.6, 0.3, 0.8, 0.5, 0.7, 1, 0.6, 0.4, 0.9]
            const h = heights[i % heights.length]
            return (
              <div
                key={i}
                className="rounded-full"
                style={{
                  width: '3px',
                  height: `${h * 100}%`,
                  background: isPlaying ? '#6E62F5' : 'rgba(110,98,245,0.3)',
                  transformOrigin: 'bottom',
                  animation: isPlaying
                    ? `waveBar ${0.5 + (i % 5) * 0.08}s ease-in-out ${(i % 7) * 0.05}s infinite alternate`
                    : 'none',
                  transition: 'background 0.3s ease',
                }}
              />
            )
          })}
        </div>

        {/* Info de canción */}
        <div className="mb-5">
          <p className="text-[#EAE9E6] font-medium text-xl truncate">{currentTrack.title}</p>
          <p className="text-[#555966] font-mono text-sm mt-0.5 truncate">{currentTrack.projectTitle ?? 'demo.'}</p>
        </div>

        {/* Barra de progreso */}
        <div className="mb-4">
          <div
            ref={progressRef}
            className="h-1 rounded-full bg-white/10 cursor-pointer relative"
            onClick={handleSeek}
            onTouchStart={handleSeek}
          >
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-[#6E62F5] transition-none"
              style={{ width: `${pct}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md"
              style={{ left: `calc(${pct}% - 7px)` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="font-mono text-xs text-[#555966]">{fmt(currentTime)}</span>
            <span className="font-mono text-xs text-[#555966]">{duration > 0 ? fmt(duration) : '--:--'}</span>
          </div>
        </div>

        {/* Controles */}
        <div className="flex items-center justify-between mt-2">

          {/* Repeat */}
          <button
            onClick={cycleRepeat}
            className="relative w-11 h-11 flex items-center justify-center"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
              stroke={repeatMode !== 'none' ? '#6E62F5' : '#555966'} strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M14 3l3 3-3 3"/>
              <path d="M3 7v-.5A3.5 3.5 0 016.5 3H17"/>
              <path d="M6 17l-3-3 3-3"/>
              <path d="M17 13v.5A3.5 3.5 0 0113.5 17H3"/>
            </svg>
            {repeatLabel && (
              <span className="absolute -top-0.5 -right-0.5 text-[9px] font-mono font-bold text-[#6E62F5] leading-none">
                {repeatLabel}
              </span>
            )}
          </button>

          {/* Prev */}
          <button
            onClick={playPrev}
            className="w-14 h-14 flex items-center justify-center"
          >
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <path d="M4 4v18M22 4L9 13l13 9V4z" stroke="#EAE9E6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Play/Pause — botón principal */}
          <PlayPause />

          {/* Next */}
          <button
            onClick={playNext}
            className="w-14 h-14 flex items-center justify-center"
          >
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <path d="M22 4v18M4 4l13 9-13 9V4z" stroke="#EAE9E6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Cerrar — espacio para simetría */}
          <button
            onClick={() => setShowNowPlaying(false)}
            className="w-11 h-11 flex items-center justify-center"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 15L15 3M15 15L3 3" stroke="#555966" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>

        </div>
      </div>
    </div>
  )
}

// Botón play/pause separado para acceder al audio directamente
function PlayPause() {
  const { isPlaying } = usePlayer()

  const toggle = () => {
    const audio = (window as any).__demoAudio
    if (audio) audio.paused ? audio.play().catch(() => {}) : audio.pause()
  }

  return (
    <button
      onClick={toggle}
      className="w-[72px] h-[72px] rounded-full bg-[#6E62F5] flex items-center justify-center shadow-lg"
      style={{ boxShadow: '0 8px 24px rgba(110,98,245,0.45)' }}
    >
      {isPlaying ? (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="white">
          <rect x="3" y="2" width="6" height="18" rx="1.5"/>
          <rect x="13" y="2" width="6" height="18" rx="1.5"/>
        </svg>
      ) : (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="white">
          <path d="M5 2l14 9-14 9V2z"/>
        </svg>
      )}
    </button>
  )
}
