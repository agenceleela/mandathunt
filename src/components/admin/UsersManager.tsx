'use client';

import { useState } from 'react';
import { inviteUser, updateUserRole, removeUser } from '@/lib/admin/actions';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'superadmin' | 'admin' | 'agent';
}

interface UsersManagerProps {
  agencyId: string;
  initialUsers: User[];
  currentUserId: string;
}

export function UsersManager({ agencyId, initialUsers, currentUserId }: UsersManagerProps) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'admin' | 'agent'>('agent');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleInvite = async () => {
    setError(null);
    setSuccess(null);
    if (!email || !firstName || !lastName) {
      setError('Tous les champs sont obligatoires');
      return;
    }
    setPending(true);
    try {
      await inviteUser(agencyId, email, role, firstName, lastName);
      setSuccess(`Invitation envoyée à ${email}`);
      setEmail('');
      setFirstName('');
      setLastName('');
      setRole('agent');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création de l\'utilisateur');
    } finally {
      setPending(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'agent') => {
    try {
      await updateUserRole(userId, newRole);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour du rôle');
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    setPending(true);
    try {
      await removeUser(userId);
      setSuccess('Utilisateur supprimé');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression');
    } finally {
      setPending(false);
    }
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
  const selectClass = "px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white";
  const btnClass = "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const btnDestructiveClass = "px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50";

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-semibold">Utilisateurs de l'agence</h3>
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
                    onChange={(e) => handleRoleChange(user.id, e.target.value as 'admin' | 'agent')}
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
        <button 
          onClick={handleInvite} 
          disabled={pending}
          className={btnClass}
        >
          {pending ? 'Envoi en cours...' : 'Inviter'}
        </button>
      </div>
    </div>
  );
}
