'use client';

import { useState } from 'react';
import { inviteUser, updateUserRole, removeUser } from '@/lib/admin/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

  const handleInvite = async () => {
    setError(null);
    if (!email || !firstName || !lastName) {
      setError('Tous les champs sont obligatoires');
      return;
    }
    try {
      await inviteUser(agencyId, email, role, firstName, lastName);
      setEmail('');
      setFirstName('');
      setLastName('');
      setRole('agent');
    } catch (err) {
      setError('Erreur lors de la création de l\'utilisateur');
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'agent') => {
    await updateUserRole(userId, newRole);
  };

  const handleRemove = async (userId: string) => {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    await removeUser(userId);
  };

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
                  <Select
                    value={user.role}
                    onValueChange={(value: 'admin' | 'agent') => handleRoleChange(user.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="destructive" onClick={() => handleRemove(user.id)}>
                    Supprimer
                  </Button>
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
        <h3 className="font-semibold">Inviter un utilisateur</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">Prénom</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="lastName">Nom</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="role">Rôle</Label>
          <Select value={role} onValueChange={(value: 'admin' | 'agent') => setRole(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="agent">Agent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <Button onClick={handleInvite}>Inviter</Button>
      </div>
    </div>
  );
}
