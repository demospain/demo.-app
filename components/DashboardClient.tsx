'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import UploadTrack from '@/components/UploadTrack'

interface Project {
  id:         string
  title:      string
  cover_url:  string | null
  visibility: string
  status:     string
  created_at: string
}

interface Track {
  id:        string
  title:     string
  file_path: string
}

interface DashboardClientProps {
  userId:          string
  initialProjects: Project[]
}

export default function DashboardClient({ userId, initialProjects }: DashboardClientProps) {
  const [projects, setProjects]           = useState<Project[]>(initialProjects)
  const [showNewProject, setShowNewProject] = useState(false)
  const [newTitle, setNewTitle]           = useState('')
  const [creating, setCreating]           = useState(false)
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [tracks, setTracks]               = useState<Track[]>([])
  const supabase                          = createClient()

  // Crear nuevo proyecto
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    setCreating(true)

    const { data, error } = await supabase
      .from('projects')
      .insert({ title: newTitle.trim(), owner_id: userId })
      .select()
      .single()

    if (!error && data) {
      setProjects(prev => [data, ...prev])
      setNewTitle('')
      setShowNewProject(false)
      setActiveProject(data)
      setTracks([])
    }
    setCreating(false)
  }

  // Abrir proyecto y cargar sus tracks
  const openProject = async (project: Project) => {
    setActiveProject(project)
    const { data } = await supabase
      .from('tracks')
      .select('id, title, file_path')
      .eq('project_id', project.id)
      .order('track_order', { ascending: true })
    setTracks(data ?? [])
  }

  const visibilityLabel: Record<string, string> = {
    private: '🔒 Privado',
    link:    '🔗 Con link',
    public:  '🌍 Público',
  }

  // ── VISTA DE PROYECTO ABIERTO ────────────────────────────────
  if (activeProject) {
    return (
      <div>
        <button
          onClick={() => setActiveProject(null)}
          className="flex items-center gap-2 text-[#9BA0AD] hover:text-[#F8F7F4] text-sm mb-6 transition-colors"
        >
          ← Volver a proyectos
        </button>

        <div className="flex items-start gap-4 mb-8">
          {/* Portada placeholder */}
          <div className="w-20 h-20 rounded-xl bg-[#1E2028] border border-white/10 flex items-center justify-center text-2xl flex-shrink-0">
            💿
          </div>
          <div>
            <h2 className="text-xl font-medium">{activeProject.title}</h2>
            <p className="text-[#9BA0AD] text-sm mt-1">
              {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'} · {visibilityLabel[activeProject.visibility]}
            </p>
          </div>
        </div>

        {/* Subir track */}
        <div className="mb-6">
          <UploadTrack
            projectId={activeProject.id}
            onUploadComplete={(track) => setTracks(prev => [...prev, track])}
          />
        </div>

        {/* Lista de tracks */}
        {tracks.length > 0 && (
          <div className="border border-white/[0.06] rounded-xl overflow-hidden">
            {tracks.map((track, i) => (
              <div
                key={track.id}
                className="flex items-center gap-4 px-4 py-3 border-b border-white/[0.06] last:border-0 hover:bg-white/[0.02] transition-colors"
              >
                <span className="font-mono text-xs text-[#555966] w-5 text-right flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#F8F7F4] truncate">{track.title}</p>
                </div>
                <span className="text-[#555966] text-xs font-mono">···</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── GRID DE PROYECTOS ────────────────────────────────────────
  return (
    <div>
      {/* Modal nuevo proyecto */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E2028] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-medium mb-4">Nuevo proyecto</h3>
            <form onSubmit={handleCreateProject} className="flex flex-col gap-3">
              <input
                autoFocus
                type="text"
                placeholder="Nombre del proyecto"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="bg-[#111318] border border-white/10 focus:border-[#7C6FFF]/50 text-[#F8F7F4] placeholder:text-[#555966] rounded-xl px-4 py-3 text-sm outline-none transition-colors"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewProject(false)}
                  className="flex-1 border border-white/10 text-[#9BA0AD] py-2.5 rounded-xl text-sm transition-colors hover:border-white/20"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating || !newTitle.trim()}
                  className="flex-1 bg-[#7C6FFF] hover:bg-[#4A3FCC] text-white py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid */}
      {projects.length === 0 ? (
        <div className="border border-dashed border-white/10 rounded-2xl p-16 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-xl bg-[#1E2028] border border-[#7C6FFF]/20 flex items-center justify-center text-2xl mb-4">
            💿
          </div>
          <h2 className="text-[#F8F7F4] font-medium mb-2">Tu primer proyecto</h2>
          <p className="text-[#9BA0AD] text-sm max-w-xs mb-6">
            Sube canciones, organízalas en un proyecto tipo álbum y compártelas con quien quieras.
          </p>
          <button
            onClick={() => setShowNewProject(true)}
            className="bg-[#7C6FFF] hover:bg-[#4A3FCC] text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            + Nuevo proyecto
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[#9BA0AD] text-sm font-mono">
              {projects.length} {projects.length === 1 ? 'proyecto' : 'proyectos'}
            </p>
            <button
              onClick={() => setShowNewProject(true)}
              className="bg-[#7C6FFF] hover:bg-[#4A3FCC] text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
            >
              + Nuevo
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {projects.map(project => (
              <button
                key={project.id}
                onClick={() => openProject(project)}
                className="text-left group"
              >
                <div className="w-full aspect-square rounded-xl bg-[#1E2028] border border-white/[0.06] group-hover:border-[#7C6FFF]/30 transition-colors mb-2 flex items-center justify-center text-3xl">
                  💿
                </div>
                <p className="text-sm font-medium text-[#F8F7F4] truncate">{project.title}</p>
                <p className="text-xs text-[#555966] font-mono mt-0.5">
                  {visibilityLabel[project.visibility]}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
