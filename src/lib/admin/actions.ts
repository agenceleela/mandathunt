'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function updateZone(
  agencyId: string,
  city: string,
  postalCode: string,
  radiusKm: number
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { error } = await supabase
    .from('agencies')
    .update({ city, postal_code: postalCode, radius_km: radiusKm })
    .eq('id', agencyId);

  if (error) throw error;
  revalidatePath('/reglages');
}

export async function updateCriteria(
  agencyId: string,
  criteria: {
    price_min: number | null;
    price_max: number | null;
    year_min: number | null;
    mileage_max: number | null;
    has_phone: boolean;
    sources: string[];
  }
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { error } = await supabase
    .from('agencies')
    .update({ criteria })
    .eq('id', agencyId);

  if (error) throw error;
  revalidatePath('/reglages');
}

export async function createColumn(
  agencyId: string,
  name: string,
  color: string
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Récupérer la position max
  const { data: maxPos } = await supabase
    .from('columns')
    .select('position')
    .eq('agency_id', agencyId)
    .order('position', { ascending: false })
    .limit(1)
    .single();

  const position = (maxPos?.position ?? -1) + 1;

  const { error } = await supabase
    .from('columns')
    .insert({ agency_id: agencyId, name, color, position });

  if (error) throw error;
  revalidatePath('/reglages');
  revalidatePath('/');
}

export async function updateColumn(
  columnId: string,
  name: string,
  color: string
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { error } = await supabase
    .from('columns')
    .update({ name, color })
    .eq('id', columnId);

  if (error) throw error;
  revalidatePath('/reglages');
  revalidatePath('/');
}

export async function deleteColumn(columnId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Déplacer les listings de cette colonne vers la première colonne de l'agence
  const { data: column } = await supabase
    .from('columns')
    .select('agency_id')
    .eq('id', columnId)
    .single();

  if (!column) throw new Error('Colonne introuvable');

  const { data: firstColumn } = await supabase
    .from('columns')
    .select('id')
    .eq('agency_id', column.agency_id)
    .neq('id', columnId)
    .order('position', { ascending: true })
    .limit(1)
    .single();

  if (firstColumn) {
    await supabase
      .from('listings')
      .update({ column_id: firstColumn.id })
      .eq('column_id', columnId);
  }

  const { error } = await supabase.from('columns').delete().eq('id', columnId);

  if (error) throw error;
  revalidatePath('/reglages');
  revalidatePath('/');
}

export async function reorderColumns(columnIds: string[]): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  for (let i = 0; i < columnIds.length; i++) {
    const { error } = await supabase
      .from('columns')
      .update({ position: i })
      .eq('id', columnIds[i]);

    if (error) throw error;
  }

  revalidatePath('/reglages');
  revalidatePath('/');
}

export async function inviteUser(
  agencyId: string,
  email: string,
  role: 'admin' | 'agent',
  firstName: string,
  lastName: string
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Créer l'utilisateur Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: Math.random().toString(36).slice(-12) + 'A1!', // Mot de passe temporaire
    email_confirm: true,
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('Utilisateur non créé');

  // Créer le profil
  const { error: profileError } = await supabase.from('profiles').insert({
    id: authData.user.id,
    agency_id: agencyId,
    role,
    email,
    first_name: firstName,
    last_name: lastName,
  });

  if (profileError) throw profileError;
  revalidatePath('/reglages');
}

export async function updateUserRole(
  userId: string,
  role: 'admin' | 'agent'
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId);

  if (error) throw error;
  revalidatePath('/reglages');
}

export async function removeUser(userId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Supprimer le profil
  const { error } = await supabase.from('profiles').delete().eq('id', userId);

  if (error) throw error;

  // Supprimer l'utilisateur Auth
  const { error: authError } = await supabase.auth.admin.deleteUser(userId);

  if (authError) throw authError;
  revalidatePath('/reglages');
}
