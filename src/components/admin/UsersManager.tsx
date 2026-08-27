"use client";

import { useState } from "react";
import { useActionState } from "react";
import { deleteUserAction, inviteUserAction } from "@/lib/admin/actions";
import { SubmitButton } from "@/components/SubmitButton";

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role: "superadmin" | "admin" | "agent";
};

// Composant isolé pour éviter l'erreur React #441 (Hooks dans une boucle .map)
function DeleteUserForm({ userId, isSuperadmin }: { userId: string; isSuperadmin: boolean }) {
  const [state, formAction, isPending] = useActionState(deleteUserAction, null);

  if (!isSuperadmin) return null;

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="userId" value={userId} />
      <SubmitButton variant="destructive" size="sm" className="h-8 px-3 text-xs">
        {isPending ? "..." : "Supprimer"}
      </SubmitButton>
      {state?.error && <p className="text-xs text-red-500 mt-1 absolute">{state.error}</p>}
    </form>
  );
}

export function UsersManager({ users, currentAgencyId, isSuperadmin }: { 
  users: Profile[]; 
  currentAgencyId: string;
  isSuperadmin: boolean;
}) {
  const [state, formAction, isPending] = useActionState(inviteUserAction, null);
  const [selectedRole, setSelectedRole] = useState<"admin" | "agent">("agent");

  const displayedUsers = isSuperadmin 
    ? users 
    : users.filter(u => u.role !== "superadmin");

  return (
    <div className="space-y-6">
      <form action={formAction} className="flex flex-col sm:flex-row gap-3 items-end sm:items-center bg-slate-50 p-4 rounded-lg border border-slate-200">
        <div className="flex-1 w-full">
          <label className="text-sm font-medium mb-1 block text-slate-700">Email du nouveau membre</label>
          <input 
            name="email" 
            type="email" 
            placeholder="prenom.nom@exemple.com" 
            required 
            className="flex h-9 w-full rounded-md border border-slate-300 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <div className="w-full sm:w-48">
          <label className="text-sm font-medium mb-1 block text-slate-700">Rôle</label>
          <select 
            name="role"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as "admin" | "agent")}
            className="flex h-9 w-full items-center justify-between rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="admin">Admin (Chef d'agence)</option>
            <option value="agent">Agent (Téléprospecteur)</option>
          </select>
        </div>
        <input type="hidden" name="agencyId" value={currentAgencyId} />
        
        <SubmitButton className="w-full sm:w-auto mt-4 sm:mt-0">
          Inviter
        </SubmitButton>
      </form>

      {state?.error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="p-3 bg-green-50 text-green-700 rounded-md text-sm border border-green-200">
          {state.success}
        </div>
      )}

      <div className="border rounded-lg overflow-hidden border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left p-3 font-medium text-slate-700">Nom</th>
              <th className="text-left p-3 font-medium text-slate-700">Email</th>
              <th className="text-left p-3 font-medium text-slate-700">Rôle</th>
              <th className="text-right p-3 font-medium text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {displayedUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-3 font-medium text-slate-900">
                  {user.first_name} {user.last_name}
                </td>
                <td className="p-3 text-slate-600">{user.email}</td>
                <td className="p-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    user.role === "admin" ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-800"
                  }`}>
                    {user.role === "admin" ? "Admin" : "Agent"}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <DeleteUserForm userId={user.id} isSuperadmin={isSuperadmin} />
                </td>
              </tr>
            ))}
            {displayedUsers.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-slate-500">
                  Aucun utilisateur dans cette agence.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
