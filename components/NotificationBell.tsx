'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'

interface Notification {
  id:         string
  type:       string
  project_id: string | null
  track_id:   string | null
  actor_id:   string | null
  read:       boolean
  created_at: string
  project?:   { title: string }
  actor?:     { username: string }
  track?:     { title: string }
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
  if (mins < 1)    return 'Ahora'
  if (mins < 60)   return `Hace ${mins}m`
  if (hours < 24)  return `Hace ${hours}h`
  return `Hace ${days}d`
}

function notifMessage(n: Notification): string {
  const actor   = n.actor?.username ?? 'Alguien'
  const project = n.project?.title  ?? 'un proyecto'
  const track   = n.track?.title    ?? 'una canción'
  if (n.type === 'project_saved') return `${actor} guardó "${project}" en su biblioteca`
  if (n.type === 'project_playing') return `${actor} está escuchando "${project}"`
  if (n.type === 'track_added') return `${actor} añadió "${track}" a "${project}"`
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
  const [open, setOpen]             = useState(false)
  const [notifs, setNotifs]         = useState<Notification[]>([])
  const [unreadCount, setUnread]    = useState(initialCount)
  const [loading, setLoading]       = useState(false)
  const panelRef                    = useRef<HTMLDivElement>(null)
  const supabase                    = createClient()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const loadNotifs = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select(`
        id, type, project_id, track_id, actor_id, read, created_at,
        project:projects(title),
        actor:profiles!notifications_actor_id_fkey(username),
        track:tracks(title)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
    setNotifs((data ?? []) as any)
    setLoading(false)
  }

  const markAllRead = async () => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
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
          open ? 'bg-[#6E62F5]/15 text-[#6E62F5]' : 'bg-[#181c27] hover:bg-[#1f2335] text-[#555966] hover:text-[#EAE9E6]'
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
        <div className="absolute right-0 top-11 w-80 bg-[#181c27] border border-white/[0.07] rounded-2xl shadow-2xl z-50 overflow-hidden">

          {/* Header panel */}
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

          {/* Lista */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-5 h-5 border-2 border-white/10 border-t-[#6E62F5] rounded-full animate-spin"/>
              </div>
            ) : notifs.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-[#555966] text-sm font-mono">Sin notificaciones</p>
              </div>
            ) : (
              notifs.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleNotifClick(n)}
                  className={`w-full flex items-start gap-3 px-4 py-3.5 border-b border-white/[0.04] last:border-0 text-left transition-colors hover:bg-white/[0.03] ${
                    !n.read ? 'bg-[#6E62F5]/5' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    n.type === 'project_saved'   ? 'bg-[#6E62F5]/10' :
                    n.type === 'project_playing' ? 'bg-[#1D9E75]/10' :
                    'bg-[#F59E0B]/10'
                  }`}>
                    {notifIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${n.read ? 'text-[#9BA0AD]' : 'text-[#EAE9E6]'}`}>
                      {notifMessage(n)}
                    </p>
                    <p className="text-xs font-mono text-[#555966] mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-[#6E62F5] flex-shrink-0 mt-1.5"/>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
