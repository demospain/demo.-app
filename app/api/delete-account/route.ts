import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

async function deleteFromR2(key: string | null | undefined) {
  if (!key) return
  const cleanKey = key.startsWith('http') ? key.split('/').slice(3).join('/') : key
  if (!cleanKey) return
  try {
    await r2.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME!, Key: cleanKey }))
  } catch {
    // si el archivo ya no existe o falla un borrado puntual, no bloqueamos el resto del proceso
  }
}

export async function POST() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const admin = createAdminSupabaseClient()

  // 1. Recopilar todas las rutas de archivos en R2 antes de borrar nada en la base de datos
  const { data: projects } = await admin
    .from('projects')
    .select('id, cover_url')
    .eq('owner_id', user.id)

  const projectIds = (projects ?? []).map(p => p.id)

  const { data: tracks } = projectIds.length
    ? await admin.from('tracks').select('id, file_path').in('project_id', projectIds)
    : { data: [] as { id: string; file_path: string }[] }

  const trackIds = (tracks ?? []).map(t => t.id)

  const { data: versions } = trackIds.length
    ? await admin.from('track_versions').select('file_path').in('track_id', trackIds)
    : { data: [] as { file_path: string }[] }

  const { data: profileRow } = await admin
    .from('profiles')
    .select('avatar_url')
    .eq('id', user.id)
    .single()

  // 2. Borrar archivos de R2 (audio, portadas, versiones, avatar)
  await Promise.all([
    ...(projects ?? []).map(p => deleteFromR2(p.cover_url)),
    ...(tracks ?? []).map(t => deleteFromR2(t.file_path)),
    ...(versions ?? []).map(v => deleteFromR2(v.file_path)),
    deleteFromR2(profileRow?.avatar_url),
  ])

  // 3. Borrar todas las notificaciones vinculadas al usuario — tanto las de sus
  //    proyectos (project_id) como aquellas donde actuó como actor (actor_id).
  //    Ambas foreign keys son ON DELETE NO ACTION y bloquearían el borrado en cascada.
  await Promise.all([
    projectIds.length
      ? admin.from('notifications').delete().in('project_id', projectIds)
      : Promise.resolve(),
    admin.from('notifications').delete().eq('actor_id', user.id),
  ])

  // 4. Borrar el perfil. Esto dispara en cascada el borrado de projects -> tracks ->
  //    track_versions / comments / play_events, además de project_members y saved_projects
  await admin.from('profiles').delete().eq('id', user.id)

  // 5. Borrar el usuario real de Supabase Auth — esto es lo que libera el correo
  //    para poder registrarse de nuevo desde cero
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
