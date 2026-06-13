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

export default function DashboardClient({ userId, initialProjects, savedProjects }: DashboardClientProps) {
  const [projects, setProjects]             = useState<Project[]>(initialProjects)
  const [showNewProject, setShowNewProject] = useState(false)
  const [newTitle, setNewTitle]             = useState('')
  const [creating, setCreating]             = useState(false)
  const [createError, setCreateError]       = useState('')
  const router   = useRouter()
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

  const allProjects = [...projects, ...savedProjects]
  const isEmpty     = allProjects.length === 0

  return (
    <div className="flex flex-col min-h-[60vh]">

      {/* Modal nuevo proyecto */}
      {showNewProject && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) { setShowNewProject(false); setCreateError('') } }}
        >
          <div className="bg-[#13141a] border border-white/[0.07] rounded-2xl p-6 w-full max-w-sm">
            <p className="font-mono text-xs text-[#555966] uppercase tracking-widest mb-1">Nuevo proyecto</p>
            <h3 className="font-medium text-[#F8F7F4] text-base mb-4">¿Cómo se llama?</h3>
            <form onSubmit={handleCreateProject} className="flex flex-col gap-3">
              <input
                autoFocus
                type="text"
                placeholder="EP debut, Maquetas verano 25..."
                value={newTitle}
                onChange={e => { setNewTitle(e.target.value); setCreateError('') }}
                className="bg-[#0d0d0f] border border-white/[0.06] focus:border-[#7C6FFF]/40 text-[#F8F7F4] placeholder:text-[#2E3140] rounded-xl px-4 py-3 text-sm outline-none transition-colors w-full font-mono"
              />
              {createError && <p className="text-red-400/80 text-xs font-mono">{createError}</p>}
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
            + Nuevo proyecto
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-10 pb-24">

          {/* Mis proyectos */}
          {projects.length > 0 && (
            <section>
              <p className="text-xs font-mono text-[#555966] uppercase tracking-widest mb-6">Mis proyectos</p>
              <div className="flex flex-wrap justify-center gap-5">
                {projects.map(project => (
                  <button
                    key={project.id}
                    onClick={() => router.push(`/dashboard/proyecto/${project.id}`)}
                    className="text-left group w-[160px] flex-shrink-0"
                  >
                    <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-[#1E2028] to-[#16171c] border border-white/[0.06] group-hover:border-[#7C6FFF]/25 transition-all duration-200 mb-3 flex items-center justify-center relative overflow-hidden">
                      {project.cover_url
                        ? <img src={project.cover_url} alt="" className="w-full h-full object-cover"/>
                        : <div className="text-4xl opacity-20 group-hover:opacity-30 transition-opacity">💿</div>
                      }
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                        <div className="w-9 h-9 rounded-full bg-[#7C6FFF]/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-150 scale-90 group-hover:scale-100">
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="white">
                            <path d="M2 1.5l7 4-7 4V1.5z"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                    <p className="text-base font-medium text-[#D4D3CF] truncate leading-tight group-hover:text-[#F8F7F4] transition-colors">
                      {project.title}
                    </p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Guardado */}
          {savedProjects.length > 0 && (
            <section>
              <p className="text-xs font-mono text-[#555966] uppercase tracking-widest mb-6">Guardado</p>
              <div className="flex flex-wrap justify-center gap-5">
                {savedProjects.map(project => (
                  <button
                    key={project.id}
                    onClick={() => router.push(`/dashboard/proyecto/${project.id}`)}
                    className="text-left group w-[160px] flex-shrink-0"
                  >
                    <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-[#1E2028] to-[#16171c] border border-white/[0.06] group-hover:border-[#7C6FFF]/25 transition-all duration-200 mb-3 flex items-center justify-center relative overflow-hidden">
                      {project.cover_url
                        ? <img src={project.cover_url} alt="" className="w-full h-full object-cover"/>
                        : <div className="text-4xl opacity-20 group-hover:opacity-30 transition-opacity">💿</div>
                      }
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                        <div className="w-9 h-9 rounded-full bg-[#7C6FFF]/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-150 scale-90 group-hover:scale-100">
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="white">
                            <path d="M2 1.5l7 4-7 4V1.5z"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                    <p className="text-base font-medium text-[#D4D3CF] truncate leading-tight group-hover:text-[#F8F7F4] transition-colors">
                      {project.title}
                    </p>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Botón + Nuevo fijo abajo */}
      {!isEmpty && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
          <button
            onClick={() => setShowNewProject(true)}
            className="flex items-center gap-2 bg-[#1E2028] hover:bg-[#252830] border border-white/[0.1] text-[#F8F7F4] font-medium px-5 py-2.5 rounded-full text-sm transition-colors shadow-xl"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Nuevo proyecto
          </button>
        </div>
      )}
    </div>
  )
}
