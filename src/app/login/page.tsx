'use client'

import Link from 'next/link'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Loader2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, Field, TextInput } from '@/components/ui/field'

/** Só aceita caminhos internos (evita redireccionamentos para outros sites). */
function safeNext(): string {
  const next = new URLSearchParams(window.location.search).get('next')
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', { email, password, redirect: false })

    if (result?.error) {
      setLoading(false)
      setError('Email ou palavra-passe incorrectos.')
    } else {
      // Navegação completa para o layout do admin ler a nova sessão
      window.location.href = safeNext()
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-primary text-on-primary">
            <Lock className="h-5 w-5" />
          </span>
          <h1 className="mt-4 text-2xl font-semibold text-on-surface">BlokManager</h1>
          <p className="mt-1 text-body-sm text-on-surface-variant">Área de administração</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-outline-variant bg-white p-6 shadow-sm">
          {error && <Alert>{error}</Alert>}
          <Field label="Email" htmlFor="email" required>
            <TextInput id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label="Palavra-passe" htmlFor="password" required>
            <TextInput id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          <Button type="submit" disabled={loading} className="h-11 w-full bg-primary font-semibold text-on-primary hover:bg-primary/90">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'A entrar…' : 'Entrar'}
          </Button>
        </form>

        <p className="text-center text-body-sm text-on-surface-variant">
          <Link href="/" className="hover:text-primary">← Voltar à loja</Link>
        </p>
      </div>
    </div>
  )
}
