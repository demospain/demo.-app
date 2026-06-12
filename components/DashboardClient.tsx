'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import UploadTrack from '@/components/UploadTrack'
import AudioPlayer from '@/components/AudioPlayer'

interface Project {
  id:          string
  title:       string
  cover_url:   string | null
  visibility:  string
  status:      string
  created_at:  string
  share_slug?: string
}

interface Track {
  id:        string
  title:     string
  file_path: string
}

interface DashboardClientProps {
  userId:          string
  initialProjects: Project[]
  savedProjects:   Project[]
}

const VISIBILITY_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  private: { label: 'Privado',  icon: '🔒', color: 'text-[#555966]' },
  link:    { label: 'Con link', icon: '🔗', color: 'text-[#F59E0B]' },
  public:  { label: 'Público',  icon: '🌍', color: 'text-[#1D9E75]' },
}

export default function DashboardClient({ userId, initialProjects, savedProjects }: DashboardClientProps) {
  const [projects, setProjects]             = useState<Project[]>(initialProjects)
  const [showNewProject, setShowNewProject] = useState(false)
  const [newTitle, setNewTitle]             = useState('')
  const [creating, setCreating]             = useState(false)
  const [createError, setCreateError]       = useState('')
  const [activeProject, setActiveProject]   = useState<Project | null>(null)
  const [activeSource, setActiveSource]     = useState<'mine' | 'saved'>('mine')
  const [tracks, setTracks]                 = useState<Track[]>([])
  const [playingTrack, setPlayingTrack]     = useState<Track | null>(null)
  const [copied, setCopied]                 = useState(false)
  const [tab, setTab]                       = useState<'projects' | 'library'>('projects')
  const supabase = createClient()

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    setCreating(true)
    setCreateError('')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setCreateError('Sesión expirada. Recarga la página.')
      setCreating(false)
      return
    }

    const { data, error } = await supabase
      .from('projects')
      .insert({ title: newTitle.trim(), owner_id: userId, visibility: 'private', status: 'draft' })
      .select()
      .single()

    if (error) {
      setCreateError(`Error: ${error.message}`)
      setCreating(false)
      return
    }

    if (data) {
      setProjects(prev => [data, ...prev])
      setNewTitle('')
      setShowNewProject(false)
      setActiveProject(data)
      setActiveSource('mine')
      setTracks([])
    }
    setCreating(false)
  }

  const openProject = async (project: Project, source: 'mine' | 'saved') => {
    const { data: full } = await supabase
      .from('projects')
      .select('id, title, cover_url, visibility, status, created_at, share_slug')
      .eq('id', project.id)
      .single()
    setActiveProject(full ?? project)
    setActiveSource(source)
    const { data } = await supabase
      .from('tracks')
      .select('id, title, file_path')
      .eq('project_id', project.id)
      .order('track_order', { ascending: true })
    setTracks(data ?? [])
  }

  const handleCopyLink = () => {
    if (!activeProject?.share_slug) return
    navigator.clipboard.writeText(`${window.location.origin}/p/${activeProject.share_slug}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleVisibilityChange = async (key: string) => {
    if (!activeProject) return
    await supabase.from('projects').update({ visibility: key }).eq('id', activeProject.id)
    setActiveProject(prev => prev ? { ...prev, visibility: key } : null)
  }

  // ── VISTA PROYECTO ───────────────────────────────────────────
  if (activeProject) {
    const vis = VISIBILITY_CONFIG[activeProject.visibility] ?? VISIBILITY_CONFIG.private
    const isMine = activeSource === 'mine'

    return (
      <div className={playingTrack ? 'pb-36' : ''}>

        {/* Breadcrumb */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => { setActiveProject(null); setPlayingTrack(null) }}
            className="w-8 h-8 rounded-lg bg-[#1E2028] hover:bg-[#252830] border border-white/[0.06] flex items-center justify-center transition-colors flex-shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <span className="text-[#555966] text-sm font-mono">
            {isMine ? 'Mis proyectos' : 'Biblioteca'}
          </span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4 2l4 4-4 4" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <span className="text-[#F8F7F4] text-sm font-medium truncate">{activeProject.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">

          {/* Columna izquierda */}
          <div className="flex flex-col gap-4">
            <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-[#252830] to-[#1a1a20] border border-white/[0.06] flex items-center justify-center">
              <div className="text-6xl opacity-30">💿</div>
            </div>

            <div>
              <h2 className="text-lg font-medium text-[#F8F7F4] mb-1">{activeProject.title}</h2>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono ${vis.color}`}>{vis.icon} {vis.label}</span>
                <span className="text-[#252830]">·</span>
                <span className="text-xs font-mono text-[#555966]">
                  {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
                </span>
              </div>
            </div>

            {/* Visibilidad — solo si es mío */}
            {isMine && (
              <div className="bg-[#1E2028] border border-white/[0.06] rounded-xl p-3">
                <p className="text-[#555966] text-xs font-mono mb-2 uppercase tracking-wider">Visibilidad</p>
                <div className="flex flex-col gap-1">
                  {Object.entries(VISIBILITY_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => handleVisibilityChange(key)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                        activeProject.visibility === key
                          ? 'bg-[#7C6FFF]/10 text-[#7C6FFF] border border-[#7C6FFF]/20'
                          : 'text-[#9BA0AD] hover:bg-white/[0.03]'
                      }`}
                    >
                      <span>{cfg.icon}</span>
                      <span className="font-medium">{cfg.label}</span>
                      {activeProject.visibility === key && (
                        <svg className="ml-auto" width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2.5 2.5L8 3" stroke="#7C6FFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Botón compartir */}
            {isMine && (activeProject.visibility === 'link' || activeProject.visibility === 'public') && (
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

            {/* Etiqueta guardado — si es de biblioteca */}
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

            {/* Upload solo si es mío */}
            {isMine && (
              <UploadTrack
                projectId={activeProject.id}
                onUploadComplete={(track) => setTracks(prev => [...prev, track])}
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
                {tracks.map((track, i) => (
                  <div
                    key={track.id}
                    className={`flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0 group transition-colors ${
                      playingTrack?.id === track.id ? 'bg-[#7C6FFF]/5' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <button
                      onClick={() => setPlayingTrack(playingTrack?.id === track.id ? null : track)}
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        playingTrack?.id === track.id
                          ? 'bg-[#7C6FFF] text-white'
                          : 'bg-[#1E2028] text-[#555966] group-hover:bg-[#252830] group-hover:text-[#9BA0AD]'
                      }`}
                    >
                      {playingTrack?.id === track.id ? (
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
                        playingTrack?.id === track.id ? 'text-[#7C6FFF]' : 'text-[#F8F7F4]'
                      }`}>
                        {track.title}
                      </p>
                    </div>

                    <button className="opacity-0 group-hover:opacity-100 transition-opacity text-[#555966] hover:text-[#9BA0AD] p-1">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="2" r="1" fill="currentColor"/>
                        <circle cx="7" cy="7" r="1" fill="currentColor"/>
                        <circle cx="7" cy="12" r="1" fill="currentColor"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {tracks.length === 0 && !isMine && (
              <div className="border border-dashed border-white/[0.06] rounded-xl p-8 text-center">
                <p className="text-[#555966] text-sm font-mono">Sin canciones todavía.</p>
              </div>
            )}
          </div>
        </div>

        {playingTrack && (
          <AudioPlayer
            trackId={playingTrack.id}
            filePath={playingTrack.file_path}
            title={playingTrack.title}
            onClose={() => setPlayingTrack(null)}
          />
        )}
      </div>
    )
  }

  // ── GRID PRINCIPAL ───────────────────────────────────────────
  return (
    <div>

      {/* Modal nuevo proyecto */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E2028] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-medium text-[#F8F7F4] mb-1">Nuevo proyecto</h3>
            <p className="text-[#555966] text-xs font-mono mb-4">Empieza con un nombre. Puedes cambiarlo después.</p>
            <form onSubmit={handleCreateProject} className="flex flex-col gap-3">
              <input
                autoFocus
                type="text"
                placeholder="Ej: EP debut, Maquetas verano 25..."
                value={newTitle}
                onChange={e => { setNewTitle(e.target.value); setCreateError('') }}
                className="bg-[#111318] border border-white/[0.08] focus:border-[#7C6FFF]/50 text-[#F8F7F4] placeholder:text-[#333] rounded-xl px-4 py-3 text-sm outline-none transition-colors w-full"
              />
              {createError && <p className="text-red-400 text-xs font-mono">{createError}</p>}
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => { setShowNewProject(false); setCreateError('') }}
                  className="flex-1 border border-white/[0.08] text-[#9BA0AD] hover:text-[#F8F7F4] py-2.5 rounded-xl text-sm transition-colors hover:border-white/20"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating || !newTitle.trim()}
                  className="flex-1 bg-[#7C6FFF] hover:bg-[#4A3FCC] text-white py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-40"
                >
                  {creating ? 'Creando...' : 'Crear proyecto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabs — Mis proyectos / Biblioteca */}
      <div className="flex items-center gap-1 mb-6 bg-[#1E2028] rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab('projects')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'projects'
              ? 'bg-[#0d0d0f] text-[#F8F7F4] shadow-sm'
              : 'text-[#555966] hover:text-[#9BA0AD]'
          }`}
        >
          Mis proyectos
        </button>
        <button
          onClick={() => setTab('library')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            tab === 'library'
              ? 'bg-[#0d0d0f] text-[#F8F7F4] shadow-sm'
              : 'text-[#555966] hover:text-[#9BA0AD]'
          }`}
        >
          Biblioteca
          {savedProjects.length > 0 && (
            <span className="bg-[#7C6FFF]/20 text-[#7C6FFF] text-xs font-mono px-1.5 py-0.5 rounded-md">
              {savedProjects.length}
            </span>
          )}
        </button>
      </div>

      {/* ── TAB: MIS PROYECTOS ── */}
      {tab === 'projects' && (
        <div>
          {projects.length > 0 && (
            <div className="flex items-center justify-between mb-5">
              <p className="text-[#555966] text-xs font-mono">
                {projects.length} {projects.length === 1 ? 'proyecto' : 'proyectos'}
              </p>
              <button
                onClick={() => setShowNewProject(true)}
                className="flex items-center gap-2 bg-[#7C6FFF] hover:bg-[#4A3FCC] text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1v10M1 6h10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Nuevo
              </button>
            </div>
          )}

          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#1E2028] border border-[#7C6FFF]/10 flex items-center justify-center text-3xl mb-5">
                💿
              </div>
              <h2 className="text-[#F8F7F4] font-medium text-lg mb-2">Sin proyectos todavía</h2>
              <p className="text-[#555966] text-sm max-w-xs mb-6 leading-relaxed">
                Crea tu primer proyecto y empieza a subir canciones.
              </p>
              <button
                onClick={() => setShowNewProject(true)}
                className="bg-[#7C6FFF] hover:bg-[#4A3FCC] text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-colors"
              >
                + Nuevo proyecto
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {projects.map(project => {
                const vis = VISIBILITY_CONFIG[project.visibility] ?? VISIBILITY_CONFIG.private
                return (
                  <button key={project.id} onClick={() => openProject(project, 'mine')} className="text-left group">
                    <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-[#1E2028] to-[#16171c] border border-white/[0.06] group-hover:border-[#7C6FFF]/25 transition-all duration-200 mb-2.5 flex items-center justify-center relative overflow-hidden">
                      <div className="text-4xl opacity-20 group-hover:opacity-30 transition-opacity">💿</div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
                      <div className="absolute bottom-2.5 right-2.5 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="white"><path d="M1.5 1l5.5 3-5.5 3V1z"/></svg>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-[#F8F7F4] truncate leading-tight">{project.title}</p>
                    <p className={`text-xs font-mono mt-0.5 ${vis.color}`}>{vis.label}</p>
                  </button>
                )
              })}
              <button onClick={() => setShowNewProject(true)} className="text-left group">
                <div className="w-full aspect-square rounded-xl border-2 border-dashed border-white/[0.06] group-hover:border-[#7C6FFF]/30 transition-colors mb-2.5 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 3v14M3 10h14" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="text-xs text-[#333] group-hover:text-[#555966] transition-colors font-mono">Nuevo proyecto</p>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: BIBLIOTECA ── */}
      {tab === 'library' && (
        <div>
          {savedProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#1E2028] border border-[#7C6FFF]/10 flex items-center justify-center text-3xl mb-5">
                🎧
              </div>
              <h2 className="text-[#F8F7F4] font-medium text-lg mb-2">Tu biblioteca está vacía</h2>
              <p className="text-[#555966] text-sm max-w-xs leading-relaxed">
                Cuando alguien te comparta música y la guardes, aparecerá aquí.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-[#555966] text-xs font-mono mb-5">
                {savedProjects.length} {savedProjects.length === 1 ? 'proyecto guardado' : 'proyectos guardados'}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {savedProjects.map(project => {
                  const vis = VISIBILITY_CONFIG[project.visibility] ?? VISIBILITY_CONFIG.private
                  return (
                    <button key={project.id} onClick={() => openProject(project, 'saved')} className="text-left group">
                      <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-[#1E2028] to-[#16171c] border border-white/[0.06] group-hover:border-[#7C6FFF]/25 transition-all duration-200 mb-2.5 flex items-center justify-center relative overflow-hidden">
                        <div className="text-4xl opacity-20 group-hover:opacity-30 transition-opacity">💿</div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
                        <div className="absolute bottom-2.5 right-2.5 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="white"><path d="M1.5 1l5.5 3-5.5 3V1z"/></svg>
                        </div>
                        <div className="absolute top-2 left-2">
                          <div className="bg-black/50 backdrop-blur-sm rounded-md px-1.5 py-0.5">
                            <span className="text-[#7C6FFF] text-xs font-mono">guardado</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-[#F8F7F4] truncate leading-tight">{project.title}</p>
                      <p className={`text-xs font-mono mt-0.5 ${vis.color}`}>{vis.label}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
