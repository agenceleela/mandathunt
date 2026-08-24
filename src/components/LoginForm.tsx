'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { login } from '@/lib/auth/actions'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {pending ? 'Connexion en cours...' : 'Se connecter'}
    </button>
  )
}

export default function LoginForm() {
  const [error, formAction] = useFormState(async () => {
    await login(new FormData())
    return null
  }, null)

  return (
    <form action={async (formData) => {
      const email = formData.get('email') as string
      const password = formData.get('password') as string
      
      if (!email || !password) {
        // Gérer l'erreur localement ou via un state
        return
      }
      
      await login(formData)
    }} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
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
        <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
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

      <SubmitButton />

      <div className="text-center">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault()
            alert('Fonctionnalité à implémenter : contactez votre administrateur pour réinitialiser votre mot de passe.')
          }}
          className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          Mot de passe oublié ?
        </a>
      </div>
    </form>
  )
}
