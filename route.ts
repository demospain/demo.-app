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
  // Verificar sesión
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { fileName, fileType, fileSize } = await request.json()

  // Validar tipo de archivo
  const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aiff', 'audio/x-aiff', 'audio/mp3']
  if (!allowedTypes.includes(fileType)) {
    return NextResponse.json({ error: 'Tipo de archivo no permitido' }, { status: 400 })
  }

  // Validar tamaño (max 200 MB)
  if (fileSize > 200 * 1024 * 1024) {
    return NextResponse.json({ error: 'El archivo no puede superar 200 MB' }, { status: 400 })
  }

  // Generar ruta única en R2: userId/timestamp-filename
  const ext       = fileName.split('.').pop()
  const safeName  = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filePath  = `${user.id}/${Date.now()}-${safeName}`

  const command = new PutObjectCommand({
    Bucket:      process.env.R2_BUCKET_NAME!,
    Key:         filePath,
    ContentType: fileType,
    ContentLength: fileSize,
  })

  // Presigned URL válida 10 minutos para subir
  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 600 })

  return NextResponse.json({ uploadUrl, filePath })
}
