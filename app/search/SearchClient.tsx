'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { usePlayer } from '@/lib/PlayerContext'

interface Result {
  id:         string
  title:      string
  file_path:  string
  project_id: string
  projects:   { title: string; share_slug: string } | null
}

export default function SearchClient({ userId }: { userId: string }) {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const { playTrack, currentTrack } = usePlayer()
  const supabase = createClient()

  const handleSearch = async (q: string) => {
    setQuery(q)
    if (q.length < 2) { setResults([]); return }
    setLoading(true)
    const { data } = await supabase
      .from('tracks')
      .select('id, title, file_path, project_id, projects(title, share_slug)')
      .ilike('title', `%${q}%`)
      .limit(20)
    setResults((data as any) ?? [])
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0d0d0f]">
      <nav className="h-12 border-b border-white/[0.05] flex items-center justify-between px-5 sticky top-0 z-50 bg-[#0d0d0f]/90 backdrop-blur-md">
        <a href="/dashboard" className="font-mono text-base font-medium tracking-tight hover:opacity-80 transition-opacity">
          demo<span className="text-[#7C6FFF]">.</span>
        </a>
        <a href="/dashboard" className="text-[#9BA0AD] hover:text-[#F8F7F4] text-sm transition-colors">← Volver</a>
      </nav>

      <main className="max-w-2xl mx-auto px-5 py-8">
        <h1 className="text-xl font-medium text-[#F8F7F4] mb-6">Buscar canciones</h1>

        <div className="relative mb-6">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.3"/>
              <path d="M11 11l3 3" stroke="rgba(255,255,255,0.3)" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </div>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Nombre de la canción..."
            className="w-full bg-[#1E2028] border border-white/[0.08] focus:border-[#7C6FFF]/40 text-[#F8F7F4] placeholder:text-[#333] rounded-xl pl-11 pr-4 py-3 text-sm outline-none transition-colors"
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-white/20 border-t-[#7C6FFF] rounded-full animate-spin"/>
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div className="card-elevated rounded-xl overflow-hidden">
            {results.map((track, i) => {
              const proj = track.projects as any
              const isPlaying = currentTrack?.id === track.id
              return (
                <div
                  key={track.id}
                  onClick={() => playTrack({ id: track.id, title: track.title, file_path: track.file_path, projectTitle: proj?.title })}
                  className={`flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0 cursor-pointer group transition-colors ${
                    isPlaying ? 'bg-[#7C6FFF]/5' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                    isPlaying ? 'bg-[#7C6FFF]' : 'bg-[#1E2028] group-hover:bg-[#252830]'
                  }`}>
                    <svg width="8" height="8" viewBox="0 0 8 8" fill={isPlaying ? 'white' : 'rgba(255,255,255,0.4)'}>
                      <path d="M1.5 1l5.5 3-5.5 3V1z"/>
                    </svg>
                  </div>
                  <span className="text-[#333] font-mono text-xs w-4 text-right flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isPlaying ? 'text-[#7C6FFF]' : 'text-[#F8F7F4]'}`}>{track.title}</p>
                    {proj?.title && <p className="text-xs text-[#555966] font-mono truncate">{proj.title}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {query.length >= 2 && results.length === 0 && !loading && (
          <p className="text-[#555966] text-sm font-mono text-center py-8">Sin resultados para "{query}"</p>
        )}
      </main>
    </div>
  )
}
