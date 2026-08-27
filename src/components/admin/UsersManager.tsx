'use client'

import { useState } from 'react'
import { inviteUser, updateUserRole, removeUser } from '@/lib/admin/actions'

export type UserRow = {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  role: string
}

interface UsersManagerProps {
  agencyId: string
  initialUsers: UserRow[]
  currentUserId: string
  canCreateAdmins: boolean
}

export function UsersManager({
  agencyId,
  initialUsers,
  currentUserId,
  canCreateAdmins,
}: UsersManagerProps) {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [role, setRole] = useState<'admin' | 'agent'>('agent')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const handleInvite = async () => {
    setError(null)
    setInfo(null)
    if (!email.trim() || !firstName.trim() || !lastName.trim()) {
      setError('Tous les champs sont obligatoires')
      return
    }
    try {
      await inviteUser(agencyId, email, role, firstName, lastName)
      setEmail('')
      setFirstName('')
      setLastName('')
      setRole('agent')
      setInfo('Invitation envoyée par email.')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erreur lors de l\'invitation'
      )
    }
  }

  const handleRoleChange = async (
    userId: string,
    newRole: 'admin' | 'agent'
  ) => {
    setError(null)
    try {
      await updateUserRole(userId, newRole)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    }
  }

  const handleRemove = async (userId: string) => {
    if (!confirm('Supprimer cet utilisateur ?')) return
    setError(null)
    try {
      await removeUser(userId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-semibold text-lg text-gray-900">
          Utilisateurs de l'agence
        </h3>
        <div className="space-y-2">
          {initialUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-2 p-2 border border-gray-300 rounded bg-white"
            >
              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  {user.first_name} {user.last_name}
                </div>
                <div className="text-sm text-gray-600">{user.email}</div>
              </div>
              {user.role === 'superadmin' && (
                <span className="text-sm text-gray-500">Superadmin</span>
              )}
              {user.id !== currentUserId && user.role !== 'superadmin' && (
                <>
                  {canCreateAdmins ? (
                    <select
                      value={user.role}
                      onChange={(e) =>
                        handleRoleChange(
                          user.id,
                          e.target.value as 'admin' | 'agent'
                        )
                      }
                      className="px-3 py-1 border border-gray-300 rounded text-gray-900 bg-white"
                    >
                      <option value="admin">Admin</option>
                      <option value="agent">Agent</option>
                    </select>
                  ) : (
                    <span className="text-sm text-gray-600">
                      {user.role === 'admin' ? 'Admin' : 'Agent'}
                    </span>
                  )}
                  <button
                    onClick={() => handleRemove(user.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Supprimer
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-gray-200">
        <h3 className="font-semibold text-lg text-gray-900">
          Inviter un utilisateur
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Prénom
            </label>
            <input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-gray-900"
            />
          </div>
          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nom
            </label>
            <input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-gray-900"
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-gray-900"
          />
        </div>
        <div>
          <label
            htmlFor="role"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Rôle
          </label>
          {canCreateAdmins ? (
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'agent')}
              className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-gray-900"
            >
              <option value="agent">Agent</option>
              <option value="admin">Admin</option>
            </select>
          ) : (
            <p className="text-sm text-gray-600">
              Agent (seul un superadmin peut créer des admins)
            </p>
          )}
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {info && <p className="text-green-600 text-sm">{info}</p>}
        <button
          onClick={handleInvite}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Inviter
        </button>
      </div>
    </div>
  )
}
