'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'

interface UploadTrackProps {
  projectId: string
  onUploadComplete?: (track: { id: string; title: string; file_path: string }) => void
}

export default function UploadTrack({ projectId, onUploadComplete }: UploadTrackProps) {
  const [dragging, setDragging]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]   = useState(0)
  const [error, setError]         = useState('')
  const inputRef                  = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setError('')
    setUploading(true)
    setProgress(0)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      // Comprobar límite de 50 tracks en total
      const { count, error: countError } = await supabase
        .from('tracks')
        .select('id', { count: 'exact', head: true })
        .eq('uploaded_by', user?.id)

      if (countError) throw new Error(countError.message)

      if ((count ?? 0) >= 50) {
        setError('Has alcanzado el límite de 50 canciones del plan gratuito.')
        setUploading(false)
        return
      }

      const res = await fetch('/api/upload-url', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ fileName: file.name, fileType: file.type, fileSize: file.size }),
      })

      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error || 'Error obteniendo URL de subida')
      }

      const { uploadUrl, filePath } = await res.json()

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100))
        }
        xhr.onload  = () => xhr.status === 200 ? resolve() : reject(new Error(`Error ${xhr.status}`))
        xhr.onerror = () => reject(new Error('Error de red al subir'))
        xhr.open('PUT', uploadUrl)
        xhr.setRequestHeader('Content-Type', file.type)
        xhr.send(file)
      })

      const title = file.name.replace(/\.[^/.]+$/, '')

      const { data: track, error: dbError } = await supabase
        .from('tracks')
        .insert({
          project_id:  projectId,
          title,
          file_path:   filePath,
          file_size:   file.size,
          format:      file.name.split('.').pop()?.toLowerCase(),
          track_order: 0,
          uploaded_by: user?.id,
        })
        .select()
        .single()

      if (dbError) throw new Error(dbError.message)

      setProgress(100)
      onUploadComplete?.(track)

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setUploading(false)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div
      onClick={() => !uploading && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`
        relative border border-dashed rounded-xl p-5 transition-all cursor-pointer
        ${dragging ? 'border-[#7C6FFF]/60 bg-[#7C6FFF]/5' : 'border-white/[0.08] hover:border-[#7C6FFF]/30 hover:bg-white/[0.01]'}
        ${uploading ? 'pointer-events-none' : ''}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept="audio/mp3,audio/mpeg,audio/wav,audio/flac,audio/aiff,audio/x-aiff"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        className="hidden"
      />

      {uploading ? (
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[#9BA0AD] text-xs">Subiendo...</span>
              <span className="text-[#7C6FFF] text-xs font-mono">{progress}%</span>
            </div>
            <div className="w-full bg-white/[0.06] rounded-full h-1">
              <div
                className="bg-[#7C6FFF] h-1 rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#1E2028] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 9V2M4 5l3-3 3 3" stroke="rgba(255,255,255,0.4)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 10v1a1 1 0 001 1h8a1 1 0 001-1v-1" stroke="rgba(255,255,255,0.2)" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p className="text-[#9BA0AD] text-sm">Subir audio</p>
            <p className="text-[#333] text-xs font-mono">MP3 · WAV · FLAC · AIFF · máx. 200 MB</p>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-red-400 text-xs font-mono">{error}</p>}
    </div>
  )
}
