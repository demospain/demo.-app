import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const filePath = searchParams.get('path')

  if (!filePath) {
    return NextResponse.json({ error: 'Falta el path del archivo' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()

  const { data: track } = await supabase
    .from('tracks')
    .select('id, file_path, project_id, projects(visibility, owner_id)')
    .eq('file_path', filePath)
    .single()

  if (!track) {
    return NextResponse.json({ error: 'Track no encontrado' }, { status: 404 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  const projectRaw = track.projects
  const project = Array.isArray(projectRaw) ? projectRaw[0] : projectRaw
  const visibility = project?.visibility as string | undefined
  const ownerId    = project?.owner_id   as string | undefined

  const isOwner  = user?.id === ownerId
  const isPublic = visibility === 'public' || visibility === 'link'

  if (!isOwner && !isPublic) {
    return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })
  }

  const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${filePath}`

  return NextResponse.json({ playUrl: publicUrl })
}
