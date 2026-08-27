'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { traduireErreur } from '@/lib/auth/erreurs'

export default function SetPasswordForm() {
  const [ready, setReady] = useState(false)
  const [invalid, setInvalid] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const init = async () => {
      const hash = window.location.hash.replace(/^#/, '')
      const params = new URLSearchParams(hash)
      const code = params.get('code')
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (error) throw error
        } else {
          const { data } = await supabase.auth.getSession()
          if (!data.session) {
            setInvalid(true)
            return
          }
        }
        setReady(true)
      } catch {
        setInvalid(true)
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (invalid) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-red-600">
          Lien expiré ou invalide. Demandez un nouveau lien à votre
          administrateur.
        </p>
        <a href="/login" className="text-sm text-indigo-600 hover:underline">
          Retour à la connexion
        </a>
      </div>
    )
  }

  if (!ready) {
    return <p className="text-sm text-gray-600">Vérification du lien…</p>
  }

  const submit = async () => {
    setError(null)
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    if (password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }
    setPending(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setPending(false)
    if (err) {
      setError(traduireErreur(err.message))
      return
    }
    window.location.href = '/'
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">
        Choisissez votre mot de passe
      </h2>
      <div>
        <label
          htmlFor="new-password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Nouveau mot de passe
        </label>
        <input
          type="password"
          id="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
        />
      </div>
      <div>
        <label
          htmlFor="confirm-password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Confirmer le mot de passe
        </label>
        <input
          type="password"
          id="confirm-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
        />
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
      >
        {pending ? 'Enregistrement…' : 'Enregistrer et accéder'}
      </button>
    </div>
  )
}
