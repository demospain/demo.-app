import { NextResponse } from 'next/server'

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

    const contentType = res.headers.get('content-type') ?? 'image/jpeg'
    const buffer = await res.arrayBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':  contentType,
        'Cache-Control': 'public, max-age=86400, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch {
    return new NextResponse('Error fetching image', { status: 500 })
  }
}
