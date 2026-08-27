'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function moveListing(
  listingId: string,
  toColumnId: string
): Promise<void> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, agency_id')
    .eq('id', user.id)
    .single()
  if (!profile) return

  const { data: listing } = await supabase
    .from('listings')
    .select('id, column_id, agency_id')
    .eq('id', listingId)
    .single()
  if (!listing) return

  const role = profile.role as string
  if (role !== 'superadmin' && listing.agency_id !== profile.agency_id) return

  const fromColumnId = listing.column_id as string | null
  if (fromColumnId === toColumnId) return

  const { error } = await supabase
    .from('listings')
    .update({ column_id: toColumnId })
    .eq('id', listingId)
  if (error) return

  await supabase.from('status_history').insert({
    listing_id: listingId,
    from_column_id: fromColumnId,
    to_column_id: toColumnId,
    user_id: user.id,
  })

  revalidatePath('/')
}