"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Helper pour vérifier les droits d'administration d'une agence
async function checkAgencyAdminRights(agencyId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, agencies(authority_admin_id)")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("Profil introuvable");

  const isSuperadmin = profile.role === "superadmin";
  const isAgencyAdmin = profile.role === "admin" && profile.agencies?.authority_admin_id === user.id;

  if (!isSuperadmin && !isAgencyAdmin) {
    throw new Error("Non autorisé à modifier les réglages de cette agence");
  }

  return { user, isSuperadmin };
}

export async function inviteUserAction(prevState: any, formData: FormData) {
  try {
    const agencyId = formData.get("agencyId") as string;
    const email = formData.get("email") as string;
    const role = formData.get("role") as "admin" | "agent";

    await checkAgencyAdminRights(agencyId);

    const supabase = await createClient();
    
    // Utilisation de l'API admin de Supabase pour inviter un utilisateur
    // Cela déclenche l'email via le SMTP Brevo configuré
    const { error: authError } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://mandathunt.vercel.app'}/mot-de-passe`,
      data: {
        agency_id: agencyId,
        role: role
      }
    });

    if (authError) {
      return { error: "Erreur lors de l'invitation : " + authError.message };
    }

    revalidatePath("/reglages");
    return { success: `Invitation envoyée à ${email}` };
  } catch (error: any) {
    return { error: error.message || "Une erreur inattendue est survenue" };
  }
}

export async function deleteUserAction(prevState: any, formData: FormData) {
  try {
    const userId = formData.get("userId") as string;
    
    // On récupère l'agencyId via l'utilisateur cible pour vérifier les droits
    const supabase = await createClient();
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("agency_id")
      .eq("id", userId)
      .single();

    if (!targetProfile) {
      return { error: "Utilisateur introuvable" };
    }

    await checkAgencyAdminRights(targetProfile.agency_id);

    // Suppression du profil (la cascade ou un trigger devrait gérer auth.users, 
    // ou on utilise l'API admin si nécessaire. Ici on supprime la ligne profile)
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (error) {
      return { error: "Erreur lors de la suppression : " + error.message };
    }

    revalidatePath("/reglages");
    return { success: "Utilisateur supprimé avec succès" };
  } catch (error: any) {
    return { error: error.message || "Une erreur inattendue est survenue" };
  }
}

export async function addColumnAction(prevState: any, formData: FormData) {
  try {
    const agencyId = formData.get("agencyId") as string;
    const name = formData.get("name") as string;
    const color = formData.get("color") as string || "slate";

    await checkAgencyAdminRights(agencyId);

    const supabase = await createClient();
    
    // Obtenir la position maximale actuelle pour la nouvelle colonne
    const { data: columns } = await supabase
      .from("columns")
      .select("position")
      .eq("agency_id", agencyId)
      .order("position", { ascending: false })
      .limit(1);

    const newPosition = columns && columns.length > 0 ? columns[0].position + 1 : 1;

    const { error } = await supabase
      .from("columns")
      .insert({ 
        agency_id: agencyId, 
        name, 
        color, 
        position: newPosition 
      });

    if (error) {
      return { error: "Erreur lors de l'ajout de la colonne : " + error.message };
    }

    revalidatePath("/reglages");
    return { success: "Colonne ajoutée" };
  } catch (error: any) {
    return { error: error.message || "Une erreur inattendue est survenue" };
  }
}

export async function deleteColumnAction(formData: FormData) {
  try {
    const columnId = formData.get("columnId") as string;
    const agencyId = formData.get("agencyId") as string;

    await checkAgencyAdminRights(agencyId);

    const supabase = await createClient();
    const { error } = await supabase
      .from("columns")
      .delete()
      .eq("id", columnId);

    if (error) {
      throw new Error("Erreur lors de la suppression de la colonne : " + error.message);
    }

    revalidatePath("/reglages");
  } catch (error: any) {
    console.error("deleteColumnAction error:", error);
    // On ne retourne pas d'erreur au formulaire ici car c'est un bouton direct, 
    // mais on pourrait ajouter un toast côté client si nécessaire.
  }
}

export async function updateAuthorityAction(prevState: any, formData: FormData) {
  try {
    const agencyId = formData.get("agencyId") as string;
    const newAdminId = formData.get("newAdminId") as string; // Peut être "null" ou "none"

    // Seul le superadmin peut changer l'autorité
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Non authentifié");

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "superadmin") {
      throw new Error("Seul le superadmin peut modifier l'autorité de l'agence");
    }

    const valueToSet = newAdminId === "none" || newAdminId === "" ? null : newAdminId;

    const { error } = await supabase
      .from("agencies")
      .update({ authority_admin_id: valueToSet })
      .eq("id", agencyId);

    if (error) {
      return { error: "Erreur lors de la mise à jour de l'autorité : " + error.message };
    }

    revalidatePath("/reglages");
    return { success: "Autorité de gestion mise à jour" };
  } catch (error: any) {
    return { error: error.message || "Une erreur inattendue est survenue" };
  }
}
