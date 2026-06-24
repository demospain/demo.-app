'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

interface Single {
  id:          string
  slug:        string
  track_id:    string
  track_title: string
  file_path:   string
  project_id:  string
  cover_url:   string | null
  artist_name: string | null
  created_at:  string
}

const R2 = 'https://pub-5ad091444ab84f6e979864f025aa8867.r2.dev'

function fmt(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function SingleClient({ single, userId }: { single: Single; userId: string | null }) {
  const audioRef    = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying]     = useState(false)
  const [current, setCurrent]     = useState(0)
  const [duration, setDuration]   = useState(0)
  const [loading, setLoading]     = useState(false)
  const [saved, setSaved]         = useState(false)
  const [saving, setSaving]       = useState(false)
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const audio = new Audio(`${R2}/${single.file_path}`)
    audioRef.current = audio
    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration))
    audio.addEventListener('timeupdate', () => setCurrent(audio.currentTime))
    audio.addEventListener('play', () => setPlaying(true))
    audio.addEventListener('pause', () => setPlaying(false))
    audio.addEventListener('ended', () => { setPlaying(false); setCurrent(0) })
    return () => { audio.pause(); audio.src = '' }
  }, [single.file_path])

  const toggle = async () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      setLoading(true)
      await audio.play().catch(() => {})
      setLoading(false)
    } else {
      audio.pause()
    }
  }

  const handleSeek = (e: React.MouseEvent) => {
    if (!progressRef.current || !duration) return
    const rect = progressRef.current.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    if (audioRef.current) audioRef.current.currentTime = pct * duration
  }

  const handleSave = async () => {
    if (!userId) {
      window.location.href = `/login?next=/s/${single.slug}`
      return
    }
    setSaving(true)
    const supabase = createClient()

    // Crea el proyecto como single no editable en la biblioteca del oyente
    const { data: project, error: pe } = await supabase
      .from('projects')
      .insert({
        title:      single.track_title,
        owner_id:   userId,
        visibility: 'private',
        cover_url:  single.cover_url,
        status:     'single',         // marca que es un single guardado
        share_slug: null,
      })
      .select('id')
      .single()

    if (pe || !project) { setSaving(false); return }

    // Guarda la canción en el proyecto single
    await supabase.from('tracks').insert({
      project_id:  project.id,
      title:       single.track_title,
      file_path:   single.file_path,
      track_order: 0,
      uploaded_by: userId,
      duration:    duration > 0 ? Math.round(duration) : null,
    })

    // Guarda el proyecto en la biblioteca (saved_projects)
    await supabase.from('saved_projects').insert({
      project_id: project.id,
      user_id:    userId,
    })

    setSaved(true)
    setSaving(false)
  }

  const pct = duration > 0 ? (current / duration) * 100 : 0

  return (
    <main className="min-h-screen bg-[#0f1117] text-[#EAE9E6] flex flex-col items-center justify-center px-4 py-12">

      {/* Logo */}
      <Link href="/" className="font-mono text-xl font-medium tracking-tight mb-12 opacity-60 hover:opacity-100 transition-opacity">
        demo<span className="text-[#6E62F5]">.</span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-sm">
        {/* Portada */}
        <div className="w-full aspect-square rounded-2xl overflow-hidden mb-6 shadow-2xl" style={{ boxShadow: '0 24px 48px rgba(0,0,0,.6)' }}>
          {single.cover_url
            ? <img src={single.cover_url} alt="" className="w-full h-full object-cover"/>
            : <div className="w-full h-full bg-[#181c27] flex items-center justify-center text-6xl opacity-20">💿</div>
          }
        </div>

        {/* Info */}
        <div className="mb-6">
          <p className="text-xl font-medium truncate">{single.track_title}</p>
          {single.artist_name && (
            <p className="text-sm font-mono text-[#555966] mt-1">{single.artist_name}</p>
          )}
        </div>

        {/* Progreso */}
        <div className="mb-5">
          <div
            ref={progressRef}
            onClick={handleSeek}
            className="h-1 rounded-full bg-white/10 cursor-pointer relative mb-2"
          >
            <div className="absolute left-0 top-0 h-full rounded-full bg-[#6E62F5]" style={{ width: `${pct}%` }}/>
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow"
              style={{ left: `calc(${pct}% - 6px)` }}
            />
          </div>
          <div className="flex justify-between">
            <span className="font-mono text-xs text-[#555966]">{fmt(current)}</span>
            <span className="font-mono text-xs text-[#555966]">{duration > 0 ? fmt(duration) : '--:--'}</span>
          </div>
        </div>

        {/* Botón play */}
        <button
          onClick={toggle}
          disabled={loading}
          className="w-full h-14 rounded-xl bg-[#6E62F5] hover:bg-[#5A4FD4] flex items-center justify-center mb-3 transition-colors disabled:opacity-60"
          style={{ boxShadow: '0 6px 20px rgba(110,98,245,.4)' }}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
          ) : playing ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
              <rect x="3" y="2" width="5" height="16" rx="1.5"/>
              <rect x="12" y="2" width="5" height="16" rx="1.5"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
              <path d="M4 2l14 8-14 8V2z"/>
            </svg>
          )}
        </button>

        {/* Guardar single */}
        <button
          onClick={handleSave}
          disabled={saved || saving}
          className={`w-full h-12 rounded-xl border flex items-center justify-center gap-2 text-sm font-medium transition-all ${
            saved
              ? 'border-[#1D9E75]/30 bg-[#1D9E75]/10 text-[#1D9E75]'
              : 'border-white/10 bg-white/[0.03] text-[#9BA0AD] hover:border-white/20 hover:text-[#EAE9E6]'
          }`}
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin"/>
          ) : saved ? (
            <>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7l4 4 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Guardado en tu biblioteca
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v8M4 6l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1 10v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              {userId ? 'Guardar en mi biblioteca' : 'Inicia sesión para guardar'}
            </>
          )}
        </button>

        <p className="text-center text-xs font-mono text-[#383C47] mt-4">
          Compartido con demo<span className="text-[#6E62F5]">.</span>
        </p>
      </div>
    </main>
  )
}
