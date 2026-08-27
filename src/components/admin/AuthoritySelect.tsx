'use client';

import { useState, useActionState } from 'react';
import { setAuthorityAdmin } from '@/lib/admin/actions';

interface AuthoritySelectProps {
  agencyId: string;
  currentAdminId?: string | null;
  agencyAdmins: Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  }>;
}

export function AuthoritySelect({
  agencyId,
  currentAdminId,
  agencyAdmins,
}: AuthoritySelectProps) {
  const [selectedAdmin, setSelectedAdmin] = useState<string | null>(
    currentAdminId || ''
  );
  const [state, formAction, isPending] = useActionState(
    async (_prevState: unknown, formData: FormData) => {
      const adminId = formData.get('adminId') as string;
      try {
        await setAuthorityAdmin(agencyId, adminId || null);
        return { success: true, error: null };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Erreur lors de la mise à jour',
        };
      }
    },
    null
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    formAction(new FormData(e.currentTarget));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="adminId"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Autorité sur les réglages
        </label>
        <select
          id="adminId"
          name="adminId"
          value={selectedAdmin || ''}
          onChange={(e) => setSelectedAdmin(e.target.value || null)}
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Superadmin uniquement</option>
          {agencyAdmins.map((admin) => (
            <option key={admin.id} value={admin.id}>
              Superadmin + {admin.first_name} {admin.last_name} ({admin.email})
            </option>
          ))}
        </select>
        <p className="mt-2 text-sm text-gray-600">
          {selectedAdmin
            ? 'Le superadmin et l\'admin sélectionné pourront modifier les réglages de cette agence.'
            : 'Seul le superadmin pourra modifier les réglages de cette agence.'}
        </p>
      </div>

      {state?.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{state.error}</p>
        </div>
      )}

      {state?.success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">
            Autorité mise à jour avec succès
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Enregistrement...' : 'Enregistrer'}
      </button>
    </form>
  );
}
