'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import UploadTrack from '@/components/UploadTrack'
import { usePlayer } from '@/lib/PlayerContext'

interface Project {
  id:               string
  title:            string
  cover_url:        string | null
  visibility:       string
  status:           string
  share_slug?:      string
  owner_id:         string
  link_expires_at?: string | null
}

interface Track {
  id:          string
  title:       string
  file_path:   string
  track_order: number
  duration:    number | null
  created_at:  string
}

interface Props {
  project:       Project
  initialTracks: Track[]
  isMine:        boolean
  userId:        string
  nombre:        string
  inicial:       string
}

const VISIBILITY_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  private: { label: 'Privado',         icon: '🔒', color: 'text-[#555966]' },
  link:    { label: 'Solo invitación', icon: '🔗', color: 'text-[#F59E0B]' },
  public:  { label: 'Público',         icon: '🌍', color: 'text-[#1D9E75]' },
}

const EXPIRY_OPTIONS = [
  { label: '24 horas',   value: '24h',       hours: 24 },
  { label: '7 días',     value: '7d',        hours: 168 },
  { label: '30 días',    value: '30d',       hours: 720 },
  { label: 'Permanente', value: 'permanent', hours: null },
]

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function formatTrackDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now  = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Ayer'
  if (days < 7)  return `Hace ${days} días`
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function ExpiryCountdown({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState('')
  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now()
      if (diff <= 0) { setTimeLeft('Expirado'); return }
      const days  = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const mins  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const secs  = Math.floor((diff % (1000 * 60)) / 1000)
      if (days > 0)       setTimeLeft(`Caduca en ${days}d ${hours}h ${mins}m`)
      else if (hours > 0) setTimeLeft(`Caduca en ${hours}h ${mins}m ${secs}s`)
      else                setTimeLeft(`Caduca en ${mins}m ${secs}s`)
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])
  return (
    <div className="flex items-center gap-2">
      <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse flex-shrink-0"/>
      <span className="text-[#F59E0B] text-xs font-mono">{timeLeft}</span>
    </div>
  )
}

export default function ProyectoClient({ project: initialProject, initialTracks, isMine, userId, nombre, inicial }: Props) {
  const [project, setProject]               = useState<Project>(initialProject)
  const [tracks, setTracks]                 = useState<Track[]>(initialTracks)
  const [showTrackMenu, setShowTrackMenu]   = useState<string | null>(null)
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null)
  const [editingTrackName, setEditingTrackName] = useState('')
  const [coverUploading, setCoverUploading] = useState(false)
  const [coverOpacity, setCoverOpacity]     = useState(1)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setCoverOpacity(Math.max(0, 1 - (y - 60) / 140))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  const [dragOverId, setDragOverId]         = useState<string | null>(null)
  const [replacingTrackId, setReplacingTrackId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery]       = useState('')
  const [showSearch, setShowSearch]         = useState(false)
  const [showSharePanel, setShowSharePanel] = useState(false)
  const [showDotsMenu, setShowDotsMenu]     = useState(false)
  const [confirmModal, setConfirmModal]     = useState<{ title: string; desc: string; onConfirm: () => void } | null>(null)
  const [copied, setCopied]                 = useState(false)
  const [renamingProject, setRenamingProject] = useState(false)
  const [renameTitleInput, setRenameTitleInput] = useState(initialProject.title)
  const dragIdRef                           = useRef<string | null>(null)
  const coverInputRef                       = useRef<HTMLInputElement>(null)
  const replaceInputRef                     = useRef<HTMLInputElement>(null)
  const searchInputRef                      = useRef<HTMLInputElement>(null)
  const dotsMenuRef                         = useRef<HTMLDivElement>(null)
  const trackMenuRefs                       = useRef<Map<string, HTMLDivElement>>(new Map())
  const { currentTrack, playTrack, closePlayer, isPlaying: playerIsPlaying, setLibraryUserId } = usePlayer()

  useEffect(() => {
    if (userId) setLibraryUserId(userId)
  }, [userId])
  const router   = useRouter()
  const supabase = createClient()

  const vis           = VISIBILITY_CONFIG[project.visibility] ?? VISIBILITY_CONFIG.private
  const totalDuration = tracks.reduce((acc, t) => acc + (t.duration ?? 0), 0)
  const filteredTracks = searchQuery.trim()
    ? tracks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : tracks

  useEffect(() => {
    if (showSearch) setTimeout(() => searchInputRef.current?.focus(), 50)
  }, [showSearch])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dotsMenuRef.current && !dotsMenuRef.current.contains(e.target as Node)) {
        setShowDotsMenu(false)
      }
      let clickedInsideTrackMenu = false
      trackMenuRefs.current.forEach(ref => {
        if (ref && ref.contains(e.target as Node)) clickedInsideTrackMenu = true
      })
      if (!clickedInsideTrackMenu) setShowTrackMenu(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleVisibilityChange = async (key: string) => {
    const { error } = await supabase.from('projects').update({ visibility: key }).eq('id', project.id)
    if (!error) setProject(prev => ({ ...prev, visibility: key }))
  }

  const handleCopyLink = async () => {
    if (!project.share_slug) return
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/p/${project.share_slug}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const el = document.createElement('textarea')
      el.value = `${window.location.origin}/p/${project.share_slug}`
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleRenameProject = async () => {
    if (!renameTitleInput.trim() || renameTitleInput === project.title) {
      setRenamingProject(false)
      return
    }
    const { error } = await supabase
      .from('projects')
      .update({ title: renameTitleInput.trim() })
      .eq('id', project.id)
    if (error) {
      setRenameTitleInput(project.title)
    } else {
      setProject(prev => ({ ...prev, title: renameTitleInput.trim() }))
    }
    setRenamingProject(false)
  }

  const handleRenameTrack = async (trackId: string, newName: string) => {
    if (!newName.trim()) { setEditingTrackId(null); return }
    const { error } = await supabase
      .from('tracks')
      .update({ title: newName.trim() })
      .eq('id', trackId)
    if (!error) setTracks(prev => prev.map(t => t.id === trackId ? { ...t, title: newName.trim() } : t))
    setEditingTrackId(null)
  }

  const handleDeleteTrack = async (trackId: string) => {
    // Borrar todas las referencias (foreign keys) antes de borrar el track
    await supabase.from('notifications').delete().eq('track_id', trackId)
    await supabase.from('play_events').delete().eq('track_id', trackId)
    await supabase.from('comments').delete().eq('track_id', trackId)
    await supabase.from('track_versions').delete().eq('track_id', trackId)
    const { error } = await supabase.from('tracks').delete().eq('id', trackId)
    if (!error) {
      setTracks(prev => prev.filter(t => t.id !== trackId))
      if (currentTrack?.id === trackId) closePlayer()
    }
    setShowTrackMenu(null)
  }

  const confirmDeleteTrack = (trackId: string, trackTitle: string) => {
    setShowTrackMenu(null)
    setConfirmModal({
      title: 'Eliminar canción',
      desc: `¿Seguro que quieres eliminar "${trackTitle}"? Esta acción no se puede deshacer.`,
      onConfirm: () => handleDeleteTrack(trackId),
    })
  }

  const handleDuplicateTrack = async (track: Track) => {
    const { data, error } = await supabase
      .from('tracks')
      .insert({
        project_id:  project.id,
        title:       `${track.title} (copia)`,
        file_path:   track.file_path,
        track_order: tracks.length,
        uploaded_by: userId,
        duration:    track.duration,
      })
      .select()
      .single()
    if (!error && data) setTracks(prev => [...prev, data])
    setShowTrackMenu(null)
  }

  const handleExportTrack = async (track: Track) => {
    setShowTrackMenu(null)
    try {
      const res = await fetch('/api/play-url', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ filePath: track.file_path }),
      })
      const { url } = await res.json()
      const a = document.createElement('a')
      a.href     = url
      a.download = `${track.title}.${track.file_path.split('.').pop() ?? 'mp3'}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch {}
  }
  
  const handleExportProject = async () => {
    setShowDotsMenu(false)
    for (const track of tracks) {
      await handleExportTrack(track)
      await new Promise(r => setTimeout(r, 400))
    }
  }
  
  const handleDeleteProject = async () => {
    const { error } = await supabase.from('projects').delete().eq('id', project.id)
    if (!error) router.push('/dashboard')
    setShowDotsMenu(false)
  }

  const confirmDeleteProject = () => {
    setShowDotsMenu(false)
    setConfirmModal({
      title: 'Eliminar proyecto',
      desc: `¿Seguro que quieres eliminar "${project.title}" y todas sus canciones? Esta acción no se puede deshacer.`,
      onConfirm: handleDeleteProject,
    })
  }

  const handleReplaceAudio = async (trackId: string, file: File) => {
    setReplacingTrackId(trackId)
    try {
      const duration = await new Promise<number | null>(resolve => {
        const audio = document.createElement('audio')
        const url   = URL.createObjectURL(file)
        audio.addEventListener('loadedmetadata', () => { URL.revokeObjectURL(url); resolve(isFinite(audio.duration) ? Math.round(audio.duration) : null) })
        audio.addEventListener('error', () => { URL.revokeObjectURL(url); resolve(null) })
        audio.src = url
      })
      const res = await fetch('/api/upload-url', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ fileName: file.name, fileType: file.type, fileSize: file.size }),
      })
      const { uploadUrl, filePath } = await res.json()
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
      const { error } = await supabase
        .from('tracks')
        .update({ file_path: filePath, duration, format: file.name.split('.').pop()?.toLowerCase() })
        .eq('id', trackId)
      if (!error) {
        setTracks(prev => prev.map(t => t.id === trackId ? { ...t, file_path: filePath, duration } : t))
        if (currentTrack?.id === trackId) closePlayer()
      }
    } catch {}
    setReplacingTrackId(null)
  }

  const handleSetExpiry = async (hours: number | null) => {
    const expiresAt = hours ? new Date(Date.now() + hours * 60 * 60 * 1000).toISOString() : null
    const { error } = await supabase
      .from('projects')
      .update({ link_expires_at: expiresAt })
      .eq('id', project.id)
    if (!error) setProject(prev => ({ ...prev, link_expires_at: expiresAt }))
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverUploading(true)
    const res = await fetch('/api/upload-cover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName:  file.name,
        fileType:  file.type,
        fileSize:  file.size,
        projectId: project.id,
      }),
    })
    const { uploadUrl, filePath } = await res.json()
    await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
    const { error } = await supabase.from('projects').update({ cover_url: filePath }).eq('id', project.id)
    if (!error) {
      const publicUrl = `https://pub-5ad091444ab84f6e979864f025aa8867.r2.dev/${filePath}`
      setProject(prev => ({ ...prev, cover_url: publicUrl }))
    }
    setCoverUploading(false)
  }

  const handleDragStart = (trackId: string) => { dragIdRef.current = trackId }
  const handleDragOver  = (e: React.DragEvent, trackId: string) => {
    e.preventDefault()
    if (dragIdRef.current !== trackId) setDragOverId(trackId)
  }
  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    setDragOverId(null)
    const sourceId = dragIdRef.current
    if (!sourceId || sourceId === targetId) return
    const oldTracks = [...tracks]
    const sourceIdx = tracks.findIndex(t => t.id === sourceId)
    const targetIdx = tracks.findIndex(t => t.id === targetId)
    if (sourceIdx === -1 || targetIdx === -1) return
    const reordered = [...tracks]
    const [moved] = reordered.splice(sourceIdx, 1)
    reordered.splice(targetIdx, 0, moved)
    const withOrder = reordered.map((t, i) => ({ ...t, track_order: i }))
    setTracks(withOrder)
    const results = await Promise.all(withOrder.map(t =>
      supabase.from('tracks').update({ track_order: t.track_order }).eq('id', t.id)
    ))
    if (results.some(r => r.error)) setTracks(oldTracks)
  }
  const handleDragEnd = () => { dragIdRef.current = null; setDragOverId(null) }

  return (
    <div className={`flex flex-col min-h-screen bg-[#0f1117] ${currentTrack ? 'pb-20' : ''}`}>
      <style>{`
        @keyframes waveBar {
          from { transform: scaleY(0.4); }
          to   { transform: scaleY(1); }
        }
      `}</style>

      {/* Modal de confirmación */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-[#181c27] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-[#F8F7F4] font-medium text-base mb-2">{confirmModal.title}</h3>
            <p className="text-[#9BA0AD] text-sm mb-6 leading-relaxed">{confirmModal.desc}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 border border-white/[0.08] text-[#9BA0AD] hover:text-[#F8F7F4] py-2.5 rounded-xl text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => { confirmModal.onConfirm(); setConfirmModal(null) }}
                className="flex-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <input
        ref={replaceInputRef}
        type="file"
        accept="audio/mp3,audio/mpeg,audio/wav,audio/flac,audio/aiff,audio/x-aiff"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file && replacingTrackId) handleReplaceAudio(replacingTrackId, file)
          e.target.value = ''
        }}
      />

      {/* Navbar */}
      <nav className="h-[72px] flex items-center justify-between px-6 sticky top-0 z-50 bg-[#0f1117]/95 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-10 h-10 rounded-xl bg-[#F8F7F4] hover:bg-white flex items-center justify-center transition-colors flex-shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="#0f1117" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {showSearch ? (
            <div className="flex items-center gap-2 bg-[#181c27] border border-white/[0.08] rounded-xl px-3 h-10">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <circle cx="5.5" cy="5.5" r="4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2"/>
                <path d="M9 9l3 3" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar canción..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Escape') { setShowSearch(false); setSearchQuery('') }}}
                className="bg-transparent text-[#EAE9E6] text-sm outline-none w-40 placeholder:text-[#383C47] font-mono"
              />
              <button onClick={() => { setShowSearch(false); setSearchQuery('') }} className="text-[#555966] hover:text-[#9BA0AD] transition-colors">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M1 1l9 9M10 1L1 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="w-10 h-10 rounded-xl bg-[#F8F7F4] hover:bg-white flex items-center justify-center transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="4.5" stroke="#0f1117" strokeWidth="1.6"/>
                <path d="M11 11l3 3" stroke="#0f1117" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </button>
          )}

          {(isMine || project.visibility === 'public') && (
            <button
              onClick={() => { setShowSharePanel(p => !p); setShowDotsMenu(false) }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                showSharePanel ? 'bg-[#6E62F5] text-white' : 'bg-[#F8F7F4] hover:bg-white text-[#0f1117]'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M11.5 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM4.5 6a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM11.5 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M6.5 7.3l3-2M6.5 8.7l3 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </button>
          )}

          <div className="relative" ref={dotsMenuRef}>
            <button
              onClick={() => { setShowDotsMenu(p => !p); setShowSharePanel(false) }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                showDotsMenu ? 'bg-white text-[#0f1117]' : 'bg-[#F8F7F4] hover:bg-white text-[#0f1117]'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="3"  r="1.3" fill="currentColor"/>
                <circle cx="8" cy="8"  r="1.3" fill="currentColor"/>
                <circle cx="8" cy="13" r="1.3" fill="currentColor"/>
              </svg>
            </button>
            {showDotsMenu && (
              <div className="absolute right-0 top-11 bg-[#1E2028] border border-white/[0.08] rounded-xl shadow-xl z-50 py-1.5 min-w-[170px]">
                {isMine && (
                  <button
                    onClick={() => { setRenamingProject(true); setRenameTitleInput(project.title); setShowDotsMenu(false) }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#9BA0AD] hover:text-[#F8F7F4] hover:bg-white/[0.04] transition-colors text-left"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M10 1l3 3-9 9H1V10L10 1z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Renombrar
                  </button>
                )}
                <button
                  onClick={handleExportProject}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#9BA0AD] hover:text-[#F8F7F4] hover:bg-white/[0.04] transition-colors text-left"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1v9M4 7l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M1 11v1a1 1 0 001 1h10a1 1 0 001-1v-1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  Exportar todo
                </button>
                {isMine && (
                  <>
                    <div className="h-px bg-white/[0.06] my-1"/>
                    <button
                      onClick={confirmDeleteProject}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/5 transition-colors text-left"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 4h10M5 4V2.5h4V4M6 6.5v4M8 6.5v4M3 4l.5 8.5h7L11 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Eliminar proyecto
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Panel compartición */}
      {showSharePanel && (
        <div className="fixed inset-0 z-40" onClick={() => setShowSharePanel(false)}>
          <div
            className="absolute right-6 top-16 w-80 bg-[#13141a] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06]">
              <span className="text-sm font-medium text-[#F8F7F4] truncate pr-4">{project.title}</span>
              <button onClick={() => setShowSharePanel(false)} className="text-[#555966] hover:text-[#9BA0AD] transition-colors flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {isMine && (
              <div className="p-3 border-b border-white/[0.06]">
                <p className="text-[#555966] text-[10px] font-mono uppercase tracking-widest mb-2 px-1">Visibilidad</p>
                <div className="flex flex-col gap-0.5">
                  {Object.entries(VISIBILITY_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => handleVisibilityChange(key)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                        project.visibility === key
                          ? 'bg-[#7C6FFF]/10 text-[#7C6FFF]'
                          : 'text-[#9BA0AD] hover:bg-white/[0.04] hover:text-[#F8F7F4]'
                      }`}
                    >
                      <span className="text-base">{cfg.icon}</span>
                      <div className="text-left flex-1">
                        <p className="text-sm font-medium leading-none">{cfg.label}</p>
                        <p className="text-xs font-mono mt-0.5 opacity-60">
                          {key === 'private' ? 'Solo tú' : key === 'link' ? 'Solo quien tú invites' : 'Tus invitados pueden compartirlo'}
                        </p>
                      </div>
                      {project.visibility === key && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2.5 2.5L8 3" stroke="#7C6FFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isMine && (project.visibility === 'link' || project.visibility === 'public') && (
              <div className="p-3 border-b border-white/[0.06]">
                <p className="text-[#555966] text-[10px] font-mono uppercase tracking-widest mb-2 px-1">Caducidad del link</p>
                <div className="flex flex-col gap-0.5">
                  {EXPIRY_OPTIONS.map(opt => {
                    const isSelected = opt.hours === null ? !project.link_expires_at : false
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handleSetExpiry(opt.hours)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${
                          isSelected
                            ? 'bg-[#7C6FFF]/10 text-[#7C6FFF]'
                            : 'text-[#9BA0AD] hover:bg-white/[0.04] hover:text-[#F8F7F4]'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5l2.5 2.5L8 3" stroke="#7C6FFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>
                    )
                  })}
                </div>
                {project.link_expires_at && (
                  <div className="mt-2 px-1">
                    <ExpiryCountdown expiresAt={project.link_expires_at}/>
                  </div>
                )}
              </div>
            )}

            <div className="p-3">
              {isMine && project.visibility === 'private' ? (
                <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm bg-white/[0.03] border border-white/[0.06] text-[#383C47]">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M6.5 1a3 3 0 013 3v1.5H3.5V4a3 3 0 013-3z" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="1" y="5.5" width="11" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                  </svg>
                  Cambia la visibilidad para compartir
                </div>
              ) : (
                <button
                  onClick={handleCopyLink}
                  disabled={!project.share_slug}
                  className={`w-full flex items-center justify-center gap-2 font-medium px-4 py-2.5 rounded-xl text-sm transition-all ${
                    copied
                      ? 'bg-[#1D9E75]/10 border border-[#1D9E75]/20 text-[#1D9E75]'
                      : 'bg-[#7C6FFF] hover:bg-[#6B5FE8] text-white disabled:opacity-30'
                  }`}
                >
                  {copied ? (
                    <>
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path d="M2 6.5l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      ¡Link copiado!
                    </>
                  ) : (
                    <>
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1v-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                        <path d="M8 1h4v4M12 1L6 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Copiar link
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal renombrar */}
      {renamingProject && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setRenamingProject(false) }}
        >
          <div className="bg-[#13141a] border border-white/[0.07] rounded-2xl p-6 w-full max-w-sm">
            <p className="font-mono text-xs text-[#555966] uppercase tracking-widest mb-1">Renombrar proyecto</p>
            <h3 className="font-medium text-[#F8F7F4] text-base mb-4">¿Nuevo nombre?</h3>
            <input
              autoFocus
              type="text"
              value={renameTitleInput}
              onChange={e => setRenameTitleInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleRenameProject()
                if (e.key === 'Escape') setRenamingProject(false)
              }}
              className="bg-[#0d0d0f] border border-white/[0.06] focus:border-[#7C6FFF]/40 text-[#F8F7F4] placeholder:text-[#2E3140] rounded-xl px-4 py-3 text-sm outline-none transition-colors w-full font-mono mb-3"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setRenamingProject(false)}
                className="flex-1 border border-white/[0.06] text-[#555966] hover:text-[#9BA0AD] py-2.5 rounded-xl text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRenameProject}
                disabled={!renameTitleInput.trim()}
                className="flex-1 bg-[#7C6FFF] hover:bg-[#6B5FE8] disabled:opacity-30 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contenido */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-10">

          {/* Columna izquierda */}
          <div className="flex flex-col gap-5">
            {/* Portada — en móvil más pequeña y con fade al scroll */}
            <div
              className="lg:hidden flex justify-center"
              style={{ opacity: coverOpacity, transition: 'opacity 0.05s linear' }}
            >
              <div
                onClick={() => isMine && coverInputRef.current?.click()}
                className={`rounded-2xl bg-gradient-to-br from-[#252830] to-[#1a1a20] border border-white/[0.06] flex items-center justify-center overflow-hidden relative flex-shrink-0 ${isMine ? 'cursor-pointer' : ''}`}
                style={{ width: 'min(60vw, 240px)', height: 'min(60vw, 240px)' }}
              >
                {project.cover_url
                  ? <img src={project.cover_url} alt="" className="w-full h-full object-cover"/>
                  : <div className="text-4xl opacity-30">💿</div>
                }
                {/* En móvil no hay overlay hover — el tap directo abre el selector */}
              </div>
            </div>

            {/* Portada desktop — tamaño completo, sin fade */}
            <div
              onClick={() => isMine && coverInputRef.current?.click()}
              className={`hidden lg:flex w-full aspect-square rounded-2xl bg-gradient-to-br from-[#252830] to-[#1a1a20] border border-white/[0.06] items-center justify-center overflow-hidden relative group ${isMine ? 'cursor-pointer' : ''}`}
            >
              {project.cover_url
                ? <img src={project.cover_url} alt="" className="w-full h-full object-cover"/>
                : <div className="text-6xl opacity-30">💿</div>
              }
              {isMine && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                  {coverUploading
                    ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                    : <>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M10 13V4M6 8l4-4 4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M3 14v2a1 1 0 001 1h12a1 1 0 001-1v-2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      <span className="text-white text-sm font-mono">Subir portada</span>
                    </>
                  }
                </div>
              )}
            </div>
            <input ref={coverInputRef} type="file" accept="image/png,image/jpeg" onChange={handleCoverUpload} className="hidden"/>

            <div>
              <h2 className="text-xl font-medium text-[#F8F7F4] mb-1.5">{project.title}</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-sm font-mono ${vis.color}`}>{vis.icon} {vis.label}</span>
                <span className="text-[#252830]">·</span>
                <span className="text-sm font-mono text-[#555966]">
                  {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
                </span>
                {totalDuration > 0 && (
                  <>
                    <span className="text-[#252830]">·</span>
                    <span className="text-sm font-mono text-[#555966]">{formatDuration(totalDuration)}</span>
                  </>
                )}
              </div>
            </div>

            {!isMine && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-[#7C6FFF]/5 border border-[#7C6FFF]/15 rounded-xl">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M2 6.5l3 3 6-6" stroke="#7C6FFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-[#7C6FFF] text-sm font-mono">Guardado en tu biblioteca</span>
              </div>
            )}
          </div>

          {/* Columna derecha */}
          <div className="flex flex-col gap-4">
            {isMine && (
              <UploadTrack
                projectId={project.id}
                onUploadComplete={(track) => setTracks(prev => [...prev, { ...track, track_order: prev.length }])}
              />
            )}

            {tracks.length > 0 && (
              <div className="bg-[#181c27] border border-white/[0.07] rounded-xl overflow-visible">
                <div className="px-5 py-3.5 border-b border-white/[0.07] flex items-center justify-between">
                  <span className="text-[#555966] text-sm font-mono uppercase tracking-wider">Tracklist</span>
                  <span className="text-[#555966] text-sm font-mono">
                    {tracks.length} {tracks.length === 1 ? 'canción' : 'canciones'}
                    {totalDuration > 0 && ` · ${formatDuration(totalDuration)}`}
                  </span>
                </div>

                {searchQuery && filteredTracks.length === 0 && (
                  <div className="px-5 py-8 text-center">
                    <p className="text-[#383C47] text-sm font-mono">Sin resultados para "{searchQuery}"</p>
                  </div>
                )}

                {filteredTracks.map((track, i) => {
                  const isActive    = currentTrack?.id === track.id
                  const isPlaying   = isActive && playerIsPlaying
                  const isDragOver  = dragOverId === track.id
                  const isReplacing = replacingTrackId === track.id
                  return (
                    <div
                      key={track.id}
                      draggable={isMine}
                      onDragStart={() => handleDragStart(track.id)}
                      onDragOver={e => handleDragOver(e, track.id)}
                      onDrop={e => handleDrop(e, track.id)}
                      onDragEnd={handleDragEnd}
                    >
                      <div
                        onClick={() => playTrack({ id: track.id, title: track.title, file_path: track.file_path, projectTitle: project.title, coverUrl: project.cover_url ?? undefined }, filteredTracks.map(t => ({ id: t.id, title: t.title, file_path: t.file_path, projectTitle: project.title, coverUrl: project.cover_url ?? undefined })))}
                        onTouchStart={e => { (e.currentTarget as any)._touchY = e.touches[0].clientY }}
                        onTouchEnd={e => {
                          const startY = (e.currentTarget as any)._touchY ?? 0
                          const dy = Math.abs(e.changedTouches[0].clientY - startY)
                          // Solo si fue tap (movimiento < 8px), no scroll
                          if (dy < 8) {
                            playTrack({ id: track.id, title: track.title, file_path: track.file_path, projectTitle: project.title, coverUrl: project.cover_url ?? undefined }, filteredTracks.map(t => ({ id: t.id, title: t.title, file_path: t.file_path, projectTitle: project.title, coverUrl: project.cover_url ?? undefined })))
                          }
                        }}
                        className={`flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.04] last:border-0 group transition-colors cursor-pointer ${
                          isDragOver ? 'bg-[#7C6FFF]/10 border-t border-[#7C6FFF]/30' :
                          isActive   ? 'bg-[#7C6FFF]/5' :
                          'hover:bg-white/[0.02]'
                        }`}
                      >
                        {isMine && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-[#333] hover:text-[#555966] flex-shrink-0 -ml-1">
                            <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
                              <circle cx="3" cy="2.5"  r="1.2" fill="currentColor"/>
                              <circle cx="7" cy="2.5"  r="1.2" fill="currentColor"/>
                              <circle cx="3" cy="7"    r="1.2" fill="currentColor"/>
                              <circle cx="7" cy="7"    r="1.2" fill="currentColor"/>
                              <circle cx="3" cy="11.5" r="1.2" fill="currentColor"/>
                              <circle cx="7" cy="11.5" r="1.2" fill="currentColor"/>
                            </svg>
                          </div>
                        )}

                        {isPlaying ? (
                          <div className="w-5 flex items-end justify-center gap-[2px] h-4 flex-shrink-0">
                            {[0.6, 1, 0.75, 0.9].map((h, idx) => (
                              <div
                                key={idx}
                                className="w-[3px] rounded-sm bg-[#7C6FFF]"
                                style={{
                                  height: `${h * 100}%`,
                                  transformOrigin: 'bottom',
                                  animation: `waveBar ${0.6 + idx * 0.1}s ease-in-out ${idx * 0.12}s infinite alternate`,
                                }}
                              />
                            ))}
                          </div>
                        ) : isActive ? (
                          <div className="w-5 flex items-end justify-center gap-[2px] h-4 flex-shrink-0">
                            {[0.6, 1, 0.75, 0.9].map((h, idx) => (
                              <div key={idx} className="w-[3px] rounded-sm bg-[#7C6FFF]/40" style={{ height: `${h * 100}%` }}/>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[#555966] font-mono text-sm w-5 text-right flex-shrink-0 group-hover:text-[#9BA0AD] transition-colors">
                            {i + 1}
                          </span>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className={`text-base font-medium truncate transition-colors ${
                            isPlaying ? 'text-[#7C6FFF]' : 'text-[#F8F7F4]'
                          }`}>
                            {track.title}
                          </p>
                          <p className="text-xs font-mono text-[#555966] mt-0.5">
                            {formatDate(track.created_at)}
                            {track.duration && track.duration > 0 && (
                              <span> · {formatTrackDuration(track.duration)}</span>
                            )}
                          </p>
                        </div>

                        {isMine && (
                          <div
                            className="relative"
                            ref={el => {
                              if (el) trackMenuRefs.current.set(track.id, el)
                              else trackMenuRefs.current.delete(track.id)
                            }}
                          >
                            <button
                              onClick={e => { e.stopPropagation(); setShowTrackMenu(showTrackMenu === track.id ? null : track.id) }}
                              className="opacity-0 group-hover:opacity-100 md:transition-opacity text-[#555966] hover:text-[#9BA0AD] p-1.5 opacity-100 md:opacity-0"
                            >
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <circle cx="8" cy="2.5"  r="1.2" fill="currentColor"/>
                                <circle cx="8" cy="8"    r="1.2" fill="currentColor"/>
                                <circle cx="8" cy="13.5" r="1.2" fill="currentColor"/>
                              </svg>
                            </button>
                            {showTrackMenu === track.id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowTrackMenu(null)}/>
                                <div className={`absolute right-0 bg-[#1E2028] border border-white/[0.08] rounded-xl shadow-xl z-50 py-1.5 min-w-[160px] ${
                                  i >= filteredTracks.length - 2 ? 'bottom-8' : 'top-8'
                                }`}>
                                <button
                                  onClick={() => { setEditingTrackId(track.id); setEditingTrackName(track.title); setShowTrackMenu(null) }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#9BA0AD] hover:text-[#F8F7F4] hover:bg-white/[0.04] transition-colors text-left"
                                >
                                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                                    <path d="M9 1l3 3-8 8H1V9L9 1z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                  Renombrar
                                </button>
                                <button
                                  onClick={async () => { await handleCopyLink(); setShowTrackMenu(null) }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#9BA0AD] hover:text-[#F8F7F4] hover:bg-white/[0.04] transition-colors text-left"
                                >
                                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                                    <path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1v-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                                    <path d="M8 1h4v4M12 1L6 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                  Compartir
                                </button>
                                <button
                                  onClick={() => { setReplacingTrackId(track.id); setShowTrackMenu(null); replaceInputRef.current?.click() }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#9BA0AD] hover:text-[#F8F7F4] hover:bg-white/[0.04] transition-colors text-left"
                                >
                                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                                    <path d="M1 6.5a5.5 5.5 0 1 0 5.5-5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                                    <path d="M1 2v4.5h4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                  Reemplazar
                                </button>
                                <button
                                  onClick={() => handleDuplicateTrack(track)}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#9BA0AD] hover:text-[#F8F7F4] hover:bg-white/[0.04] transition-colors text-left"
                                >
                                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                                    <rect x="4.5" y="4.5" width="7.5" height="7.5" rx="1.2" stroke="currentColor" strokeWidth="1.2"/>
                                    <path d="M1 8.5V2a1 1 0 0 1 1-1h6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                                  </svg>
                                  Duplicar
                                </button>
                                <button
                                  onClick={() => handleExportTrack(track)}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#9BA0AD] hover:text-[#F8F7F4] hover:bg-white/[0.04] transition-colors text-left"
                                >
                                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                                    <path d="M6.5 1v8M3.5 6l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M1 10v1a1 1 0 001 1h9a1 1 0 001-1v-1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                                  </svg>
                                  Exportar
                                </button>
                                <div className="h-px bg-white/[0.06] my-1"/>
                                <button
                                  onClick={() => confirmDeleteTrack(track.id, track.title)}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/5 transition-colors text-left"
                                >
                                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                                    <path d="M2 3.5h9M4.5 3.5V2h4v1.5M5.5 6v4M7.5 6v4M3 3.5l.5 8h6l.5-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                  Eliminar
                                </button>
                              </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {editingTrackId === track.id && (
                        <div className="px-5 py-2.5 bg-[#111318] border-b border-white/[0.04]">
                          <input
                            autoFocus
                            type="text"
                            value={editingTrackName}
                            onChange={e => setEditingTrackName(e.target.value)}
                            onBlur={() => handleRenameTrack(track.id, editingTrackName)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleRenameTrack(track.id, editingTrackName)
                              if (e.key === 'Escape') setEditingTrackId(null)
                            }}
                            className="w-full bg-transparent text-[#F8F7F4] text-sm outline-none border-b border-[#7C6FFF]/40 pb-0.5"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {tracks.length === 0 && !isMine && (
              <div className="border border-dashed border-white/[0.06] rounded-xl p-10 text-center">
                <p className="text-[#555966] text-sm font-mono">Sin canciones todavía.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
