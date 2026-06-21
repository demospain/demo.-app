'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const [password, setPassword]     = useState('')
  const [password2, setPassword2]   = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [done, setDone]             = useState(false)
  const [checking, setChecking]     = useState(true)
  const [hasSession, setHasSession] = useState(false)

  const router   = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session)
      setChecking(false)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== password2) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setDone(true)
      setLoading(false)
      setTimeout(() => router.push('/dashboard'), 1500)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#111318]">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <span className="font-mono text-4xl font-medium text-[#F8F7F4] tracking-tight">
            demo<span className="text-[#7C6FFF]">.</span>
          </span>
          <p className="text-[#9BA0AD] text-sm mt-2">Pon tu contraseña nueva</p>
        </div>

        {checking ? (
          <p className="text-[#555966] text-sm text-center font-mono">Comprobando enlace...</p>
        ) : !hasSession ? (
          <div className="bg-[#1E2028] border border-red-400/30 rounded-xl p-6 text-center">
            <p className="text-[#F8F7F4] font-medium mb-2">Enlace no válido</p>
            <p className="text-[#9BA0AD] text-sm">
              Este enlace ha caducado o ya se usó. Pide uno nuevo desde la pantalla de inicio de sesión.
            </p>
          </div>
        ) : done ? (
          <div className="bg-[#1E2028] border border-[#7C6FFF]/30 rounded-xl p-6 text-center">
            <p className="text-[#F8F7F4] font-medium mb-2">Contraseña actualizada</p>
            <p className="text-[#9BA0AD] text-sm">Te llevamos a tu biblioteca...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="password"
              placeholder="Contraseña nueva"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-[#1E2028] border border-white/10 focus:border-[#7C6FFF]/50 text-[#F8F7F4] placeholder:text-[#555966] rounded-xl px-4 py-3 text-sm outline-none transition-colors"
            />
            <input
              type="password"
              placeholder="Repite la contraseña"
              value={password2}
              onChange={e => setPassword2(e.target.value)}
              required
              minLength={6}
              className="w-full bg-[#1E2028] border border-white/10 focus:border-[#7C6FFF]/50 text-[#F8F7F4] placeholder:text-[#555966] rounded-xl px-4 py-3 text-sm outline-none transition-colors"
            />

            {error && (
              <p className="text-red-400 text-xs font-mono">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#7C6FFF] hover:bg-[#4A3FCC] text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar contraseña'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
