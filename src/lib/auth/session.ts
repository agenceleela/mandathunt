import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export type UserProfile = {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  role: 'superadmin' | 'admin' | 'agent'
  agency_id: string | null
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  const supabase = await createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, role, agency_id')
    .eq('id', session.user.id)
    .single()

  if (!profile) return null

  return {
    id: profile.id,
    email: profile.email,
    first_name: profile.first_name,
    last_name: profile.last_name,
    role: profile.role as 'superadmin' | 'admin' | 'agent',
    agency_id: profile.agency_id,
  }
}

export async function getActiveAgencyId(user: UserProfile | null): Promise<string | null> {
  if (!user) return null

  // Agent ou admin : agence fixe du profil
  if (user.role === 'agent' || user.role === 'admin') {
    return user.agency_id
  }

  // Superadmin : agence sélectionnée via cookie
  if (user.role === 'superadmin') {
    const cookieStore = await cookies()
    const agencyCookie = cookieStore.get('mh_agency_id')?.value

    if (agencyCookie) {
      // Vérifier que l'agence existe
      const supabase = await createClient()
      const { data: agency } = await supabase
        .from('agencies')
        .select('id')
        .eq('id', agencyCookie)
        .single()

      if (agency) {
        return agencyCookie
      }
    }

    // Défaut : première agence
    const supabase = await createClient()
    const { data: agencies } = await supabase
      .from('agencies')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1)

    return agencies && agencies.length > 0 ? agencies[0].id : null
  }

  return user.agency_id
}

export async function getAllAgencies() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('agencies')
    .select('id, name, city, postal_code')
    .order('name')
  
  return data || []
}

export async function getAgencyColumns(agencyId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('columns')
    .select('id, name, color, position')
    .eq('agency_id', agencyId)
    .order('position')
  
  return data || []
}

export async function getListingsCountByColumn(agencyId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('listings')
    .select('column_id')
    .eq('agency_id', agencyId)
    .is('is_active', true)

  const counts: Record<string, number> = {}
  if (data) {
    for (const listing of data) {
      if (listing.column_id) {
        counts[listing.column_id] = (counts[listing.column_id] || 0) + 1
      }
    }
  }
  
  return counts
}
