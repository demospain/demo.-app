'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { usePlayer } from '@/lib/PlayerContext'

interface Project {
  id:          string
  title:       string
  cover_url:   string | null
  visibility:  string
  status:      string
  created_at:  string
  owner_id?:   string
  share_slug?: string
}

interface DashboardClientProps {
  userId:          string
  userName:        string
  initialProjects: Project[]
  savedProjects:   Project[]
  ownerNames:      Record<string, string>
}

export default function DashboardClient({ userId, userName, initialProjects, savedProjects, ownerNames }: DashboardClientProps) {
  const [projects, setProjects]             = useState<Project[]>(initialProjects)
  const [showNewProject, setShowNewProject] = useState(false)
  const [newTitle, setNewTitle]             = useState('')
  const [creating, setCreating]             = useState(false)
  const [createError, setCreateError]       = useState('')
  const [openMenuId, setOpenMenuId]         = useState<string | null>(null)
  const router   = useRouter()
  const supabase = createClient()
  const { setLibraryUserId } = usePlayer()
  const menuRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  useEffect(() => {
    setLibraryUserId(userId)
  }, [userId])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      let clickedInside = false
      menuRefs.current.forEach(ref => {
        if (ref && ref.contains(e.target as Node)) clickedInside = true
      })
      if (!clickedInside) setOpenMenuId(null)
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler as EventListener, { passive: true })
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler as EventListener)
    }
  }, [])

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    setCreating(true)
    setCreateError('')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setCreateError('Sesión expirada. Recarga la página.'); setCreating(false); return }
    const { data, error } = await supabase
      .from('projects')
      .insert({ title: newTitle.trim(), owner_id: userId, visibility: 'private', status: 'draft' })
      .select().single()
    if (error) { setCreateError(`Error: ${error.message}`); setCreating(false); return }
    if (data) { setNewTitle(''); setShowNewProject(false); router.push(`/dashboard/proyecto/${data.id}`) }
    setCreating(false)
  }


  const isEmpty = projects.length === 0 && savedProjects.length === 0

  const [unsavedIds, setUnsavedIds] = useState<Set<string>>(new Set())

  const handleUnsave = async (projectId: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('saved_projects')
      .delete()
      .eq('user_id', userId)
      .eq('project_id', projectId)
    if (!error) setUnsavedIds(prev => new Set(prev).add(projectId))
    setOpenMenuId(null)
  }

  const ProjectCard = ({ project, ownerName, isSaved }: { project: Project; ownerName: string; isSaved: boolean }) => (
    <div className="text-left group relative">
      <button onClick={() => router.push(`/dashboard/proyecto/${project.id}`)} className="text-left w-full">
        <div className="w-full aspect-square rounded-[14px] bg-[#181c27] border border-white/[0.07] group-hover:border-[#6E62F5]/30 transition-all duration-200 mb-3 flex items-center justify-center relative overflow-hidden">
          {project.cover_url
            ? <img src={project.cover_url} alt="" className="w-full h-full object-cover"/>
            : <div className="text-4xl opacity-25 group-hover:opacity-35 transition-opacity">💿</div>
          }
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200"/>
          {/* Botón play — liquid glass, esquina inferior derecha */}
          <div
            className="absolute bottom-2.5 right-2.5 w-11 h-11 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 scale-90 group-hover:scale-100"
            style={{
              background: 'rgba(255,255,255,0.14)',
              backdropFilter: 'blur(12px) saturate(1.6)',
              WebkitBackdropFilter: 'blur(12px) saturate(1.6)',
              border: '1px solid rgba(255,255,255,0.25)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.3)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M5 3l13 7-13 7V3z" fill="white" fillOpacity="0.95"/>
            </svg>
          </div>
        </div>
        <p className="text-base font-medium text-[#EAE9E6] truncate leading-tight group-hover:text-white transition-colors">{project.title}</p>
        <p className="text-xs font-mono text-[#555966] mt-0.5 truncate">{ownerName}</p>
      </button>

      {isSaved && (
        <div
          className="absolute top-1.5 right-1.5 z-10"
          ref={el => {
            if (el) menuRefs.current.set(project.id, el)
            else menuRefs.current.delete(project.id)
          }}
        >
          <button
            onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === project.id ? null : project.id) }}
            className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-black/80"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="3"  r="1.3" fill="white"/>
              <circle cx="8" cy="8"  r="1.3" fill="white"/>
              <circle cx="8" cy="13" r="1.3" fill="white"/>
            </svg>
          </button>
          {openMenuId === project.id && (
            <div className="absolute right-0 top-8 bg-[#1E2028] border border-white/[0.08] rounded-xl shadow-xl z-50 py-1.5 min-w-[170px]">
              <button
                onClick={e => { e.stopPropagation(); handleUnsave(project.id) }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/5 transition-colors text-left"
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M2 2l9 9M11 2l-9 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                Quitar de biblioteca
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div>
      {showNewProject && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) { setShowNewProject(false); setCreateError('') } }}
        >
          <div className="bg-[#181c27] border border-white/[0.07] rounded-2xl p-6 w-full max-w-sm">
            <p className="font-mono text-xs text-[#555966] uppercase tracking-widest mb-1">Nuevo proyecto</p>
            <h3 className="font-medium text-[#EAE9E6] text-base mb-4">¿Cómo se llama?</h3>
            <form onSubmit={handleCreateProject} className="flex flex-col gap-3">
              <input
                autoFocus type="text" placeholder="EP debut, Maquetas verano 25..."
                value={newTitle} onChange={e => { setNewTitle(e.target.value); setCreateError('') }}
                className="bg-[#0f1117] border border-white/[0.07] focus:border-[#6E62F5]/40 text-[#EAE9E6] placeholder:text-[#2E3140] rounded-xl px-4 py-3 text-sm outline-none transition-colors w-full font-mono"
              />
              {createError && <p className="text-red-400/80 text-xs font-mono">{createError}</p>}
              <div className="flex gap-2 mt-1">
                <button type="button" onClick={() => { setShowNewProject(false); setCreateError('') }}
                  className="flex-1 border border-white/[0.07] text-[#555966] hover:text-[#9BA0AD] py-2.5 rounded-xl text-sm transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={creating || !newTitle.trim()}
                  className="flex-1 bg-[#6E62F5] hover:bg-[#5A4FD4] disabled:opacity-30 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
                  {creating ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#181c27] border border-white/[0.07] flex items-center justify-center text-3xl mb-5">💿</div>
          <h2 className="text-[#EAE9E6] font-medium text-lg mb-2">Tu biblioteca está vacía</h2>
          <p className="text-[#555966] text-sm max-w-xs mb-6 leading-relaxed font-mono">
            Crea tu primer proyecto o guarda música que alguien comparta contigo.
          </p>
          <button onClick={() => setShowNewProject(true)}
            className="bg-[#6E62F5] hover:bg-[#5A4FD4] text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-colors">
            + Nuevo proyecto
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {projects.length > 0 && (
            <div>
              <p className="text-[#EAE9E6] text-lg font-medium mb-5">Mis proyectos</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 items-start">
                {projects.map(project => <ProjectCard key={project.id} project={project} ownerName={ownerNames[project.id] ?? userName} isSaved={false}/>)}
                <button onClick={() => setShowNewProject(true)} className="text-left group">
                  {/* Móvil: botón compacto, no tarjeta cuadrada */}
                  <div className="sm:hidden w-full h-16 rounded-[14px] border-2 border-dashed border-white/[0.07] group-hover:border-[#6E62F5]/30 transition-colors mb-3 flex items-center justify-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                      <path d="M10 3v14M3 10h14" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span className="text-xs text-[#2E3140] group-hover:text-[#555966] transition-colors font-mono">Nuevo proyecto</span>
                  </div>
                  {/* Desktop: tarjeta cuadrada */}
                  <div className="hidden sm:flex w-full aspect-square rounded-[14px] border-2 border-dashed border-white/[0.07] group-hover:border-[#6E62F5]/30 transition-colors mb-3 items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M10 3v14M3 10h14" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <p className="hidden sm:block text-xs text-[#2E3140] group-hover:text-[#555966] transition-colors font-mono">Nuevo proyecto</p>
                </button>
              </div>
            </div>
          )}

          {savedProjects.filter(p => !unsavedIds.has(p.id)).length > 0 && (
            <div>
              <p className="text-[#EAE9E6] text-lg font-medium mb-5">Guardado</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 items-start">
                {savedProjects.filter(p => !unsavedIds.has(p.id)).map(project => (
                  <ProjectCard key={project.id} project={project} ownerName={ownerNames[project.id] ?? 'Artista'} isSaved={true}/>
                ))}
              </div>
            </div>
          )}

          {projects.length === 0 && savedProjects.length > 0 && (
            <button onClick={() => setShowNewProject(true)}
              className="flex items-center gap-2 text-[#555966] hover:text-[#9BA0AD] text-sm font-mono transition-colors">
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
