'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

interface Props {
  file:        File
  onConfirm:   (croppedFile: File) => void
  onCancel:    () => void
  outputSize?: number // px del lado del cuadrado final, default 800
}

const FRAME_SIZE = 320 // tamaño del marco cuadrado en pantalla (px CSS)

export default function ImageCropModal({ file, onConfirm, onCancel, outputSize = 800 }: Props) {
  const imgRef        = useRef<HTMLImageElement>(null)
  const containerRef   = useRef<HTMLDivElement>(null)
  const [imgUrl, setImgUrl]       = useState<string | null>(null)
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 })
  const [zoom, setZoom]           = useState(1)
  const [minZoom, setMinZoom]     = useState(1)
  const [offset, setOffset]       = useState({ x: 0, y: 0 })
  const [exporting, setExporting] = useState(false)

  const dragStart = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null)
  const pinchStart = useRef<{ dist: number; zoom: number } | null>(null)

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setImgUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const onImageLoad = () => {
    const img = imgRef.current
    if (!img) return
    const w = img.naturalWidth
    const h = img.naturalHeight
    setNaturalSize({ w, h })
    // El zoom mínimo es el que hace que el lado más corto cubra el marco cuadrado
    const scale = FRAME_SIZE / Math.min(w, h)
    setMinZoom(scale)
    setZoom(scale)
    setOffset({ x: 0, y: 0 })
  }

  const clampOffset = useCallback((x: number, y: number, currentZoom: number) => {
    const w = naturalSize.w * currentZoom
    const h = naturalSize.h * currentZoom
    const maxX = Math.max(0, (w - FRAME_SIZE) / 2)
    const maxY = Math.max(0, (h - FRAME_SIZE) / 2)
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    }
  }, [naturalSize])

  const onPointerDown = (clientX: number, clientY: number) => {
    dragStart.current = { x: clientX, y: clientY, offsetX: offset.x, offsetY: offset.y }
  }
  const onPointerMove = (clientX: number, clientY: number) => {
    if (!dragStart.current) return
    const dx = clientX - dragStart.current.x
    const dy = clientY - dragStart.current.y
    const next = clampOffset(dragStart.current.offsetX + dx, dragStart.current.offsetY + dy, zoom)
    setOffset(next)
  }
  const onPointerUp = () => { dragStart.current = null }

  const dist = (t1: React.Touch, t2: React.Touch) =>
    Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      pinchStart.current = { dist: dist(e.touches[0], e.touches[1]), zoom }
    } else if (e.touches.length === 1) {
      onPointerDown(e.touches[0].clientX, e.touches[0].clientY)
    }
  }
  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 2 && pinchStart.current) {
      const newDist = dist(e.touches[0], e.touches[1])
      const factor = newDist / pinchStart.current.dist
      const nextZoom = Math.max(minZoom, Math.min(minZoom * 4, pinchStart.current.zoom * factor))
      setZoom(nextZoom)
      setOffset(prev => clampOffset(prev.x, prev.y, nextZoom))
    } else if (e.touches.length === 1) {
      onPointerMove(e.touches[0].clientX, e.touches[0].clientY)
    }
  }
  const handleTouchEnd = () => { dragStart.current = null; pinchStart.current = null }

  const handleMouseDown = (e: React.MouseEvent) => {
    onPointerDown(e.clientX, e.clientY)
    const onMove = (ev: MouseEvent) => onPointerMove(ev.clientX, ev.clientY)
    const onUp = () => {
      onPointerUp()
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const handleZoomChange = (val: number) => {
    setZoom(val)
    setOffset(prev => clampOffset(prev.x, prev.y, val))
  }

  const handleConfirm = async () => {
    const img = imgRef.current
    if (!img || naturalSize.w === 0) return
    setExporting(true)

    const canvas = document.createElement('canvas')
    canvas.width = outputSize
    canvas.height = outputSize
    const ctx = canvas.getContext('2d')
    if (!ctx) { setExporting(false); return }

    // El marco visible (FRAME_SIZE) mapea 1:1 a outputSize
    const exportScale = outputSize / FRAME_SIZE

    // Centro de la imagen en coordenadas del marco (px CSS), ya con zoom aplicado
    const imgW = naturalSize.w * zoom
    const imgH = naturalSize.h * zoom
    const imgLeft = FRAME_SIZE / 2 - imgW / 2 + offset.x
    const imgTop  = FRAME_SIZE / 2 - imgH / 2 + offset.y

    ctx.drawImage(
      img,
      0, 0, naturalSize.w, naturalSize.h,
      imgLeft * exportScale, imgTop * exportScale, imgW * exportScale, imgH * exportScale,
    )

    canvas.toBlob(blob => {
      setExporting(false)
      if (!blob) return
      const croppedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.jpg', { type: 'image/jpeg' })
      onConfirm(croppedFile)
    }, 'image/jpeg', 0.92)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="bg-[#181c27] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm">
        <p className="font-mono text-xs text-[#555966] uppercase tracking-widest mb-1">Ajustar imagen</p>
        <h3 className="font-medium text-[#EAE9E6] text-base mb-5">Encuadra tu foto</h3>

        <div
          ref={containerRef}
          className="relative mx-auto overflow-hidden rounded-xl bg-[#0f1117] select-none touch-none cursor-grab active:cursor-grabbing"
          style={{ width: FRAME_SIZE, height: FRAME_SIZE }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {imgUrl && (
            <img
              ref={imgRef}
              src={imgUrl}
              alt=""
              onLoad={onImageLoad}
              draggable={false}
              className="absolute pointer-events-none"
              style={{
                width: naturalSize.w * zoom,
                height: naturalSize.h * zoom,
                left: FRAME_SIZE / 2 - (naturalSize.w * zoom) / 2 + offset.x,
                top:  FRAME_SIZE / 2 - (naturalSize.h * zoom) / 2 + offset.y,
                maxWidth: 'none',
              }}
            />
          )}
          {/* Rejilla sutil estilo Instagram */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)
            `,
            backgroundSize: `${FRAME_SIZE / 3}px ${FRAME_SIZE / 3}px`,
          }}/>
        </div>

        {naturalSize.w > 0 && (
          <div className="flex items-center gap-3 mt-4 px-1">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 opacity-40">
              <circle cx="7" cy="7" r="3" stroke="#9BA0AD" strokeWidth="1.2"/>
            </svg>
            <input
              type="range"
              min={minZoom}
              max={minZoom * 4}
              step={(minZoom * 4 - minZoom) / 100}
              value={zoom}
              onChange={e => handleZoomChange(parseFloat(e.target.value))}
              className="flex-1 accent-[#6E62F5]"
            />
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="flex-shrink-0 opacity-40">
              <circle cx="9" cy="9" r="4" stroke="#9BA0AD" strokeWidth="1.2"/>
            </svg>
          </div>
        )}

        <div className="flex gap-2 mt-5">
          <button
            onClick={onCancel}
            disabled={exporting}
            className="flex-1 border border-white/[0.07] text-[#555966] hover:text-[#9BA0AD] py-2.5 rounded-xl text-sm transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={exporting || naturalSize.w === 0}
            className="flex-1 bg-[#6E62F5] hover:bg-[#5A4FD4] disabled:opacity-40 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            {exporting ? 'Guardando...' : 'Aplicar'}
          </button>
        </div>
      </div>
    </div>
  )
}
