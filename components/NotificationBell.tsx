'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'

const R2_PUBLIC = 'https://pub-5ad091444ab84f6e979864f025aa8867.r2.dev'

interface Notification {
  id:         string
  type:       string
  project_id: string | null
  track_id:   string | null
  actor_id:   string | null
  read:       boolean
  created_at: string
  project?:   { title: string; cover_url: string | null } | null
  actor?:     { username: string } | null
  track?:     { title: string } | null
}

interface Props {
  unreadCount: number
  userId:      string
}

function timeAgo(dateStr: string): string {
  const diff  = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'Ahora'
  if (mins < 60)  return `Hace ${mins}m`
  if (hours < 24) return `Hace ${hours}h`
  return `Hace ${days}d`
}

function notifMessage(n: Notification): string {
  const actor   = n.actor?.username ?? 'Alguien'
  const project = n.project?.title  ?? 'un proyecto'
  const track   = n.track?.title    ?? 'una canción'
  if (n.type === 'project_saved')   return `@${actor} guardó "${project}" en su biblioteca`
  if (n.type === 'project_playing') return `@${actor} está escuchando "${track}" de "${project}"`
  if (n.type === 'track_added')     return `@${actor} añadió "${track}" a "${project}"`
  return 'Nueva notificación'
}

function notifIcon(type: string) {
  if (type === 'project_saved') return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 1l1.5 3.5H12l-2.8 2 1 3.5L7 8l-3.2 2 1-3.5L2 5h3.5L7 1z" stroke="#6E62F5" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  if (type === 'project_playing') return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M3 2.5l9 4.5-9 4.5V2.5z" stroke="#1D9E75" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  if (type === 'track_added') return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 1v12M1 7h12" stroke="#F59E0B" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
  return null
}

export default function NotificationBell({ unreadCount: initialCount, userId }: Props) {
  const [open, setOpen]          = useState(false)
  const [notifs, setNotifs]      = useState<Notification[]>([])
  const [unreadCount, setUnread] = useState(initialCount)
  const [loading, setLoading]    = useState(false)
  const panelRef                 = useRef<HTMLDivElement>(null)
  const supabase                 = createClient()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const loadNotifs = async () => {
    setLoading(true)

    const { data: notifsRaw } = await supabase
      .from('notifications')
      .select('id, type, project_id, track_id, actor_id, read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (!notifsRaw) { setLoading(false); return }

    const projectIds = Array.from(new Set(notifsRaw.map((n: any) => n.project_id).filter(Boolean)))
    const actorIds   = Array.from(new Set(notifsRaw.map((n: any) => n.actor_id).filter(Boolean)))
    const trackIds   = Array.from(new Set(notifsRaw.map((n: any) => n.track_id).filter(Boolean)))

    const [{ data: projects }, { data: actors }, { data: tracks }] = await Promise.all([
      projectIds.length > 0
        ? supabase.from('projects').select('id, title, cover_url').in('id', projectIds)
        : { data: [] },
      actorIds.length > 0
        ? supabase.from('profiles').select('id, username').in('id', actorIds)
        : { data: [] },
      trackIds.length > 0
        ? supabase.from('tracks').select('id, title').in('id', trackIds)
        : { data: [] },
    ])

    const projectMap = Object.fromEntries((projects ?? []).map((p: any) => [p.id, p]))
    const actorMap   = Object.fromEntries((actors   ?? []).map((a: any) => [a.id, a]))
    const trackMap   = Object.fromEntries((tracks   ?? []).map((t: any) => [t.id, t]))

    const enriched = notifsRaw.map((n: any) => ({
      ...n,
      project: n.project_id ? projectMap[n.project_id] ?? null : null,
      actor:   n.actor_id   ? actorMap[n.actor_id]     ?? null : null,
      track:   n.track_id   ? trackMap[n.track_id]     ?? null : null,
    }))

    setNotifs(enriched)
    setLoading(false)
  }

  const markAllRead = async () => {
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
    setUnread(0)
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  }

  const handleOpen = () => {
    setOpen(p => !p)
    if (!open) loadNotifs()
  }

  const handleNotifClick = async (n: Notification) => {
    if (!n.read) {
      await supabase.from('notifications').update({ read: true }).eq('id', n.id)
      setUnread(prev => Math.max(0, prev - 1))
      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
    }
    if (n.project_id) window.location.href = `/dashboard/proyecto/${n.project_id}`
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
          open
            ? 'bg-[#6E62F5]/15 text-[#6E62F5]'
            : 'bg-[#181c27] hover:bg-[#1f2335] text-[#555966] hover:text-[#EAE9E6]'
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 1.5a5 5 0 015 5v2.5l1 2H2l1-2V6.5a5 5 0 015-5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          <path d="M6.5 13.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#6E62F5] rounded-full text-[9px] font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-96 bg-[#181c27] border border-white/[0.07] rounded-2xl shadow-2xl z-50 overflow-hidden">

          <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06]">
            <span className="text-sm font-medium text-[#EAE9E6]">Notificaciones</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-mono text-[#6E62F5] hover:text-[#5A4FD4] transition-colors"
              >
                Marcar todo como leído
              </button>
            )}
          </div>

          <div className="max-h-[480px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-5 h-5 border-2 border-white/10 border-t-[#6E62F5] rounded-full animate-spin"/>
              </div>
            ) : notifs.length === 0 ? (
