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
  const router = useRouter()
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

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#1E2028] border border-[#7C6FFF]/10 flex items-center justify-center text-3xl mb-5">
            💿
          </div>
          <h2 className="text-[#F8F7F4] font-medium text-lg mb-2">Tu biblioteca está vacía</h2>
          <p className="text-[#555966] text-sm max-w-xs mb-6 leading-relaxed">
            Crea tu primer proyecto o guarda música que alguien comparta contigo.
          </p>
          <button
            onClick={() => setShowNewProject(true)}
            className="bg-[#7C6FFF] hover:bg-[#4A3FCC] text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            + Nuevo proyecto
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {projects.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[#F8F7F4] text-sm font-medium">Mis proyectos</p>
                <button
                  onClick={() => setShowNewProject(true)}
                  className="flex items-center gap-1.5 text-[#7C6FFF] hover:text-[#4A3FCC] text-xs font-mono transition-colors"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Nuevo
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {projects.map(project => {
                  const vis = VISIBILITY_CONFIG[project.visibility] ?? VISIBILITY_CONFIG.private
                  return (
                    <button
                      key={project.id}
                      onClick={() => router.push(`/dashboard/proyecto/${project.id}`)}
                      className="text-left group"
                    >
                      <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-[#1E2028] to-[#16171c] border border-white/[0.06] group-hover:border-[#7C6FFF]/25 transition-all duration-200 mb-2.5 flex items-center justify-center relative overflow-hidden">
                        {project.cover_url
                          ? <img src={project.cover_url} alt="" className="w-full h-full object-cover"/>
                          : <div className="text-4xl opacity-20 group-hover:opacity-30 transition-opacity">💿</div>
                        }
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
            </div>
          )}

          {savedProjects.length > 0 && (
            <div>
              <p className="text-[#F8F7F4] text-sm font-medium mb-4">Guardado</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {savedProjects.map(project => {
                  const vis = VISIBILITY_CONFIG[project.visibility] ?? VISIBILITY_CONFIG.private
                  return (
                    <button
                      key={project.id}
                      onClick={() => router.push(`/dashboard/proyecto/${project.id}`)}
                      className="text-left group"
                    >
                      <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-[#1E2028] to-[#16171c] border border-white/[0.06] group-hover:border-[#7C6FFF]/25 transition-all duration-200 mb-2.5 flex items-center justify-center relative overflow-hidden">
                        {project.cover_url
                          ? <img src={project.cover_url} alt="" className="w-full h-full object-cover"/>
                          : <div className="text-4xl opacity-20 group-hover:opacity-30 transition-opacity">💿</div>
                        }
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

          {projects.length === 0 && savedProjects.length > 0 && (
            <button
              onClick={() => setShowNewProject(true)}
              className="flex items-center gap-2 text-[#555966] hover:text-[#9BA0AD] text-sm font-mono transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Crear mi primer proyecto
            </button>
          )}
        </div>
      )}
    </div>
  )
}
