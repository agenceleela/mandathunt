"use client";

import { useState } from "react";
import { useActionState } from "react-dom";
import { deleteUserAction, inviteUserAction } from "@/lib/admin/actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role: "superadmin" | "admin" | "agent";
};

// Composant isolé pour éviter l'erreur React #441 (Hooks dans une boucle)
function DeleteUserForm({ userId, isSuperadmin }: { userId: string; isSuperadmin: boolean }) {
  const [state, formAction, isPending] = useActionState(deleteUserAction, null);

  if (!isSuperadmin) return null; // Seul le superadmin peut supprimer

  return (
    <form action={formAction}>
      <input type="hidden" name="userId" value={userId} />
      <SubmitButton variant="destructive" size="sm" disabled={isPending}>
        {isPending ? "Suppression..." : "Supprimer"}
      </SubmitButton>
      {state?.error && <p className="text-xs text-red-500 mt-1">{state.error}</p>}
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

  // Filtrer pour n'afficher que les utilisateurs de l'agence actuelle (ou tous si superadmin)
  const displayedUsers = isSuperadmin 
    ? users 
    : users.filter(u => u.id !== "superadmin-global"); // Ajuste selon ta logique de filtrage

  return (
    <div className="space-y-6">
      {/* Titre supprimé ici pour éviter le doublon avec la page parente */}
      
      {/* Formulaire d'invitation */}
      <form action={formAction} className="flex flex-col sm:flex-row gap-3 items-end sm:items-center bg-muted/30 p-4 rounded-lg border">
        <div className="flex-1 w-full">
          <label className="text-sm font-medium mb-1 block">Email du nouveau membre</label>
          <Input 
            name="email" 
            type="email" 
            placeholder="prenom.nom@exemple.com" 
            required 
            className="w-full"
          />
        </div>
        <div className="w-full sm:w-48">
          <label className="text-sm font-medium mb-1 block">Rôle</label>
          <Select value={selectedRole} onValueChange={(v: "admin" | "agent") => setSelectedRole(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un rôle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin (Chef d'agence)</SelectItem>
              <SelectItem value="agent">Agent (Téléprospecteur)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <input type="hidden" name="agencyId" value={currentAgencyId} />
        <input type="hidden" name="role" value={selectedRole} />
        
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

      {/* Liste des utilisateurs */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Nom</th>
              <th className="text-left p-3 font-medium">Email</th>
              <th className="text-left p-3 font-medium">Rôle</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {displayedUsers.map((user) => (
              <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                <td className="p-3">
                  {user.first_name} {user.last_name}
                </td>
                <td className="p-3 text-muted-foreground">{user.email}</td>
                <td className="p-3">
                  <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                    {user.role === "admin" ? "Admin" : "Agent"}
                  </Badge>
                </td>
                <td className="p-3 text-right">
                  <DeleteUserForm userId={user.id} isSuperadmin={isSuperadmin} />
                </td>
              </tr>
            ))}
            {displayedUsers.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-muted-foreground">
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
