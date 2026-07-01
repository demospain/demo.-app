'use client'

import { useRef, useState } from 'react'

// Patrón de respaldo — se usa solo si el track no tiene waveform real guardada
export const FALLBACK_WAVEFORM = [0.3, 0.5, 0.8, 0.6, 1, 0.7, 0.4, 0.9, 0.5, 0.7, 1, 0.6, 0.3,
  0.8, 0.5, 1, 0.7, 0.4, 0.9, 0.6, 0.3, 0.8, 0.5, 0.7, 1, 0.6, 0.4, 0.9,
  0.5, 0.8, 0.6, 1, 0.4, 0.7, 0.5, 0.9, 0.6, 0.3, 0.8, 0.5, 0.7, 1, 0.6,
  0.4, 0.9, 0.5, 0.8, 0.6, 1, 0.4, 0.7, 0.3, 0.5, 0.8, 0.6, 1, 0.7, 0.4,
  0.9, 0.5, 0.7, 1, 0.6, 0.3, 0.8, 0.5, 1, 0.7, 0.4, 0.9, 0.6, 0.3, 0.8,
  0.5, 0.7, 1, 0.6, 0.4, 0.9, 0.5, 0.8, 0.6, 1, 0.4, 0.7, 0.3, 0.5, 0.8,
  0.6, 1, 0.7, 0.4, 0.9, 0.5, 0.7, 1, 0.6, 0.3, 0.8, 0.5]

function fmt(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export interface ImmersiveTrackMenuAction {
  label:   string
  icon:    React.ReactNode
  onClick: () => void
  danger?: boolean
}

interface Props {
  title:            string
  subtitle:         string | null // artista / propietario ft. admins
  coverUrl:         string | null
  waveform:         number[] | null
  isPlaying:        boolean
  loading?:         boolean
  currentTime:      number
  duration:         number
  onSeek:           (t: number) => void
  onTogglePlay:     () => void

  // Navegación — se ocultan si no se proveen
  onPrev?:          () => void
  onNext?:          () => void
  hasPrev?:         boolean
  hasNext?:         boolean

  // Shuffle — se oculta si no se provee
  shuffleActive?:   boolean
  onToggleShuffle?: () => void
  shuffleLoading?:  boolean

  // Repeat — se oculta si no se provee
  repeatLabel?:     string | null // '1' | '∞' | null
  onCycleRepeat?:   () => void

  // Compartir — se oculta si no se provee
  onShare?:         () => Promise<boolean> | void
  shared?:           boolean
  sharing?:          boolean

  // Cerrar
  onClose:          () => void

  // Menú de gestión de la canción (tres puntos) — se oculta si no se provee
  menuActions?:     ImmersiveTrackMenuAction[]

  // Layout
  variant:          'mobile' | 'desktop'
}

export default function ImmersivePlayerView({
  title, subtitle, coverUrl, waveform, isPlaying, loading, currentTime, duration,
  onSeek, onTogglePlay, onPrev, onNext, hasPrev, hasNext,
  shuffleActive, onToggleShuffle, shuffleLoading,
  repeatLabel, onCycleRepeat,
  onShare, shared, sharing,
  onClose, menuActions, variant,
}: Props) {
  const waveformRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const [dragTime, setDragTime] = useState(0)
  const [showMenu, setShowMenu] = useState(false)

  const shownTime = dragging ? dragTime : currentTime
  const pct = duration > 0 ? (shownTime / duration) * 100 : 0
  const bars = waveform && waveform.length > 0 ? waveform : FALLBACK_WAVEFORM

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
      onSeek(timeFromClientX(x))
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

  const isDesktop = variant === 'desktop'
  const coverSize  = isDesktop ? 320 : 'min(72vw, 320px)'
  const playSize   = isDesktop ? 76 : 72

  const Waveform = () => (
    <div data-progress>
      <div
        ref={waveformRef}
        className="relative flex items-center gap-[2px] h-10 cursor-pointer touch-none"
        onMouseDown={e => onThumbDown(e.clientX)}
        onTouchStart={e => { e.stopPropagation(); onThumbDown(e.touches[0].clientX) }}
      >
        {bars.map((h, i) => {
          const barPct = (i / bars.length) * 100
          const isPast = barPct <= pct
          return (
            <div
              key={i}
              className="flex-1 rounded-full"
              style={{
                height: `${Math.max(h * 100, 8)}%`,
                background: isPast ? '#6E62F5' : 'rgba(255,255,255,0.16)',
                transition: dragging ? 'none' : 'background 0.1s ease',
              }}
            />
          )
        })}
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
        <span className="font-mono text-xs text-white/40">{fmt(shownTime)}</span>
        <span className="font-mono text-xs text-white/40">{duration > 0 ? fmt(duration) : '--:--'}</span>
      </div>
    </div>
  )

  const Controls = () => (
    <div className="flex items-center justify-center gap-2">
      {onToggleShuffle && (
        <button onClick={onToggleShuffle} disabled={shuffleLoading} className="w-11 h-11 flex items-center justify-center flex-shrink-0 disabled:opacity-40">
          {shuffleLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
              stroke={shuffleActive ? '#6E62F5' : 'rgba(255,255,255,0.5)'} strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M3 4h2.5l3 4M17 4h-3l-7 9H3"/>
              <path d="M14 2l3 2-3 2"/>
              <path d="M11 11l3 2-3 2"/>
              <path d="M14 16h3"/>
            </svg>
          )}
        </button>
      )}

      {onPrev && (
        <button onClick={onPrev} disabled={!hasPrev} className="w-14 h-14 flex items-center justify-center flex-shrink-0 disabled:opacity-25">
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            <path d="M4 4v18M22 4L9 13l13 9V4z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      <button
        onClick={onTogglePlay}
        disabled={loading}
        className="rounded-full bg-[#6E62F5] flex items-center justify-center shadow-lg flex-shrink-0 disabled:opacity-60"
        style={{ width: playSize, height: playSize, boxShadow: '0 8px 24px rgba(110,98,245,0.45)' }}
      >
        {loading ? (
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
        ) : isPlaying ? (
          <svg width={playSize * 0.3} height={playSize * 0.3} viewBox="0 0 22 22" fill="white">
            <rect x="3" y="2" width="6" height="18" rx="1.5"/>
            <rect x="13" y="2" width="6" height="18" rx="1.5"/>
          </svg>
        ) : (
          <svg width={playSize * 0.3} height={playSize * 0.3} viewBox="0 0 22 22" fill="white">
            <path d="M5 2l14 9-14 9V2z"/>
          </svg>
        )}
      </button>

      {onNext && (
        <button onClick={onNext} disabled={!hasNext} className="w-14 h-14 flex items-center justify-center flex-shrink-0 disabled:opacity-25">
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            <path d="M22 4v18M4 4l13 9-13 9V4z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {onCycleRepeat && (
        <button onClick={onCycleRepeat} className="relative w-11 h-11 flex items-center justify-center flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
            stroke={repeatLabel ? '#6E62F5' : 'rgba(255,255,255,0.5)'} strokeWidth="1.5"
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
      )}
    </div>
  )

  const ShareButton = () => onShare ? (
    <button
      onClick={() => onShare()}
      disabled={sharing}
      className="w-9 h-9 flex items-center justify-center rounded-full disabled:opacity-50 flex-shrink-0"
      style={{ background: 'rgba(255,255,255,0.1)' }}
    >
      {shared ? (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 7l3.5 3.5L12 3" stroke="#1D9E75" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="11" cy="2.5" r="1.6" stroke="white" strokeOpacity="0.7" strokeWidth="1.2"/>
          <circle cx="11" cy="11.5" r="1.6" stroke="white" strokeOpacity="0.7" strokeWidth="1.2"/>
          <circle cx="2.5" cy="7" r="1.6" stroke="white" strokeOpacity="0.7" strokeWidth="1.2"/>
          <path d="M4.3 6.2l5-2.6M4.3 7.8l5 2.6" stroke="white" strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      )}
    </button>
  ) : null

  const MenuButton = () => menuActions && menuActions.length > 0 ? (
    <div className="relative">
      <button
        onClick={() => setShowMenu(p => !p)}
        className="w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.1)' }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="3"  r="1.3" fill="white"/>
          <circle cx="8" cy="8"  r="1.3" fill="white"/>
          <circle cx="8" cy="13" r="1.3" fill="white"/>
        </svg>
      </button>
      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}/>
          <div className="absolute right-0 top-11 bg-[#1E2028] border border-white/[0.08] rounded-xl shadow-xl z-50 py-1.5 min-w-[170px]">
            {menuActions.map((action, i) => (
              <button
                key={i}
                onClick={() => { action.onClick(); setShowMenu(false) }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left ${
                  action.danger
                    ? 'text-red-400 hover:text-red-300 hover:bg-red-400/5'
                    : 'text-[#9BA0AD] hover:text-[#F8F7F4] hover:bg-white/[0.04]'
                }`}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  ) : null

  const CoverArt = () => (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        width: coverSize, height: coverSize,
        boxShadow: '0 32px 64px -12px rgba(0,0,0,0.7)',
      }}
    >
      {coverUrl
        ? <img src={coverUrl} alt="" className="w-full h-full object-cover"/>
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
  )

  if (isDesktop) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
        {coverUrl && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${coverUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(40px) saturate(1.7) brightness(0.7)',
              transform: 'scale(1.15)',
            }}
          />
        )}
        <div className="absolute inset-0 bg-[#0f1117]" style={{ opacity: coverUrl ? 0.35 : 1 }}/>

        <div className="absolute top-6 right-6 flex items-center gap-2 z-10">
          <ShareButton/>
          <MenuButton/>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="relative z-10 flex flex-col items-center px-10 py-12 max-w-md w-full">
          <div className="mb-10">
            <CoverArt/>
          </div>

          <p className="text-white font-medium text-2xl text-center truncate w-full">{title}</p>
          {subtitle && (
            <p className="text-white/50 font-mono text-sm mt-1.5 mb-10 text-center truncate w-full">{subtitle}</p>
          )}
          {!subtitle && <div className="mb-10"/>}

          <div className="w-full mb-8">
            <Waveform/>
          </div>

          <Controls/>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: '#0f1117' }}>
      {coverUrl && (
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${coverUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(48px) saturate(1.4)',
            transform: 'scale(1.1)',
          }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-[#0f1117]/60 to-[#0f1117]"/>

      <div className="relative flex flex-col flex-1 px-7 pb-10 pt-6">
        <div className="flex justify-center mb-2">
          <div className="w-10 h-1 rounded-full bg-white/20"/>
        </div>

        <div className="absolute top-4 left-6">
          <ShareButton/>
        </div>

        <div className="absolute top-4 right-6 flex items-center gap-2">
          <MenuButton/>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/[0.07]"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 3l8 8M11 3l-8 8" stroke="#9BA0AD" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center py-6">
          <CoverArt/>
        </div>

        <div className="mb-2">
          <Waveform/>
        </div>

        <div className="mb-5">
          <p className="text-[#EAE9E6] font-medium text-xl truncate">{title}</p>
          {subtitle && (
            <p className="text-[#555966] font-mono text-sm mt-0.5 truncate">{subtitle}</p>
          )}
        </div>

        <Controls/>
      </div>
    </div>
  )
}
