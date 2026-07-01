'use client'

import { useRef, useState } from 'react'
import { usePlayer } from '@/lib/PlayerContext'

function fmt(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

// Patrón de respaldo — se usa solo si el track no tiene waveform real guardada
// (canciones subidas antes de este cambio, o si el análisis falló al subir)
const FALLBACK_HEIGHTS = [0.3, 0.5, 0.8, 0.6, 1, 0.7, 0.4, 0.9, 0.5, 0.7, 1, 0.6, 0.3,
  0.8, 0.5, 1, 0.7, 0.4, 0.9, 0.6, 0.3, 0.8, 0.5, 0.7, 1, 0.6, 0.4, 0.9,
  0.5, 0.8, 0.6, 1, 0.4, 0.7, 0.5, 0.9, 0.6, 0.3, 0.8, 0.5, 0.7, 1, 0.6,
  0.4, 0.9, 0.5, 0.8, 0.6, 1, 0.4, 0.7, 0.3, 0.5, 0.8, 0.6, 1, 0.7, 0.4,
  0.9, 0.5, 0.7, 1, 0.6, 0.3, 0.8, 0.5, 1, 0.7, 0.4, 0.9, 0.6, 0.3, 0.8,
  0.5, 0.7, 1, 0.6, 0.4, 0.9, 0.5, 0.8, 0.6, 1, 0.4, 0.7, 0.3, 0.5, 0.8,
  0.6, 1, 0.7, 0.4, 0.9, 0.5, 0.7, 1, 0.6, 0.3, 0.8, 0.5]

export default function NowPlayingModal() {
  const {
    currentTrack, isPlaying, repeatMode, shuffleMode, currentTime, duration,
    showNowPlaying, setShowNowPlaying,
    playNext, playPrev, cycleRepeat, seekTo, shuffleProject,
  } = usePlayer()

  const waveformRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const [dragTime, setDragTime] = useState(0)

  const dismissStartY = useRef<number | null>(null)
  const [dismissDy, setDismissDy] = useState(0)
  const [closing, setClosing] = useState(false)

  if (!showNowPlaying || !currentTrack) return null

  const shownTime = dragging ? dragTime : currentTime
  const pct = duration > 0 ? (shownTime / duration) * 100 : 0

  const waveform = currentTrack.waveform && currentTrack.waveform.length > 0
    ? currentTrack.waveform
    : FALLBACK_HEIGHTS

  const timeFromClientX = (clientX: number) => {
    if (!waveformRef.current || !duration) return 0
    const rect = waveformRef.current.getBoundingClientRect()
    const p = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    return p * duration
  }

  const onThumbDown = (clientX: number) => {
    setDragging(true)
    setDragTime(timeFromClientX(clientX))
    const onMove = (e: MouseEvent | TouchEvent) => {
      const x = 'touches' in e ? e.touches[0].clientX : e.clientX
      setDragTime(timeFromClientX(x))
    }
    const onUp = (e: MouseEvent | TouchEvent) => {
      const x = 'changedTouches' in e ? e.changedTouches[0].clientX : (e as MouseEvent).clientX
      seekTo(timeFromClientX(x))
      setDragging(false)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onUp)
  }

  const onDismissStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('[data-progress]')) return
    dismissStartY.current = e.touches[0].clientY
  }
  const onDismissMove = (e: React.TouchEvent) => {
    if (dismissStartY.current === null) return
    const dy = e.touches[0].clientY - dismissStartY.current
    if (dy > 0) setDismissDy(dy)
  }
  const onDismissEnd = () => {
    if (dismissStartY.current === null) return
    dismissStartY.current = null
    if (dismissDy > 120) {
      setClosing(true)
      setTimeout(() => { setShowNowPlaying(false); setClosing(false); setDismissDy(0) }, 220)
    } else {
      setDismissDy(0)
    }
  }

  const repeatLabel = repeatMode === 'one' ? '1' : repeatMode === 'all' ? '∞' : null

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col md:hidden"
      style={{
        background: '#0f1117',
        transform: closing ? 'translateY(100%)' : `translateY(${dismissDy}px)`,
        transition: closing ? 'transform 0.22s ease-in' : dismissStartY.current !== null ? 'none' : 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        opacity: closing ? 0 : Math.max(0.4, 1 - dismissDy / 600),
      }}
      onTouchStart={onDismissStart}
      onTouchMove={onDismissMove}
      onTouchEnd={onDismissEnd}
    >

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

      <div className="relative flex flex-col flex-1 px-7 pb-10 pt-6">

        <div className="flex justify-center mb-2">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        <button
          onClick={() => setShowNowPlaying(false)}
          className="absolute top-4 right-6 w-9 h-9 flex items-center justify-center rounded-full bg-white/[0.07]"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 3l8 8M11 3l-8 8" stroke="#9BA0AD" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </button>

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

        {/* Waveform interactiva — real si existe, si no patrón de respaldo */}
        <div className="mb-2" data-progress>
          <div
            ref={waveformRef}
            className="relative flex items-center gap-[2px] h-10 cursor-pointer touch-none"
            onMouseDown={e => onThumbDown(e.clientX)}
            onTouchStart={e => { e.stopPropagation(); onThumbDown(e.touches[0].clientX) }}
          >
            {waveform.map((h, i) => {
              const barPct = (i / waveform.length) * 100
              const isPast = barPct <= pct
              return (
                <div
                  key={i}
                  className="flex-1 rounded-full"
                  style={{
                    height: `${Math.max(h * 100, 8)}%`,
                    background: isPast ? '#6E62F5' : 'rgba(255,255,255,0.14)',
                    transition: dragging ? 'none' : 'background 0.1s ease',
                  }}
                />
              )
            })}
            {/* Cursor de posición */}
            <div
              className="absolute top-1/2 -translate-y-1/2 rounded-full bg-[#6E62F5] pointer-events-none"
              style={{
                width: dragging ? '4px' : '3px',
                height: dragging ? '130%' : '120%',
                left: `${pct}%`,
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 0 8px rgba(110,98,245,0.6)',
                transition: dragging ? 'none' : 'left 0.1s linear',
              }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="font-mono text-xs text-[#555966]">{fmt(shownTime)}</span>
            <span className="font-mono text-xs text-[#555966]">{duration > 0 ? fmt(duration) : '--:--'}</span>
          </div>
        </div>

        <div className="mb-5">
          <p className="text-[#EAE9E6] font-medium text-xl truncate">{currentTrack.title}</p>
          <p className="text-[#555966] font-mono text-sm mt-0.5 truncate">{currentTrack.projectTitle ?? 'demo.'}</p>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center mt-2">

          <button onClick={shuffleProject} className="w-11 h-11 flex items-center justify-center justify-self-start">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
              stroke={shuffleMode !== 'none' ? '#6E62F5' : '#555966'} strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M3 4h2.5l3 4M17 4h-3l-7 9H3"/>
              <path d="M14 2l3 2-3 2"/>
              <path d="M11 11l3 2-3 2"/>
              <path d="M14 16h3"/>
            </svg>
          </button>

          <div className="flex items-center gap-2 justify-self-center">
            <button onClick={playPrev} className="w-14 h-14 flex items-center justify-center">
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <path d="M4 4v18M22 4L9 13l13 9V4z" stroke="#EAE9E6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <PlayPause />

            <button onClick={playNext} className="w-14 h-14 flex items-center justify-center">
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <path d="M22 4v18M4 4l13 9-13 9V4z" stroke="#EAE9E6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <button onClick={cycleRepeat} className="relative w-11 h-11 flex items-center justify-center justify-self-end">
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

        </div>
      </div>
    </div>
  )
}

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
