'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { inviteUser, updateUserRole, removeUser } from '@/lib/admin/actions'

export type UserRow = {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  role: 'superadmin' | 'admin' | 'agent'
}

interface UsersManagerProps {
  agencyId: string
  initialUsers: UserRow[]
  currentUserId: string
}

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
const selectClass =
  'px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
const btnClass =
  'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
const btnDestructiveClass =
  'px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50'

export function UsersManager({
  agencyId,
  initialUsers,
  currentUserId,
}: UsersManagerProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [role, setRole] = useState<'admin' | 'agent'>('agent')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const run = (fn: () => Promise<void>, ok?: string) => {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      try {
        await fn()
        if (ok) setSuccess(ok)
        router.refresh()
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Une erreur est survenue'
        )
      }
    })
  }

  const handleInvite = () => {
    if (!email.trim() || !firstName.trim() || !lastName.trim()) {
      setError('Tous les champs sont obligatoires')
      return
    }
    const invEmail = email.trim()
    run(async () => {
      await inviteUser(agencyId, invEmail, role, firstName.trim(), lastName.trim())
      setEmail('')
      setFirstName('')
      setLastName('')
      setRole('agent')
    }, `Invitation envoyée à ${invEmail}`)
  }

  const handleRoleChange = (userId: string, newRole: 'admin' | 'agent') => {
    run(() => updateUserRole(userId, newRole))
  }

  const handleRemove = (userId: string) => {
    if (!window.confirm('Supprimer cet utilisateur ?')) return
    run(() => removeUser(userId), 'Utilisateur supprimé')
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {initialUsers.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-2 p-2 border rounded"
          >
            <div className="flex-1">
              <div className="font-medium">
                {user.first_name ?? ''} {user.last_name ?? ''}
              </div>
              <div className="text-sm text-gray-600">{user.email ?? ''}</div>
            </div>
            {user.id !== currentUserId && user.role !== 'superadmin' && (
              <>
                <select
                  value={user.role}
                  disabled={pending}
                  onChange={(e) =>
                    handleRoleChange(
                      user.id,
                      e.target.value as 'admin' | 'agent'
                    )
                  }
                  className={selectClass}
                >
                  <option value="admin">Admin</option>
                  <option value="agent">Agent</option>
                </select>
                <button
                  onClick={() => handleRemove(user.id)}
                  disabled={pending}
                  className={btnDestructiveClass}
                >
                  Supprimer
                </button>
              </>
            )}
            {user.role === 'superadmin' && (
              <span className="text-sm text-gray-500 italic">Superadmin</span>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h3 className="font-semibold">Inviter un utilisateur</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Prénom</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nom</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Rôle</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'admin' | 'agent')}
            className={selectClass}
          >
            <option value="admin">Admin</option>
            <option value="agent">Agent</option>
          </select>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}
        {pending && <p className="text-xs text-gray-500">Enregistrement…</p>}
        <button onClick={handleInvite} disabled={pending} className={btnClass}>
          Inviter
        </button>
      </div>
    </div>
  )
}