'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Lock, Shield } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.push('/dashboard')
    })
  }, [router])

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email o contraseña incorrectos')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-600/20 border border-yellow-600/30 mb-4">
            <Shield size={32} className="text-yellow-500" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wider">SAC-PAP 2026</h1>
          <p className="text-gray-500 text-sm mt-1">Sistema de Control de Gestión</p>
          <p className="text-gray-600 text-xs mt-1">Ejército Argentino</p>
        </div>

        {/* Form */}
        <form onSubmit={login} className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500 transition-colors"
              placeholder="usuario@ejercito.mil.ar"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950 border border-red-900 rounded-lg px-3 py-2">
              <Lock size={14} /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-700 text-gray-900 font-semibold py-2.5 rounded-lg transition-colors text-sm tracking-wider">
            {loading ? 'Ingresando...' : 'INGRESAR'}
          </button>
        </form>

        <p className="text-center text-gray-700 text-xs mt-6">
          PAP 2026 · Dir. Gral. Personal y Bienestar
        </p>
      </div>
    </div>
  )
}
