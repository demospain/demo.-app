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
  const [project, setProject]   = useState(initialProject)
  const [tracks, setTracks]     = useState<Track[]>(initialTracks)
  const [copied, setCopied]     = useState(false)
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
          <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-[#252830] to-[#1a1a20] border border-white/[0.06] flex items-center justify-center overflow-hidden">
            {project.cover_url
              ? <img src={project.cover_url} alt="" className="w-full h-full object-cover"/>
              : <div className="text-6xl opacity-30">💿</div>
            }
          </div>

          <div>
            <h2 className="text-lg font-medium text-[#F8F7F4] mb-1">{project.title}</h2>
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
              {tracks.map((track, i) => {
                const isPlaying = currentTrack?.id === track.id
                return (
                  <div
                    key={track.id}
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

                    <button className="opacity-0 group-hover:opacity-100 transition-opacity text-[#555966] hover:text-[#9BA0AD] p-1">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="2" r="1" fill="currentColor"/>
                        <circle cx="7" cy="7" r="1" fill="currentColor"/>
                        <circle cx="7" cy="12" r="1" fill="currentColor"/>
                      </svg>
                    </button>
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
