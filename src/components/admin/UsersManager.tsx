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
}

export function UsersManager({
  agencyId,
  initialUsers,
  currentUserId,
}: UsersManagerProps) {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [role, setRole] = useState<'admin' | 'agent'>('agent')
  const [error, setError] = useState<string | null>(null)

  const handleInvite = async () => {
    setError(null)
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
    } catch {
      setError("Erreur lors de la création de l'utilisateur")
    }
  }

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'agent') => {
    try {
      await updateUserRole(userId, newRole)
    } catch {
      setError('Erreur lors du changement de rôle')
    }
  }

  const handleRemove = async (userId: string) => {
    if (!confirm('Supprimer cet utilisateur ?')) return
    try {
      await removeUser(userId)
    } catch {
      setError('Erreur lors de la suppression')
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Utilisateurs de l'agence</h3>
        <div className="space-y-2">
          {initialUsers.map((user) => (
            <div key={user.id} className="flex items-center gap-2 p-2 border rounded">
              <div className="flex-1">
                <div className="font-medium">
                  {user.first_name} {user.last_name}
                </div>
                <div className="text-sm text-gray-600">{user.email}</div>
              </div>
              {user.id !== currentUserId && user.role !== 'superadmin' && (
                <>
                  <select
                    value={user.role}
                    onChange={(e) =>
                      handleRoleChange(
                        user.id,
                        e.target.value as 'admin' | 'agent'
                      )
                    }
                    className="px-3 py-1 border border-gray-300 rounded text-gray-900"
                  >
                    <option value="admin">Admin</option>
                    <option value="agent">Agent</option>
                  </select>
                  <button
                    onClick={() => handleRemove(user.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Supprimer
                  </button>
                </>
              )}
              {user.role === 'superadmin' && (
                <span className="text-sm text-gray-500">Superadmin</span>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-4 pt-4 border-t">
        <h3 className="font-semibold text-lg">Inviter un utilisateur</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium mb-1">
              Prénom
            </label>
            <input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium mb-1">
              Nom
            </label>
            <input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900"
            />
          </div>
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900"
          />
        </div>
        <div>
          <label htmlFor="role" className="block text-sm font-medium mb-1">
            Rôle
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as 'admin' | 'agent')}
            className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900"
          >
            <option value="admin">Admin</option>
            <option value="agent">Agent</option>
          </select>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
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
