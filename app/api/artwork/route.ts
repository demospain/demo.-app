import { NextResponse } from 'next/server'
import sharp from 'sharp'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return new NextResponse('Missing url param', { status: 400 })
  }

  // Solo permitir URLs de nuestro bucket R2
  if (!url.startsWith('https://pub-5ad091444ab84f6e979864f025aa8867.r2.dev/')) {
    return new NextResponse('URL not allowed', { status: 403 })
  }

  try {
    const res = await fetch(url, { cache: 'force-cache' })
    if (!res.ok) return new NextResponse('Image fetch failed', { status: 502 })

    const original = Buffer.from(await res.arrayBuffer())

    // Normalizamos SIEMPRE a un JPEG estándar de 512x512, sin importar el
    // formato real del archivo original (puede venir mal etiquetado —p.ej.
    // un WebP guardado como .jpg al descargarlo de internet—, tener perfil
    // de color CMYK, EXIF raro, etc). El <img> de una página web tolera casi
    // cualquier cosa, pero el cargador de artwork de la pantalla de bloqueo
    // del sistema operativo es mucho más estricto y, si algo no encaja,
    // simplemente no muestra portada — sin avisar de nada.
    const normalized = await sharp(original)
      .rotate() // corrige la orientación según el EXIF antes de recortar
      .resize(512, 512, { fit: 'cover' })
      .jpeg({ quality: 85 })
      .toBuffer()

    return new NextResponse(new Uint8Array(normalized), {
      status: 200,
      headers: {
        'Content-Type':  'image/jpeg',
        'Cache-Control': 'public, max-age=86400, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch {
    return new NextResponse('Error processing image', { status: 500 })
  }
}
