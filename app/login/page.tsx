'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [mode, setMode]         = useState<'login' | 'signup'>('login')
  const [sent, setSent]         = useState(false)

  const supabase = createClient()

  // Google OAuth
  const handleGoogle = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  // Email + password
  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) {
        setError(error.message)
      } else {
        setSent(true)
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('Email o contraseña incorrectos.')
      } else {
        window.location.href = '/dashboard'
      }
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#111318]">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <span className="font-mono text-4xl font-medium text-[#F8F7F4] tracking-tight">
            demo<span className="text-[#7C6FFF]">.</span>
          </span>
          <p className="text-[#9BA0AD] text-sm mt-2">
            {mode === 'login' ? 'Entra en tu cuenta' : 'Crea tu cuenta gratis'}
          </p>
        </div>

        {sent ? (
          <div className="bg-[#1E2028] border border-[#7C6FFF]/30 rounded-xl p-6 text-center">
            <p className="text-[#F8F7F4] font-medium mb-2">Revisa tu email</p>
            <p className="text-[#9BA0AD] text-sm">
              Te hemos enviado un enlace de confirmación a <strong className="text-[#F8F7F4]">{email}</strong>.
              Haz clic en él para activar tu cuenta.
            </p>
          </div>
        ) : (
          <>
            {/* Google */}
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-[#1E2028] hover:bg-[#252830] border border-white/10 hover:border-white/20 text-[#F8F7F4] font-medium py-3 px-4 rounded-xl transition-all duration-150 mb-4 disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continuar con Google
            </button>

            {/* Separador */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[#555966] text-xs font-mono">o</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Formulario email */}
            <form onSubmit={handleEmail} className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-[#1E2028] border border-white/10 focus:border-[#7C6FFF]/50 text-[#F8F7F4] placeholder:text-[#555966] rounded-xl px-4 py-3 text-sm outline-none transition-colors"
              />
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
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
                {loading ? 'Cargando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
              </button>
            </form>

            {/* Toggle login/signup */}
            <p className="text-center text-[#9BA0AD] text-sm mt-4">
              {mode === 'login' ? (
                <>
                  ¿Sin cuenta?{' '}
                  <button onClick={() => setMode('signup')} className="text-[#7C6FFF] hover:underline">
                    Crear cuenta gratis
                  </button>
                </>
              ) : (
                <>
                  ¿Ya tienes cuenta?{' '}
                  <button onClick={() => setMode('login')} className="text-[#7C6FFF] hover:underline">
                    Entrar
                  </button>
                </>
              )}
            </p>
          </>
        )}
      </div>
    </main>
  )
}
