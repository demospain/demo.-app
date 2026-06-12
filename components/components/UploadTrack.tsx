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
      // 1. Pedir presigned URL al servidor
      const res = await fetch('/api/upload-url', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        }),
      })

      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error || 'Error obteniendo URL de subida')
      }

      const { uploadUrl, filePath } = await res.json()

      // 2. Subir directamente a R2 con XMLHttpRequest para tener progreso
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100))
          }
        }
        xhr.onload  = () => xhr.status === 200 ? resolve() : reject(new Error(`R2 error: ${xhr.status}`))
        xhr.onerror = () => reject(new Error('Error de red al subir'))
        xhr.open('PUT', uploadUrl)
        xhr.setRequestHeader('Content-Type', file.type)
        xhr.send(file)
      })

      // 3. Guardar metadatos en Supabase
      const supabase = createClient()
      const title    = file.name.replace(/\.[^/.]+$/, '') // quitar extensión

      const { data: track, error: dbError } = await supabase
        .from('tracks')
        .insert({
          project_id:  projectId,
          title,
          file_path:   filePath,
          file_size:   file.size,
          format:      file.name.split('.').pop()?.toLowerCase(),
          track_order: 0,
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

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div
      onClick={() => !uploading && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`
        relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
        ${dragging
          ? 'border-[#7C6FFF] bg-[#7C6FFF]/5'
          : 'border-white/10 hover:border-[#7C6FFF]/40 hover:bg-white/[0.02]'}
        ${uploading ? 'pointer-events-none' : ''}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept="audio/mp3,audio/mpeg,audio/wav,audio/flac,audio/aiff,audio/x-aiff"
        onChange={onInputChange}
        className="hidden"
      />

      {uploading ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-full bg-white/10 rounded-full h-1.5">
            <div
              className="bg-[#7C6FFF] h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[#9BA0AD] text-sm font-mono">{progress}%</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-[#1E2028] border border-[#7C6FFF]/20 flex items-center justify-center text-lg mb-1">
            🎵
          </div>
          <p className="text-[#F8F7F4] text-sm font-medium">
            Arrastra un archivo o haz clic para subir
          </p>
          <p className="text-[#555966] text-xs font-mono">
            MP3 · WAV · FLAC · AIFF · máx. 200 MB
          </p>
        </div>
      )}

      {error && (
        <p className="mt-3 text-red-400 text-xs font-mono">{error}</p>
      )}
    </div>
  )
}
