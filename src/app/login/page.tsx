'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError('Email ou palavra-passe incorrectos.')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-on-surface">BlokManager</h1>
          <p className="text-body-sm text-on-surface-variant mt-1">Área administrativa</p>
        </div>

        <div className="rounded-md border border-outline-variant bg-surface-container-lowest p-6 space-y-4">
          <h2 className="text-title-md font-medium text-on-surface">Entrar</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-label-caps text-on-surface-variant uppercase tracking-widest">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@blokmanager.com"
                required
                className="h-11 bg-white border border-outline-variant rounded-md px-3 text-on-surface text-body-sm focus:border-primary outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-label-caps text-on-surface-variant uppercase tracking-widest">Palavra-passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-11 bg-white border border-outline-variant rounded-md px-3 text-on-surface text-body-sm focus:border-primary outline-none"
              />
            </div>

            {error && (
              <p className="text-body-sm text-red-500">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-primary text-on-primary rounded-md text-body-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'A entrar...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-label-caps text-on-surface-variant">
          BlokManager Moz © 2024
        </p>
      </div>
    </div>
  )
}