'use client'

import { useState, useEffect } from 'react'

type Platform = 'ios-safari' | 'ios-other' | 'android' | 'desktop'

export default function InstalarPage() {
  const [platform, setPlatform]         = useState<Platform | null>(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [installed, setInstalled]       = useState(false)

  useEffect(() => {
    const ua       = navigator.userAgent
    const isIOS    = /iPad|iPhone|iPod/.test(ua)
    const isAndroid = /Android/.test(ua)
    const isSafari  = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua)

    if (isIOS) setPlatform(isSafari ? 'ios-safari' : 'ios-other')
    else if (isAndroid) setPlatform('android')
    else setPlatform('desktop')

    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true
    )

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === 'accepted') setInstalled(true)
    setDeferredPrompt(null)
  }

  const Step = ({ n, children }: { n: number; children: React.ReactNode }) => (
    <div className="flex gap-3 items-start">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#6E62F5]/15 text-[#6E62F5] text-xs font-mono font-medium flex items-center justify-center mt-0.5">
        {n}
      </span>
      <p className="text-[#EAE9E6] text-sm leading-relaxed">{children}</p>
    </div>
  )

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-[#0f1117]">
      <div className="w-full max-w-md">

        <div className="text-center mb-10">
          <span className="font-mono text-4xl font-medium text-[#EAE9E6] tracking-tight">
            demo<span className="text-[#6E62F5]">.</span>
          </span>
          <p className="text-[#9BA0AD] text-sm mt-2">Instala la app en tu dispositivo</p>
        </div>

        {isStandalone || installed ? (
          <div className="card-elevated rounded-2xl p-8 text-center">
            <p className="text-[#EAE9E6] font-medium mb-1">Ya la tienes instalada</p>
            <p className="text-[#9BA0AD] text-sm">Estás usando demo. como app — todo listo.</p>
          </div>
        ) : !platform ? (
          <div className="card-elevated rounded-2xl p-8 text-center">
            <p className="text-[#555966] text-sm font-mono">Detectando tu dispositivo...</p>
          </div>
        ) : deferredPrompt ? (
          <div className="card-elevated rounded-2xl p-8 text-center">
            <p className="text-[#9BA0AD] text-sm mb-5">
              Tu navegador permite instalarla con un toque.
            </p>
            <button
              onClick={handleInstallClick}
              className="w-full bg-[#6E62F5] hover:bg-[#5A4FD4] text-white font-medium py-3.5 rounded-xl transition-colors"
            >
              Instalar app
            </button>
          </div>
        ) : platform === 'ios-safari' ? (
          <div className="card-elevated rounded-2xl p-8 flex flex-col gap-4">
            <Step n={1}>
              Toca el icono de <strong className="font-medium">compartir</strong> (el cuadrado con la flecha hacia arriba) en la barra de Safari.
            </Step>
            <Step n={2}>
              Desliza hacia abajo y toca <strong className="font-medium">"Añadir a pantalla de inicio"</strong>.
            </Step>
            <Step n={3}>
              Toca <strong className="font-medium">"Añadir"</strong> arriba a la derecha.
            </Step>
          </div>
        ) : platform === 'ios-other' ? (
          <div className="card-elevated rounded-2xl p-8 text-center">
            <p className="text-[#EAE9E6] text-sm leading-relaxed mb-1">
              En iPhone, solo se puede instalar desde <strong className="font-medium">Safari</strong>.
            </p>
            <p className="text-[#9BA0AD] text-sm leading-relaxed">
              Abre demospain.app/instalar en Safari para continuar.
            </p>
          </div>
        ) : platform === 'android' ? (
          <div className="card-elevated rounded-2xl p-8 flex flex-col gap-4">
            <Step n={1}>
              Toca el menú <strong className="font-medium">⋮</strong> (tres puntos) arriba a la derecha de Chrome.
            </Step>
            <Step n={2}>
              Toca <strong className="font-medium">"Instalar app"</strong> o <strong className="font-medium">"Añadir a pantalla de inicio"</strong>.
            </Step>
            <Step n={3}>
              Confirma tocando <strong className="font-medium">"Instalar"</strong>.
            </Step>
          </div>
        ) : (
          <div className="card-elevated rounded-2xl p-8 flex flex-col gap-4">
            <Step n={1}>
              Busca el icono de instalación en la barra de direcciones de tu navegador, a la derecha.
            </Step>
            <Step n={2}>
              Haz clic y luego en <strong className="font-medium">"Instalar"</strong>.
            </Step>
          </div>
        )}

        <p className="text-center text-[#555966] text-xs font-mono mt-6">
          ¿Prefieres seguir en el navegador?{' '}
          <a href="/dashboard" className="text-[#6E62F5] hover:underline">Ir a tu biblioteca →</a>
        </p>
      </div>
    </main>
  )
}
