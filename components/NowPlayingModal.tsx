'use client'

import { useState } from 'react'
import { usePlayer } from '@/lib/PlayerContext'
import ImmersivePlayerView, { ImmersiveTrackMenuAction } from '@/components/ImmersivePlayerView'
import { createClient } from '@/lib/supabase'

export default function NowPlayingModal() {
  const {
    currentTrack, isPlaying, repeatMode, shuffleMode, currentTime, duration, queue, loading,
    showNowPlaying, setShowNowPlaying,
    playNext, playPrev, cycleRepeat, seekTo, shuffleProject, shareTrack, closePlayer,
  } = usePlayer()

  const [sharing, setSharing] = useState(false)
  const [shared, setShared]   = useState(false)
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null)
  const [editingTrackName, setEditingTrackName] = useState('')
  const supabase = createClient()

  if (!showNowPlaying || !currentTrack) return null

  const handleShare = async (): Promise<boolean> => {
    if (!currentTrack || sharing) return false
    setSharing(true)
    const ok = await shareTrack(currentTrack)
    setSharing(false)
    if (ok) {
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    }
    return ok
  }

  const handleTogglePlay = () => {
    const audio = (window as any).__demoAudio
    if (audio) audio.paused ? audio.play().catch(() => {}) : audio.pause()
  }

  // Prev/Next solo tienen sentido con una cola real (ej. tras activar shuffle de biblioteca)
  const currentIdx = queue.findIndex(t => t.id === currentTrack.id)
  const hasPrev = currentIdx > 0
  const hasNext = currentIdx >= 0 && currentIdx < queue.length - 1

  const repeatLabel = repeatMode === 'one' ? '1' : repeatMode === 'all' ? '∞' : null

  const handleRenameTrack = async () => {
    const trimmed = editingTrackName.trim()
    if (trimmed && currentTrack) {
      await supabase.from('tracks').update({ title: trimmed }).eq('id', currentTrack.id)
      const { data: singlesForTrack } = await supabase.from('singles').select('id').eq('track_id', currentTrack.id)
      if (singlesForTrack && singlesForTrack.length > 0) {
        const singleIds = singlesForTrack.map(s => s.id)
        await supabase.from('singles').update({ track_title: trimmed }).eq('track_id', currentTrack.id)
        await supabase.from('projects').update({ title: trimmed }).in('source_single_id', singleIds)
      }
    }
    setEditingTrackId(null)
  }

  const handleDeleteTrack = async () => {
    if (!currentTrack) return
    await supabase.from('notifications').delete().eq('track_id', currentTrack.id)
    await supabase.from('play_events').delete().eq('track_id', currentTrack.id)
    await supabase.from('comments').delete().eq('track_id', currentTrack.id)
    await supabase.from('track_versions').delete().eq('track_id', currentTrack.id)
    await supabase.from('tracks').delete().eq('id', currentTrack.id)
    closePlayer()
  }

  const menuActions: ImmersiveTrackMenuAction[] | undefined = currentTrack.isMine ? [
    {
      label: 'Renombrar',
      icon: (
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M9 1l3 3-8 8H1V9L9 1z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      onClick: () => { setEditingTrackName(currentTrack.title); setEditingTrackId(currentTrack.id) },
    },
    {
      label: 'Eliminar',
      icon: (
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M2 3.5h9M4.5 3.5V2h4v1.5M5.5 6v4M7.5 6v4M3 3.5l.5 8h6l.5-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      onClick: handleDeleteTrack,
      danger: true,
    },
  ] : undefined

  const subtitle = currentTrack.artistName ?? currentTrack.projectTitle ?? 'demo.'

  return (
    <>
      {editingTrackId && (
        <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#13141a] border border-white/[0.07] rounded-2xl p-6 w-full max-w-sm">
            <p className="font-mono text-xs text-[#555966] uppercase tracking-widest mb-1">Renombrar</p>
            <h3 className="font-medium text-[#F8F7F4] text-base mb-4">¿Nuevo nombre?</h3>
            <input
              autoFocus
              type="text"
              value={editingTrackName}
              onChange={e => setEditingTrackName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleRenameTrack(); if (e.key === 'Escape') setEditingTrackId(null) }}
              className="bg-[#0d0d0f] border border-white/[0.06] focus:border-[#7C6FFF]/40 text-[#F8F7F4] placeholder:text-[#2E3140] rounded-xl px-4 py-3 text-sm outline-none transition-colors w-full font-mono mb-3"
            />
            <div className="flex gap-2">
              <button onClick={() => setEditingTrackId(null)} className="flex-1 border border-white/[0.06] text-[#555966] hover:text-[#9BA0AD] py-2.5 rounded-xl text-sm transition-colors">Cancelar</button>
              <button onClick={handleRenameTrack} disabled={!editingTrackName.trim()} className="flex-1 bg-[#7C6FFF] hover:bg-[#6B5FE8] disabled:opacity-30 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">Guardar</button>
            </div>
          </div>
        </div>
      )}

      <div className="md:hidden">
        <ImmersivePlayerView
          variant="mobile"
          title={currentTrack.title}
          subtitle={subtitle}
          coverUrl={currentTrack.coverUrl ?? null}
          waveform={currentTrack.waveform ?? null}
          isPlaying={isPlaying}
          loading={loading}
          currentTime={currentTime}
          duration={duration}
          onSeek={seekTo}
          onTogglePlay={handleTogglePlay}
          onPrev={playPrev}
          onNext={playNext}
          hasPrev={hasPrev}
          hasNext={hasNext}
          shuffleActive={shuffleMode !== 'none'}
          onToggleShuffle={shuffleProject}
          repeatLabel={repeatLabel}
          onCycleRepeat={cycleRepeat}
          onShare={handleShare}
          shared={shared}
          sharing={sharing}
          onClose={() => setShowNowPlaying(false)}
          menuActions={menuActions}
        />
      </div>

      <div className="hidden md:block">
        <ImmersivePlayerView
          variant="desktop"
          title={currentTrack.title}
          subtitle={subtitle}
          coverUrl={currentTrack.coverUrl ?? null}
          waveform={currentTrack.waveform ?? null}
          isPlaying={isPlaying}
          loading={loading}
          currentTime={currentTime}
          duration={duration}
          onSeek={seekTo}
          onTogglePlay={handleTogglePlay}
          onPrev={playPrev}
          onNext={playNext}
          hasPrev={hasPrev}
          hasNext={hasNext}
          shuffleActive={shuffleMode !== 'none'}
          onToggleShuffle={shuffleProject}
          repeatLabel={repeatLabel}
          onCycleRepeat={cycleRepeat}
          onShare={handleShare}
          shared={shared}
          sharing={sharing}
          onClose={() => setShowNowPlaying(false)}
          menuActions={menuActions}
        />
      </div>
    </>
  )
}
