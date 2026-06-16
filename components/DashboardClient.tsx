'use client'

import { useState } from 'react'
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
  const [shuffleLoading, setShuffleLoading] = useState(false)
  const router   = useRouter()
  const supabase = createClient()
  const { shuffleMode, playShuffledLibrary } = usePlayer()

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

  const handleShuffleLibrary = async () => {
    if (shuffleMode === 'library') { playShuffledLibrary([]); return }
    setShuffleLoading(true)
    const { data } = await supabase
      .from('tracks')
      .select('id, title, file_path, projects!inner(id, title, cover_url)')
      .in('projects.id', [...projects, ...savedProjects].map(p => p.id))
      .limit(500)
    setShuffleLoading(false)
    if (!data || data.length === 0) return
    const allTracks = data.map((t: any) => ({
      id:           t.id,
      title:        t.title,
      file_path:    t.file_path,
      projectTitle: t.projects?.title ?? undefined,
      coverUrl:     t.projects?.cover_url
        ? `https://pub-5ad091444ab84f6e979864f025aa8867.r2.dev/${t.projects.cover_url}`
        : undefined,
    }))
    playShuffledLibrary(allTracks)
  }

  const isEmpty = projects.length === 0 && savedProjects.length === 0

  const ProjectCard = ({ project, ownerName }: { project: Project; ownerName: string }) => (
    <button onClick={() => router.push(`/dashboard/proyecto/${project.id}`)} className="text-left group">
      <div className="w-full aspect-square rounded-[14px] bg-[#181c27] border border-white/[0.07] group-hover:border-[#6E62F5]/30 transition-all duration-200 mb-3 flex items-center justify-center relative overflow-hidden">
        {project.cover_url
          ? <img src={project.cover_url} alt="" className="w-full h-full object-cover"/>
          : <div className="text-4xl opacity-25 group-hover:opacity-35 transition-opacity">💿</div>
        }
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
          <div className="w-9 h-9 rounded-full bg-[#6E62F5] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-150 scale-90 group-hover:scale-100">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="white"><path d="M2 1.5l7 4-7 4V1.5z"/></svg>
          </div>
        </div>
      </div>
      <p className="text-base font-medium text-[#EAE9E6] truncate leading-tight group-hover:text-white transition-colors">{project.title}</p>
      <p className="text-xs font-mono text-[#555966] mt-0.5 truncate">{ownerName}</p>
    </button>
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
              <div className="flex items-center justify-between mb-5">
                <p className="text-[#EAE9E6] text-lg font-medium">Mis proyectos</p>
                {(projects.length > 0 || savedProjects.length > 0) && (
                  <button
                    onClick={handleShuffleLibrary}
                    disabled={shuffleLoading}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                      shuffleMode === 'library'
                        ? 'bg-[#6E62F5]/20 text-[#7C6FFF] border border-[#6E62F5]/30'
                        : 'bg-white/[0.04] text-[#555966] hover:text-[#9BA0AD] border border-white/[0.06]'
                    }`}
                  >
                    {shuffleLoading ? (
                      <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"/>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                        <path d="M2 4h3l7 8h2M14 4h-2l-2-2M14 12l-2 2M2 12h3l2-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                    {shuffleMode === 'library' ? 'Aleatorio activo' : 'Aleatorio biblioteca'}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 items-start">
                {projects.map(project => <ProjectCard key={project.id} project={project} ownerName={userName}/>)}
                <button onClick={() => setShowNewProject(true)} className="text-left group">
                  <div className="w-full aspect-square rounded-[14px] border-2 border-dashed border-white/[0.07] group-hover:border-[#6E62F5]/30 transition-colors mb-3 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M10 3v14M3 10h14" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <p className="text-xs text-[#2E3140] group-hover:text-[#555966] transition-colors font-mono">Nuevo proyecto</p>
                </button>
              </div>
            </div>
          )}

          {savedProjects.length > 0 && (
            <div>
              <p className="text-[#EAE9E6] text-lg font-medium mb-5">Guardado</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 items-start">
                {savedProjects.map(project => (
                  <ProjectCard key={project.id} project={project}
                    ownerName={project.owner_id ? (ownerNames[project.owner_id] ?? 'Artista') : 'Artista'}/>
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
