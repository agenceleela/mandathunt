'use client'

import { useState, type FormEvent } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { traduireErreur } from '@/lib/auth/erreurs'

type Mode = 'login' | 'forgot'

export default function LoginForm() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const submitLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setPending(true)
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    setPending(false)
    if (err) {
      setError(traduireErreur(err.message))
      return
    }
    window.location.href = '/'
  }

  const submitForgot = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!forgotEmail.trim()) {
      setError('Saisissez votre email.')
      return
    }
    setPending(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(
      forgotEmail.trim().toLowerCase(),
      { redirectTo: 'https://mandathunt.vercel.app/mot-de-passe' }
    )
    setPending(false)
    if (err) {
      setError(traduireErreur(err.message))
      return
    }
    setInfo('Si un compte existe, un email de réinitialisation vient d\'être envoyé.')
    setMode('login')
  }

  if (mode === 'forgot') {
    return (
      <form onSubmit={submitForgot} className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Mot de passe oublié
        </h3>
        <div>
          <label
            htmlFor="forgot-email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email
          </label>
          <input
            type="email"
            id="forgot-email"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
            placeholder="votre@email.com"
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {pending ? 'Envoi…' : 'Envoyer le lien de réinitialisation'}
        </button>
        <p className="text-center">
          <button
            type="button"
            onClick={() => setMode('login')}
            className="text-sm text-indigo-600 hover:underline"
          >
            Retour à la connexion
          </button>
        </p>
      </form>
    )
  }

  return (
    <form onSubmit={submitLogin} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Email
        </label>
        <input
          type="email"
          id="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
          placeholder="votre@email.com"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Mot de passe
        </label>
        <input
          type="password"
          id="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
          placeholder="••••••••"
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {info && <p className="text-green-600 text-sm">{info}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
      >
        {pending ? 'Connexion en cours…' : 'Se connecter'}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setMode('forgot')}
          className="text-sm text-indigo-600 hover:underline"
        >
          Mot de passe oublié ?
        </button>
      </div>
    </form>
  )
}
