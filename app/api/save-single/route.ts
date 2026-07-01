import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  // Verificar quién hace la petición usando su propia sesión, nunca un id recibido del cliente
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { singleId } = await request.json()
  if (!singleId) {
    return NextResponse.json({ error: 'Falta singleId' }, { status: 400 })
  }

  const admin = createAdminSupabaseClient()

  // 1. Cargar el single
  const { data: single, error: singleError } = await admin
    .from('singles')
    .select('id, track_title, file_path, project_id, cover_url, tracks(waveform)')
    .eq('id', singleId)
    .single()

  if (singleError || !single) {
    return NextResponse.json({ error: 'Canción no encontrada' }, { status: 404 })
  }

  // 2. Reutilizar el proyecto espejo si ya existe (creado por cualquier usuario que
  //    guardó este single antes) — evita duplicados
  const { data: existingMirror } = await admin
    .from('projects')
    .select('id')
    .eq('source_single_id', single.id)
    .maybeSingle()

  let mirrorProjectId: string

  if (existingMirror) {
    mirrorProjectId = existingMirror.id
  } else {
    // Averiguar el dueño original a través del proyecto de origen del single
    const { data: originalProject } = await admin
      .from('projects')
      .select('owner_id')
      .eq('id', single.project_id)
      .maybeSingle()

    const originalOwnerId = originalProject?.owner_id
    if (!originalOwnerId) {
      return NextResponse.json({ error: 'No se pudo determinar el propietario original' }, { status: 500 })
    }

    // Crear el proyecto espejo — privado, propiedad del artista original,
    // para que aparezca correctamente atribuido en cualquier biblioteca
    const { data: newProject, error: projectError } = await admin
      .from('projects')
      .insert({
        title:            single.track_title,
        owner_id:         originalOwnerId,
        visibility:       'private',
        status:           'draft',
        cover_url:        single.cover_url,
        source_single_id: single.id,
      })
      .select()
      .single()

    if (projectError || !newProject) {
      return NextResponse.json({ error: 'No se ha podido crear el proyecto' }, { status: 500 })
    }

    const waveform = (single as any).tracks?.waveform ?? null

    const { error: trackError } = await admin
      .from('tracks')
      .insert({
        project_id:  newProject.id,
        title:       single.track_title,
        file_path:   single.file_path,
        track_order: 0,
        uploaded_by: originalOwnerId,
        waveform,
      })

    if (trackError) {
      await admin.from('projects').delete().eq('id', newProject.id)
      return NextResponse.json({ error: 'No se ha podido copiar la canción' }, { status: 500 })
    }

    mirrorProjectId = newProject.id
  }

  // 3. Guardar en la biblioteca del usuario que hace la petición (si no lo tiene ya)
  const { data: alreadySaved } = await admin
    .from('saved_projects')
    .select('id')
    .eq('user_id', user.id)
    .eq('project_id', mirrorProjectId)
    .maybeSingle()

  if (!alreadySaved) {
    const { error: saveError } = await admin
      .from('saved_projects')
      .insert({ project_id: mirrorProjectId, user_id: user.id })

    if (saveError) {
      return NextResponse.json({ error: 'No se ha podido guardar en tu biblioteca' }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true, projectId: mirrorProjectId })
}
