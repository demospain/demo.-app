'use client'

import { useEffect, useRef } from 'react'

export default function Template({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  // El fundido se aplica solo al montar y se retira en cuanto termina.
  // Importante: un div con `animation` activa actúa como containing block
  // para descendientes `position: fixed` (el reproductor se anclaba a él
  // en vez de a la pantalla). Al quitar la clase tras la animación,
  // el div deja de romper el `fixed`.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const done = () => el.classList.remove('page-fade-in')
    el.addEventListener('animationend', done)
    // Respaldo por si el evento no llega (p. ej. prefers-reduced-motion)
    const t = setTimeout(done, 400)
    return () => {
      el.removeEventListener('animationend', done)
      clearTimeout(t)
    }
  }, [])

  return <div ref={ref} className="page-fade-in">{children}</div>
}
