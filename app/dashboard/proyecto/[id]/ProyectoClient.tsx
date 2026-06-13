'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import UploadTrack from '@/components/UploadTrack'
import { usePlayer } from '@/lib/PlayerContext'

interface Project {
  id:          string
  title:       string
  cover_url:   string | null
  visibility:  string
  status:      string
  share_slug?: string
  owner_id:    string
}

interface Track {
  id:          string
  title:       string
  file_path:   string
  track_order: number
}

interface Props {
  project:       Project
  initialTracks: Track[]
  isMine:        boolean
  userId:        string
}

const VISIBILITY_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  private: { label: 'Privado',  icon: '🔒', color: 'text-[#555966]' },
  link:    { label: 'Con link', icon: '🔗', color: 'text-[#F59E0B]' },
  public:  { label: 'Público',  icon: '🌍', color: 'text-[#1D9E75]' },
}

export default function ProyectoClient({ project: initialProject, initialTracks, isMine, userId }: Props) {
  const [project, setProject]               = useState(initialProject)
  const [tracks, setTracks]                 = useState<Track[]>(initialTracks)
  const [copied, setCopied]                 = useState(false)
  const [editingTitle, setEditingTitle]     = useState(false)
  const [titleInput, setTitleInput]         = useState(initialProject.title)
  const [showTrackMenu, setShowTrackMenu]   = useState<string | null>(null)
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null)
  const [editingTrackName, setEditingTrackName] = useState('')
  const [coverUploading, setCoverUploading] = useState(false)
  const coverInputRef                       = useRef<HTMLInputElement>(null)
  const { currentTrack, playTrack, closePlayer } = usePlayer()
  const router = useRouter()
  const supabase = createClient()

  const vis = VISIBILITY_CONFIG[project.visibility] ?? VISIBILITY_CONFIG.private

  const handleVisibilityChange = async (key: string) => {
    await supabase.from('projects').update({ visibility: key }).eq('id', project.id)
    setProject(prev => ({ ...prev, visibility: key }))
  }

  const handleCopyLink = () => {
    if (!project.share_slug) return
    navigator.clipboard.writeText(`${window.location.origin}/p/${project.share_slug}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRenameProject = async () => {
    if (!titleInput.trim() || titleInput === project.title) {
      setEditingTitle(false)
      return
    }
    await supabase.from('projects').update({ title: titleInput.trim() }).eq('id', project.id)
    setProject(prev => ({ ...prev, title: titleInput.trim() }))
    setEditingTitle(false)
  }

  const handleRenameTrack = async (trackId: string, newName: string) => {
    if (!newName.trim()) { setEditingTrackId(null); return }
    await supabase.from('tracks').update({ title: newName.trim() }).eq('id', trackId)
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, title: newName.trim() } : t))
    setEditingTrackId(null)
  }

  const handleDeleteTrack = async (trackId: string) => {
    await supabase.from('tracks').delete().eq('id', trackId)
    setTracks(prev => prev.filter(t => t.id !== trackId))
    if (currentTrack?.id === trackId) closePlayer()
    setShowTrackMenu(null)
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverUploading(true)

    const res = await fetch('/api/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: `cover-${project.id}.${file.name.split('.').pop()}`, fileType: file.type, fileSize: file.size }),
    })
    const { uploadUrl, filePath } = await res.json()

    await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })

    const coverUrl = `/api/play-url?path=${encodeURIComponent(filePath)}`
    await supabase.from('projects').update({ cover_url: `/covers/${filePath}` }).eq('id', project.id)

    // Usar URL temporal para mostrar la imagen
    const objectUrl = URL.createObjectURL(file)
    setProject(prev => ({ ...prev, cover_url: objectUrl }))
    setCoverUploading(false)
  }

  return (
    <div className={currentTrack ? 'pb-36' : ''}>

      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.push('/dashboard')}
          className="w-8 h-8 rounded-lg bg-[#1E2028] hover:bg-[#252830] border border-white/[0.06] flex items-center justify-center transition-colors flex-shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className="text-[#555966] text-sm font-mono">Biblioteca</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M4 2l4 4-4 4" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        <span className="text-[#F8F7F4] text-sm font-medium truncate">{project.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">

        {/* Columna izquierda */}
        <div className="flex flex-col gap-4">

          {/* Portada con upload */}
          <div
            onClick={() => isMine && coverInputRef.current?.click()}
            className={`w-full aspect-square rounded-2xl bg-gradient-to-br from-[#252830] to-[#1a1a20] border border-white/[0.06] flex items-center justify-center overflow-hidden relative group ${isMine ? 'cursor-pointer' : ''}`}
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
                    <span className="text-white text-xs font-mono">Subir portada</span>
                  </>
                }
              </div>
            )}
            <input
              ref={coverInputRef}
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleCoverUpload}
              className="hidden"
            />
          </div>

          {/* Título — clicable para renombrar */}
          <div>
            {editingTitle ? (
              <input
                autoFocus
                type="text"
                value={titleInput}
                onChange={e => setTitleInput(e.target.value)}
                onBlur={handleRenameProject}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleRenameProject()
                  if (e.key === 'Escape') { setEditingTitle(false); setTitleInput(project.title) }
                }}
                className="w-full bg-[#1E2028] border border-[#7C6FFF]/40 text-[#F8F7F4] rounded-xl px-3 py-2 text-lg font-medium outline-none mb-1"
              />
            ) : (
              <h2
                onClick={() => isMine && setEditingTitle(true)}
                className={`text-lg font-medium text-[#F8F7F4] mb-1 ${isMine ? 'cursor-pointer hover:text-[#7C6FFF] transition-colors' : ''}`}
                title={isMine ? 'Clic para renombrar' : ''}
              >
                {project.title}
              </h2>
            )}
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono ${vis.color}`}>{vis.icon} {vis.label}</span>
              <span className="text-[#252830]">·</span>
              <span className="text-xs font-mono text-[#555966]">
                {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
              </span>
            </div>
          </div>

          {isMine && (
            <div className="bg-[#1E2028] border border-white/[0.06] rounded-xl p-3">
              <p className="text-[#555966] text-xs font-mono mb-2 uppercase tracking-wider">Visibilidad</p>
              <div className="flex flex-col gap-1">
                {Object.entries(VISIBILITY_CONFIG).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => handleVisibilityChange(key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                      project.visibility === key
                        ? 'bg-[#7C6FFF]/10 text-[#7C6FFF] border border-[#7C6FFF]/20'
                        : 'text-[#9BA0AD] hover:bg-white/[0.03]'
                    }`}
                  >
                    <span>{cfg.icon}</span>
                    <span className="font-medium">{cfg.label}</span>
                    {project.visibility === key && (
                      <svg className="ml-auto" width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="#7C6FFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isMine && (project.visibility === 'link' || project.visibility === 'public') && (
            <button
              onClick={handleCopyLink}
              className={`w-full flex items-center justify-center gap-2 font-medium px-4 py-2.5 rounded-xl text-sm transition-all ${
                copied
                  ? 'bg-[#1D9E75]/10 border border-[#1D9E75]/20 text-[#1D9E75]'
                  : 'bg-[#7C6FFF]/10 hover:bg-[#7C6FFF]/20 border border-[#7C6FFF]/20 text-[#7C6FFF]'
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

          {!isMine && (
            <div className="flex items-center gap-2 px-3 py-2 bg-[#7C6FFF]/5 border border-[#7C6FFF]/15 rounded-xl">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="#7C6FFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-[#7C6FFF] text-xs font-mono">Guardado en tu biblioteca</span>
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
            <div className="bg-[#0d0d0f] border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                <span className="text-[#555966] text-xs font-mono uppercase tracking-wider">Tracklist</span>
                <span className="text-[#555966] text-xs font-mono">
                  {tracks.length} {tracks.length === 1 ? 'canción' : 'canciones'}
                </span>
              </div>
              {tracks.map((track, i) => {
                const isPlaying = currentTrack?.id === track.id
                return (
                  <div key={track.id}>
                    <div
                      className={`flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0 group transition-colors ${
                        isPlaying ? 'bg-[#7C6FFF]/5' : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <button
                        onClick={() => isPlaying
                          ? closePlayer()
                          : playTrack({ id: track.id, title: track.title, file_path: track.file_path, projectTitle: project.title })
                        }
                        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                          isPlaying
                            ? 'bg-[#7C6FFF] text-white'
                            : 'bg-[#1E2028] text-[#555966] group-hover:bg-[#252830] group-hover:text-[#9BA0AD]'
                        }`}
                      >
                        {isPlaying ? (
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="white">
                            <rect x="0.5" y="0.5" width="2.5" height="7" rx="0.5"/>
                            <rect x="5" y="0.5" width="2.5" height="7" rx="0.5"/>
                          </svg>
                        ) : (
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
                            <path d="M1.5 1l5.5 3-5.5 3V1z"/>
                          </svg>
                        )}
                      </button>

                      <span className="text-[#252830] font-mono text-xs w-4 text-right flex-shrink-0 group-hover:text-[#555966] transition-colors">
                        {i + 1}
                      </span>

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate transition-colors ${
                          isPlaying ? 'text-[#7C6FFF]' : 'text-[#F8F7F4]'
                        }`}>
                          {track.title}
                        </p>
                      </div>

                      {/* Menú 3 puntos */}
                      {isMine && (
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowTrackMenu(showTrackMenu === track.id ? null : track.id)
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-[#555966] hover:text-[#9BA0AD] p-1"
                          >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <circle cx="7" cy="2" r="1" fill="currentColor"/>
                              <circle cx="7" cy="7" r="1" fill="currentColor"/>
                              <circle cx="7" cy="12" r="1" fill="currentColor"/>
                            </svg>
                          </button>
                          {showTrackMenu === track.id && (
                            <div className="absolute right-0 top-6 bg-[#1E2028] border border-white/[0.08] rounded-xl shadow-xl z-20 py-1 min-w-[140px]">
                              <button
                                onClick={() => {
                                  setEditingTrackId(track.id)
                                  setEditingTrackName(track.title)
                                  setShowTrackMenu(null)
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#9BA0AD] hover:text-[#F8F7F4] hover:bg-white/[0.04] transition-colors text-left"
                              >
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                  <path d="M8 1l3 3-7 7H1V8L8 1z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Renombrar
                              </button>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(`${window.location.origin}/p/${project.share_slug}`)
                                  setShowTrackMenu(null)
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#9BA0AD] hover:text-[#F8F7F4] hover:bg-white/[0.04] transition-colors text-left"
                              >
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                  <path d="M4 2H2a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                                  <path d="M7 1h4v4M11 1L5 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Compartir
                              </button>
                              <div className="h-px bg-white/[0.06] my-1"/>
                              <button
                                onClick={() => handleDeleteTrack(track.id)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/5 transition-colors text-left"
                              >
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                  <path d="M2 3h8M4 3V2h4v1M5 5v4M7 5v4M3 3l.5 7h5L9 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Eliminar
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Input renombrar inline */}
                    {editingTrackId === track.id && (
                      <div className="px-4 py-2 bg-[#111318] border-b border-white/[0.04]">
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
            <div className="border border-dashed border-white/[0.06] rounded-xl p-8 text-center">
              <p className="text-[#555966] text-sm font-mono">Sin canciones todavía.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
