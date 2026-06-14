import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const filePath = searchParams.get('path')

  if (!filePath) {
    return NextResponse.json({ error: 'Falta el path' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: track } = await supabase
    .from('tracks')
    .select('id, file_path, project_id, projects(visibility, owner_id)')
    .eq('file_path', filePath)
    .single()

  if (!track) {
    return NextResponse.json({ error: 'Track no encontrado' }, { status: 404 })
  }

  const projectRaw = track.projects
  const project    = Array.isArray(projectRaw) ? projectRaw[0] : projectRaw
  const visibility = project?.visibility as string | undefined
  const ownerId    = project?.owner_id   as string | undefined

  const isOwner  = user?.id === ownerId
  const isPublic = visibility === 'public' || visibility === 'link'

  if (!isOwner && !isPublic) {
    return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })
  }

  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key:    filePath,
  })

  const playUrl = await getSignedUrl(r2, command, { expiresIn: 3600 })

  const r2Response = await fetch(playUrl)

  if (!r2Response.ok) {
    return NextResponse.json({ error: 'Error al obtener el audio' }, { status: 500 })
  }

  const contentType   = r2Response.headers.get('content-type') || 'audio/mpeg'
  const contentLength = r2Response.headers.get('content-length')

  const headers: Record<string, string> = {
    'Content-Type':                contentType,
    'Access-Control-Allow-Origin': '*',
    'Cache-Control':               'public, max-age=3600',
  }

  if (contentLength) {
    headers['Content-Length'] = contentLength
  }

  return new Response(r2Response.body, { headers })
}

export async function POST(request: Request) {
  const { filePath } = await request.json()

  if (!filePath) {
    return NextResponse.json({ error: 'Falta el path' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: track } = await supabase
    .from('tracks')
    .select('id, file_path, project_id, projects(visibility, owner_id)')
    .eq('file_path', filePath)
    .single()

  if (!track) {
    return NextResponse.json({ error: 'Track no encontrado' }, { status: 404 })
  }

  const projectRaw = track.projects
  const project    = Array.isArray(projectRaw) ? projectRaw[0] : projectRaw
  const visibility = project?.visibility as string | undefined
  const ownerId    = project?.owner_id   as string | undefined

  const isOwner  = user?.id === ownerId
  const isPublic = visibility === 'public' || visibility === 'link'

  if (!isOwner && !isPublic) {
    return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })
  }

  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key:    filePath,
  })

  const url = await getSignedUrl(r2, command, { expiresIn: 3600 })

  // Notificar al dueño si quien escucha no es él
if (user && ownerId && user.id !== ownerId) {
  await supabase.from('notifications').insert({
    user_id:    ownerId,
    type:       'project_playing',
    project_id: track.project_id,
    actor_id:   user.id,
  })
}
  return NextResponse.json({ url })
}
