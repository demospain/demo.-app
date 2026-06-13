'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Project {
  id:          string
  title:       string
  cover_url:   string | null
  visibility:  string
  status:      string
  created_at:  string
  share_slug?: string
}

interface DashboardClientProps {
  userId:          string
  initialProjects: Project[]
  savedProjects:   Project[]
  nombre:          string
}

const VIS_DOT: Record<string, string> = {
  private: 'bg-[#2E3140]',
  link:    'bg-[#F59E0B]',
  public:  'bg-[#1D9E75]',
}

const VIS_LABEL: Record<string, string> = {
  private: 'Privado',
  link:    'Con link',
  public:  'Público',
}

const VIS_TEXT: Record<string, string> = {
  private: 'text-[#3D4255]',
  link:    'text-[#F59E0B]',
  public:  'text-[#1D9E75]',
}

function ProjectCover({ project, size = 'md' }: { project: Project; size?: 'md' | 'sm' }) {
  const letter = project.title?.charAt(0).toUpperCase() ?? '?'
  // Genera un color de acento consistente basado en el título
  const hues = [258, 220, 170, 30, 340, 190]
  const hue = hues[project.title.charCodeAt(0) % hues.length]

  return project.cover_url ? (
    <img src={project.cover_url} alt="" className="w-full h-full object-cover"/>
  ) : (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ background: `radial-gradient(circle at 35% 35%, hsl(${hue},40%,18%), #0d0d0f)` }}
    >
      <span
        className="font-mono font-medium select-none"
        style={{
          fontSize: size === 'md' ? '28px' : '18px',
          color: `hsl(${hue},60%,65%)`,
          opacity: 0.7,
          letterSpacing: '-0.02em',
        }}
      >
        {letter}
      </span>
    </div>
  )
}

export default function DashboardClient({ userId, initialProjects, savedProjects, nombre }: DashboardClientProps) {
  const [projects, setProjects]             = useState<Project[]>(initialProjects)
  const [showNewProject, setShowNewProject] = useState(false)
  const [newTitle, setNewTitle]             = useState('')
  const [creating, setCreating]             = useState(false)
  const [createError, setCreateError]       = useState('')
  const router  = useRouter()
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
      setNewTitle('')
      setShowNewProject(false)
      router.push(`/dashboard/proyecto/${data.id}`)
    }
    setCreating(false)
  }

  const isEmpty = projects.length === 0 && savedProjects.length === 0

  return (
    <div>

      {/* Modal nuevo proyecto */}
      {showNewProject && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) { setShowNewProject(false); setCreateError('') }}}
        >
          <div className="bg-[#13141a] border border-white/[0.07] rounded-2xl p-6 w-full max-w-sm">
            <p className="font-mono text-xs text-[#555966] uppercase tracking-widest mb-1">Nuevo proyecto</p>
            <h3 className="font-medium text-[#F8F7F4] text-base mb-4 leading-snug">
              ¿Cómo se llama?
            </h3>
            <form onSubmit={handleCreateProject} className="flex flex-col gap-3">
              <input
                autoFocus
                type="text"
                placeholder="EP debut, Maquetas verano 25..."
                value={newTitle}
                onChange={e => { setNewTitle(e.target.value); setCreateError('') }}
                className="bg-[#0d0d0f] border border-white/[0.06] focus:border-[#7C6FFF]/40 text-[#F8F7F4] placeholder:text-[#2E3140] rounded-xl px-4 py-3 text-sm outline-none transition-colors w-full font-mono"
              />
              {createError && (
                <p className="text-red-400/80 text-xs font-mono">{createError}</p>
              )}
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => { setShowNewProject(false); setCreateError('') }}
                  className="flex-1 border border-white/[0.06] text-[#555966] hover:text-[#9BA0AD] py-2.5 rounded-xl text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating || !newTitle.trim()}
                  className="flex-1 bg-[#7C6FFF] hover:bg-[#6B5FE8] disabled:opacity-30 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
                >
                  {creating ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#13141a] border border-white/[0.05] flex items-center justify-center mb-5">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="3" y="3" width="16" height="16" rx="3" stroke="#2E3140" strokeWidth="1.2"/>
              <path d="M11 7.5v7M7.5 11h7" stroke="#7C6FFF" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/>
            </svg>
          </div>
          <h2 className="text-[#F8F7F4] font-medium text-base mb-2">Biblioteca vacía</h2>
          <p className="text-[#383C47] text-xs font-mono max-w-xs mb-7 leading-relaxed">
            Crea tu primer proyecto o guarda música que alguien comparta contigo.
          </p>
          <button
            onClick={() => setShowNewProject(true)}
            className="bg-[#7C6FFF] hover:bg-[#6B5FE8] text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            Nuevo proyecto
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-10">

          {/* Mis proyectos */}
          {projects.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-5">
                <span className="text-xs font-mono text-[#555966] uppercase tracking-widest">Mis proyectos</span>
                <button
                  onClick={() => setShowNewProject(true)}
                  className="flex items-center gap-1.5 text-[#555966] hover:text-[#7C6FFF] text-xs font-mono transition-colors"
                >
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path d="M4.5 1v7M1 4.5h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                  Nuevo
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {projects.map(project => (
                  <button
                    key={project.id}
                    onClick={() => router.push(`/dashboard/proyecto/${project.id}`)}
                    className="text-left group"
                  >
                    <div className="w-full aspect-square rounded-xl border border-white/[0.05] group-hover:border-[#7C6FFF]/20 transition-all duration-200 mb-2.5 overflow-hidden relative">
                      <ProjectCover project={project}/>
                      {/* Overlay hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-[#7C6FFF]/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-150 scale-90 group-hover:scale-100">
                          <svg width="9" height="10" viewBox="0 0 9 10" fill="white">
                            <path d="M1.5 1.5l6 3.5-6 3.5V1.5z"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-[#D4D3CF] truncate leading-tight group-hover:text-[#F8F7F4] transition-colors">
                      {project.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${VIS_DOT[project.visibility] ?? VIS_DOT.private}`}/>
                      <span className={`text-[11px] font-mono ${VIS_TEXT[project.visibility] ?? VIS_TEXT.private}`}>
                        {VIS_LABEL[project.visibility] ?? 'Privado'}
                      </span>
                    </div>
                  </button>
                ))}

                {/* Card añadir */}
                <button onClick={() => setShowNewProject(true)} className="text-left group">
                  <div className="w-full aspect-square rounded-xl border border-dashed border-white/[0.05] group-hover:border-[#7C6FFF]/20 transition-colors mb-2.5 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 2v12M2 8h12" stroke="rgba(255,255,255,0.1)" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <p className="text-[11px] text-[#2E3140] group-hover:text-[#555966] transition-colors font-mono">Nuevo</p>
                </button>
              </div>
            </section>
          )}

          {/* Guardado */}
          {savedProjects.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-5">
                <span className="text-xs font-mono text-[#555966] uppercase tracking-widest">Guardado</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {savedProjects.map(project => (
                  <button
                    key={project.id}
                    onClick={() => router.push(`/dashboard/proyecto/${project.id}`)}
                    className="text-left group"
                  >
                    <div className="w-full aspect-square rounded-xl border border-white/[0.05] group-hover:border-[#7C6FFF]/20 transition-all duration-200 mb-2.5 overflow-hidden relative">
                      <ProjectCover project={project}/>
                      <div className="absolute top-2 left-2">
                        <span className="text-[10px] font-mono text-[#7C6FFF]/70 bg-[#7C6FFF]/10 px-1.5 py-0.5 rounded-md border border-[#7C6FFF]/10">
                          guardado
                        </span>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-[#D4D3CF] truncate leading-tight group-hover:text-[#F8F7F4] transition-colors">
                      {project.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${VIS_DOT[project.visibility] ?? VIS_DOT.private}`}/>
                      <span className={`text-[11px] font-mono ${VIS_TEXT[project.visibility] ?? VIS_TEXT.private}`}>
                        {VIS_LABEL[project.visibility] ?? 'Privado'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Si no tiene proyectos propios pero sí guardados */}
          {projects.length === 0 && savedProjects.length > 0 && (
            <button
              onClick={() => setShowNewProject(true)}
              className="flex items-center gap-2 text-[#383C47] hover:text-[#555966] text-xs font-mono transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              Crear mi primer proyecto
            </button>
          )}
        </div>
      )}
    </div>
  )
}
