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

  // Extraer el proyecto correctamente del resultado del join
  const projectRaw = track.projects
  const project = Array.isArray(projectRaw) ? projectRaw[0] : projectRaw
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

  return NextResponse.json({ playUrl })
}
