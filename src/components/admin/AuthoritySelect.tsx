'use client'

import { useState, useTransition } from 'react'
import { inviteUser, setAgencyAuthority } from '@/lib/admin/actions'

export function AuthoritySelect({
  agencyId,
  admins,
  current,
}: {
  agencyId: string
  admins: { id: string; name: string }[]
  current: string | null
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')

  const change = (value: string) => {
    setError(null)
    startTransition(async () => {
      await setAgencyAuthority(agencyId, value || null)
    })
  }

  const addAdmin = async () => {
    setError(null)
    setInfo(null)
    if (!email.trim() || !firstName.trim() || !lastName.trim()) {
      setError('Tous les champs sont obligatoires.')
      return
    }
    try {
      await inviteUser(agencyId, email, 'admin', firstName, lastName)
      setInfo('Invitation admin envoyée par email.')
      setEmail('')
      setFirstName('')
      setLastName('')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erreur lors de l\'invitation.'
      )
    }
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm">
        <span className="text-gray-600">Autorité sur cette zone</span>
        <select
          value={current ?? ''}
          onChange={(e) => change(e.target.value)}
          className="mt-1 w-full rounded border border-gray-300 px-2 py-2 text-sm bg-white text-gray-900"
        >
          <option value="">Superadmin uniquement</option>
          {admins.map((a) => (
            <option key={a.id} value={a.id}>
              Superadmin + {a.name}
            </option>
          ))}
        </select>
      </label>
      {pending && <p className="text-xs text-gray-500">Enregistrement…</p>}

      <div className="space-y-2 pt-2 border-t border-gray-200">
        <span className="block text-sm font-medium text-gray-700">
          Ajouter un admin
        </span>
        <div className="grid grid-cols-2 gap-2">
          <input
            placeholder="Prénom"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="px-2 py-2 border border-gray-300 rounded bg-white text-gray-900 text-sm"
          />
          <input
            placeholder="Nom"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="px-2 py-2 border border-gray-300 rounded bg-white text-gray-900 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-2 py-2 border border-gray-300 rounded bg-white text-gray-900 text-sm"
          />
          <button
            type="button"
            onClick={addAdmin}
            className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            Ajouter un admin
          </button>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {info && <p className="text-green-600 text-sm">{info}</p>}
      </div>
    </div>
  )
}
