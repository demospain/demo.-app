import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { fileName, fileType, fileSize, projectId } = await request.json()

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(fileType)) {
    return NextResponse.json({ error: 'Tipo de archivo no permitido' }, { status: 400 })
  }

  if (fileSize > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'La imagen no puede superar 10 MB' }, { status: 400 })
  }

  const ext      = fileName.split('.').pop()
  const filePath = `covers/${projectId}-${Date.now()}.${ext}`

  const command = new PutObjectCommand({
    Bucket:        process.env.R2_BUCKET_NAME!,
    Key:           filePath,
    ContentType:   fileType,
    ContentLength: fileSize,
  })

  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 600 })

  return NextResponse.json({ uploadUrl, filePath })
}
