'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { login } from '@/lib/auth/actions'

type Mode = 'login' | 'set-password' | 'forgot'

export default function LoginForm() {
  const [mode, setMode] = useState<Mode>('login')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '')
    const params = new URLSearchParams(hash)
    const type = params.get('type')
    if (type === 'invite' || type === 'recovery') {
      setMode('set-password')
    }
  }, [])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const submitNewPassword = async () => {
    setError(null)
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }
    if (password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas')
      return
    }
    setPending(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setPending(false)
    if (err) {
      setError(err.message)
      return
    }
    window.location.href = '/'
  }

  const submitForgot = async () => {
    setError(null)
    if (!forgotEmail.trim()) {
      setError('Saisissez votre email')
      return
    }
    setPending(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(
      forgotEmail.trim().toLowerCase(),
      { redirectTo: 'https://mandathunt.vercel.app/login' }
    )
    setPending(false)
    if (err) {
      setError(err.message)
      return
    }
    setInfo('Si un compte existe, un email de réinitialisation vient d\'être envoyé.')
    setMode('login')
  }

  if (mode === 'set-password') {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Choisissez votre mot de passe
        </h3>
        <div>
          <label
            htmlFor="new-password"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
          >
            Nouveau mot de passe
          </label>
          <input
            type="password"
            id="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label
            htmlFor="confirm-password"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
          >
            Confirmer le mot de passe
          </label>
          <input
            type="password"
            id="confirm-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="button"
          onClick={submitNewPassword}
          disabled={pending}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {pending ? 'Enregistrement…' : 'Enregistrer et accéder'}
        </button>
      </div>
    )
  }

  if (mode === 'forgot') {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Mot de passe oublié
        </h3>
        <div>
          <label
            htmlFor="forgot-email"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
          >
            Email
          </label>
          <input
            type="email"
            id="forgot-email"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="votre@email.com"
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="button"
          onClick={submitForgot}
          disabled={pending}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {pending ? 'Envoi…' : 'Envoyer le lien de réinitialisation'}
        </button>
        <p className="text-center">
          <button
            type="button"
            onClick={() => setMode('login')}
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            Retour à la connexion
          </button>
        </p>
      </div>
    )
  }

  return (
    <form
      action={async (formData) => {
        await login(formData)
      }}
      className="space-y-4"
    >
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
        >
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          autoComplete="email"
          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="votre@email.com"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
        >
          Mot de passe
        </label>
        <input
          type="password"
          id="password"
          name="password"
          required
          autoComplete="current-password"
          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
      >
        Se connecter
      </button>

      {info && <p className="text-green-600 text-sm text-center">{info}</p>}

      <div className="text-center">
        <button
          type="button"
          onClick={() => setMode('forgot')}
          className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          Mot de passe oublié ?
        </button>
      </div>
    </form>
  )
}
