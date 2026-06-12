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
    return NextResponse.json({ error: 'Falta el path del archivo' }, { status: 400 })
  }

  // Verificar que el usuario tiene acceso al track
  const supabase = await createServerSupabaseClient()
  const { data: track } = await supabase
    .from('tracks')
    .select('id, project_id, file_path, projects(visibility, owner_id)')
    .eq('file_path', filePath)
    .single()

  if (!track) {
    return NextResponse.json({ error: 'Track no encontrado' }, { status: 404 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  const project = track.projects as { visibility: string; owner_id: string } | null

  // Permitir acceso si: es el owner, o el proyecto es público/link
  const isOwner  = user?.id === project?.owner_id
  const isPublic = project?.visibility === 'public' || project?.visibility === 'link'

  if (!isOwner && !isPublic) {
    return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })
  }

  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key:    filePath,
  })

  // Presigned URL válida 1 hora para reproducir
  const playUrl = await getSignedUrl(r2, command, { expiresIn: 3600 })

  return NextResponse.json({ playUrl })
}
