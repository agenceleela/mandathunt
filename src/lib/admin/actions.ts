'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { traduireErreur } from '@/lib/auth/erreurs'

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function requireAdmin(agencyId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, agency_id')
    .eq('id', user.id)
    .single()
  if (!profile) redirect('/')
  const role = profile.role as string
  if (role === 'superadmin')
    return { userId: user.id, role: 'superadmin' as const }
  if (role === 'admin' && profile.agency_id === agencyId) {
    const { data: agency } = await supabase
      .from('agencies')
      .select('authority_admin_id')
      .eq('id', agencyId)
      .single()
    if (agency && agency.authority_admin_id === user.id)
      return { userId: user.id, role: 'admin' as const }
  }
  redirect('/')
}

export async function setAgencyAuthority(
  agencyId: string,
  adminId: string | null
): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile || profile.role !== 'superadmin') redirect('/')
  const admin = serviceClient()
  const { error } = await admin
    .from('agencies')
    .update({ authority_admin_id: adminId })
    .eq('id', agencyId)
  if (error) throw error
  revalidatePath('/reglages')
}

// Compatibilité temporaire avec l'ancien AuthorityToggle (supprimé à la
// fin de cette série de commits)
export async function updateAgencyAuthority(
  _agencyId: string,
  _selfManaged: boolean
): Promise<void> {
  revalidatePath('/reglages')
}

export async function updateZone(
  agencyId: string,
  city: string,
  postalCode: string,
  radiusKm: number
): Promise<void> {
  await requireAdmin(agencyId)
  const supabase = await createClient()
  const { error } = await supabase
    .from('agencies')
    .update({ city, postal_code: postalCode, radius_km: radiusKm })
    .eq('id', agencyId)
  if (error) throw error
  revalidatePath('/reglages')
}

export async function updateCriteria(
  agencyId: string,
  criteria: {
    price_min: number | null
    price_max: number | null
    year_min: number | null
    mileage_max: number | null
    has_phone: boolean
    sources: string[]
  }
): Promise<void> {
  await requireAdmin(agencyId)
  const supabase = await createClient()
  const { error } = await supabase
    .from('agencies')
    .update({ criteria })
    .eq('id', agencyId)
  if (error) throw error
  revalidatePath('/reglages')
}

export async function createColumn(
  agencyId: string,
  name: string,
  color: string
): Promise<void> {
  await requireAdmin(agencyId)
  const supabase = await createClient()
  const { data: maxPos } = await supabase
    .from('columns')
    .select('position')
    .eq('agency_id', agencyId)
    .order('position', { ascending: false })
    .limit(1)
    .single()
  const position = (maxPos?.position ?? -1) + 1
  const { error } = await supabase
    .from('columns')
    .insert({ agency_id: agencyId, name, color, position })
  if (error) throw error
  revalidatePath('/reglages')
  revalidatePath('/')
}

export async function updateColumn(
  columnId: string,
  name: string,
  color: string
): Promise<void> {
  const supabase = await createClient()
  const { data: column } = await supabase
    .from('columns')
    .select('agency_id')
    .eq('id', columnId)
    .single()
  if (!column) throw new Error('Colonne introuvable')
  await requireAdmin(column.agency_id)
  const { error } = await supabase
    .from('columns')
    .update({ name, color })
    .eq('id', columnId)
  if (error) throw error
  revalidatePath('/reglages')
  revalidatePath('/')
}

export async function deleteColumn(columnId: string): Promise<void> {
  const supabase = await createClient()
  const { data: column } = await supabase
    .from('columns')
    .select('agency_id')
    .eq('id', columnId)
    .single()
  if (!column) throw new Error('Colonne introuvable')
  await requireAdmin(column.agency_id)
  const { data: firstColumn } = await supabase
    .from('columns')
    .select('id')
    .eq('agency_id', column.agency_id)
    .neq('id', columnId)
    .order('position', { ascending: true })
    .limit(1)
    .single()
  if (firstColumn) {
    await supabase
      .from('listings')
      .update({ column_id: firstColumn.id })
      .eq('column_id', columnId)
  }
  const { error } = await supabase.from('columns').delete().eq('id', columnId)
  if (error) throw error
  revalidatePath('/reglages')
  revalidatePath('/')
}

export async function reorderColumns(columnIds: string[]): Promise<void> {
  if (columnIds.length === 0) return
  const supabase = await createClient()
  const { data: column } = await supabase
    .from('columns')
    .select('agency_id')
    .eq('id', columnIds[0])
    .single()
  if (!column) throw new Error('Colonne introuvable')
  await requireAdmin(column.agency_id)
  for (let i = 0; i < columnIds.length; i++) {
    const { error } = await supabase
      .from('columns')
      .update({ position: i })
      .eq('id', columnIds[i])
    if (error) throw error
  }
  revalidatePath('/reglages')
  revalidatePath('/')
}

export async function inviteUser(
  agencyId: string,
  email: string,
  role: 'admin' | 'agent',
  firstName: string,
  lastName: string
): Promise<void> {
  const caller = await requireAdmin(agencyId)
  const cleanEmail = email.trim().toLowerCase()
  if (!cleanEmail) throw new Error('Email invalide.')
  // un admin ne peut inviter que des agents
  const targetRole: 'admin' | 'agent' =
    caller.role === 'admin' ? 'agent' : role
  const admin = serviceClient()
  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('email', cleanEmail)
    .maybeSingle()
  if (existing) throw new Error('Un utilisateur existe déjà avec cet email.')
  const { data, error: authError } = await admin.auth.admin.inviteUserByEmail(
    cleanEmail,
    {
      redirectTo: 'https://mandathunt.vercel.app/mot-de-passe',
      data: {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      },
    }
  )
  if (authError) throw new Error(traduireErreur(authError.message))
  if (!data.user) throw new Error('Invitation échouée.')
  const { error: profileError } = await admin.from('profiles').insert({
    id: data.user.id,
    agency_id: agencyId,
    role: targetRole,
    email: cleanEmail,
    first_name: firstName.trim(),
    last_name: lastName.trim(),
  })
  if (profileError) throw new Error('Erreur lors de la création du profil.')
  revalidatePath('/reglages')
}

export async function updateUserRole(
  userId: string,
  role: 'admin' | 'agent'
): Promise<void> {
  const admin = serviceClient()
  const { data: target } = await admin
    .from('profiles')
    .select('agency_id, role')
    .eq('id', userId)
    .single()
  if (!target) throw new Error('Utilisateur introuvable.')
  const caller = await requireAdmin(target.agency_id as string)
  if (userId === caller.userId)
    throw new Error('Vous ne pouvez pas modifier votre propre rôle.')
  if (caller.role === 'admin' && target.role !== 'agent')
    throw new Error('Action non autorisée.')
  const newRole: 'admin' | 'agent' =
    caller.role === 'admin' ? 'agent' : role
  const { error } = await admin
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)
  if (error) throw new Error('Erreur lors du changement de rôle.')
  revalidatePath('/reglages')
}

export async function removeUser(userId: string): Promise<void> {
  const admin = serviceClient()
  const { data: target } = await admin
    .from('profiles')
    .select('agency_id, role')
    .eq('id', userId)
    .single()
  if (!target) throw new Error('Utilisateur introuvable.')
  const caller = await requireAdmin(target.agency_id as string)
  if (userId === caller.userId)
    throw new Error('Vous ne pouvez pas supprimer votre propre compte.')
  if (caller.role === 'admin' && target.role !== 'agent')
    throw new Error('Action non autorisée.')
  const { error } = await admin.from('profiles').delete().eq('id', userId)
  if (error) throw new Error('Erreur lors de la suppression du profil.')
  const { error: authError } = await admin.auth.admin.deleteUser(userId)
  if (authError) throw new Error('Erreur lors de la suppression du compte.')
  revalidatePath('/reglages')
}
