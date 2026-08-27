'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

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
  if (!user) throw new Error('Non authentifié');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, agency_id')
    .eq('id', user.id)
    .single();

  if (!profile) throw new Error('Profil introuvable');

  const isSuperadmin = profile.role === 'superadmin';
  const isAdminWithAuthority =
    profile.role === 'admin' && profile.agency_id === agencyId;

  if (!isSuperadmin && !isAdminWithAuthority) {
    throw new Error('Permission refusée');
  }

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
    price_min?: number;
    price_max?: number;
    year_min?: number;
    mileage_max?: number;
    has_phone?: boolean;
    sources?: string[];
  }
): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, agency_id')
    .eq('id', user.id)
    .single();

  if (!profile) throw new Error('Profil introuvable');

  const isSuperadmin = profile.role === 'superadmin';
  const isAdminWithAuthority =
    profile.role === 'admin' && profile.agency_id === agencyId;

  if (!isSuperadmin && !isAdminWithAuthority) {
    throw new Error('Permission refusée');
  }

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
  if (!user) throw new Error('Non authentifié');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, agency_id')
    .eq('id', user.id)
    .single();

  if (!profile) throw new Error('Profil introuvable');

  const isSuperadmin = profile.role === 'superadmin';
  const isAdminWithAuthority =
    profile.role === 'admin' && profile.agency_id === agencyId;

  if (!isSuperadmin && !isAdminWithAuthority) {
    throw new Error('Permission refusée');
  }

  const { data: maxPos } = await supabase
    .from('columns')
    .select('position')
    .eq('agency_id', agencyId)
    .order('position', { ascending: false })
    .limit(1)
    .single();

  const position = maxPos ? maxPos.position + 1 : 0;

  const { error } = await supabase.from('columns').insert({
    agency_id: agencyId,
    name,
    color,
    position,
  });

  if (error) throw error;

  revalidatePath('/reglages');
  revalidatePath('/');
}

export async function updateColumn(
  agencyId: string,
  columnId: string,
  name: string,
  color: string
): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, agency_id')
    .eq('id', user.id)
    .single();

  if (!profile) throw new Error('Profil introuvable');

  const isSuperadmin = profile.role === 'superadmin';
  const isAdminWithAuthority =
    profile.role === 'admin' && profile.agency_id === agencyId;

  if (!isSuperadmin && !isAdminWithAuthority) {
    throw new Error('Permission refusée');
  }

  const { error } = await supabase
    .from('columns')
    .update({ name, color })
    .eq('id', columnId)
    .eq('agency_id', agencyId);

  if (error) throw error;

  revalidatePath('/reglages');
  revalidatePath('/');
}

export async function deleteColumn(
  agencyId: string,
  columnId: string
): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, agency_id')
    .eq('id', user.id)
    .single();

  if (!profile) throw new Error('Profil introuvable');

  const isSuperadmin = profile.role === 'superadmin';
  const isAdminWithAuthority =
    profile.role === 'admin' && profile.agency_id === agencyId;

  if (!isSuperadmin && !isAdminWithAuthority) {
    throw new Error('Permission refusée');
  }

  const { error } = await supabase
    .from('columns')
    .delete()
    .eq('id', columnId)
    .eq('agency_id', agencyId);

  if (error) throw error;

  revalidatePath('/reglages');
  revalidatePath('/');
}

export async function reorderColumns(
  agencyId: string,
  columnIds: string[]
): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, agency_id')
    .eq('id', user.id)
    .single();

  if (!profile) throw new Error('Profil introuvable');

  const isSuperadmin = profile.role === 'superadmin';
  const isAdminWithAuthority =
    profile.role === 'admin' && profile.agency_id === agencyId;

  if (!isSuperadmin && !isAdminWithAuthority) {
    throw new Error('Permission refusée');
  }

  const updates = columnIds.map((id, index) =>
    supabase
      .from('columns')
      .update({ position: index })
      .eq('id', id)
      .eq('agency_id', agencyId)
  );

  await Promise.all(updates);

  revalidatePath('/reglages');
  revalidatePath('/');
}

export async function addColumn(
  agencyId: string,
  name: string,
  color: string
): Promise<void> {
  return createColumn(agencyId, name, color);
}

export async function inviteUser(
  agencyId: string,
  email: string,
  role: 'admin' | 'agent',
  firstName: string,
  lastName: string
): Promise<void> {
  return inviteUserByEmail(agencyId, email, role, firstName, lastName);
}

export async function inviteUserByEmail(
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
  if (!user) throw new Error('Non authentifié');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, agency_id')
    .eq('id', user.id)
    .single();

  if (!profile) throw new Error('Profil introuvable');

  const isSuperadmin = profile.role === 'superadmin';
  const isAdminWithAuthority =
    profile.role === 'admin' && profile.agency_id === agencyId;

  if (!isSuperadmin && !isAdminWithAuthority) {
    throw new Error('Permission refusée');
  }

  if (profile.role === 'admin' && role === 'admin') {
    throw new Error('Permission refusée : un admin ne peut pas créer d\'autres admins');
  }

  const { error: authError } = await supabase.auth.admin.inviteUserByEmail(
    email,
    {
      redirectTo: 'https://mandathunt.vercel.app/mot-de-passe',
    }
  );

  if (authError) throw authError;

  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;

  const invitedUser = users.users.find((u) => u.email === email);
  if (!invitedUser) throw new Error('Utilisateur invité introuvable');

  const { error: profileError } = await supabase.from('profiles').insert({
    id: invitedUser.id,
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
  agencyId: string,
  userId: string,
  role: 'admin' | 'agent'
): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, agency_id')
    .eq('id', user.id)
    .single();

  if (!profile) throw new Error('Profil introuvable');

  const isSuperadmin = profile.role === 'superadmin';
  const isAdminWithAuthority =
    profile.role === 'admin' && profile.agency_id === agencyId;

  if (!isSuperadmin && !isAdminWithAuthority) {
    throw new Error('Permission refusée');
  }

  if (profile.role === 'admin' && role === 'admin') {
    throw new Error('Permission refusée : un admin ne peut pas créer d\'autres admins');
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)
    .eq('agency_id', agencyId);

  if (error) throw error;

  revalidatePath('/reglages');
}

export async function removeUser(
  agencyId: string,
  userId: string
): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, agency_id')
    .eq('id', user.id)
    .single();

  if (!profile) throw new Error('Profil introuvable');

  const isSuperadmin = profile.role === 'superadmin';
  const isAdminWithAuthority =
    profile.role === 'admin' && profile.agency_id === agencyId;

  if (!isSuperadmin && !isAdminWithAuthority) {
    throw new Error('Permission refusée');
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId)
    .eq('agency_id', agencyId);

  if (profileError) throw profileError;

  if (isSuperadmin) {
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (authError) throw authError;
  }

  revalidatePath('/reglages');
}

export async function setAuthorityAdmin(
  agencyId: string,
  adminId: string | null
): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'superadmin') {
    throw new Error('Permission refusée : seul le superadmin peut modifier l\'autorité');
  }

  const { error } = await supabase
    .from('agencies')
    .update({ authority_admin_id: adminId })
    .eq('id', agencyId);

  if (error) throw error;

  revalidatePath('/reglages');
}
