'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

type Profile = { id: string; role: string; agency_id: string | null }

async function getCtx() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          void cookiesToSet
        },
      },
    }
  )
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, agency_id')
    .eq('id', user.id)
    .single()
  if (!profile) return null
  return {
    supabase,
    userId: user.id,
    profile: profile as Profile,
  }
}

async function getListingIfAllowed(
  supabase: Awaited<ReturnType<typeof getCtx>> extends { supabase: infer S } | null ? S : never,
  profile: Profile,
  listingId: string
) {
  const { data: listing } = await supabase
    .from('listings')
    .select('id, agency_id')
    .eq('id', listingId)
    .single()
  if (!listing) return null
  if (profile.role !== 'superadmin' && listing.agency_id !== profile.agency_id)
    return null
  return listing as { id: string; agency_id: string }
}

export async function addNote(listingId: string, text: string): Promise<void> {
  const clean = text.trim()
  if (!clean) return
  const ctx = await getCtx()
  if (!ctx) return
  const listing = await getListingIfAllowed(ctx.supabase, ctx.profile, listingId)
  if (!listing) return
  await ctx.supabase.from('notes').insert({
    listing_id: listingId,
    user_id: ctx.userId,
    text: clean,
  })
  revalidatePath(`/annonces/${listingId}`)
}

export async function setRdvDate(
  listingId: string,
  date: string | null
): Promise<void> {
  const ctx = await getCtx()
  if (!ctx) return
  const listing = await getListingIfAllowed(ctx.supabase, ctx.profile, listingId)
  if (!listing) return
  await ctx.supabase
    .from('listings')
    .update({ rdv_date: date ? new Date(date).toISOString() : null })
    .eq('id', listingId)
  revalidatePath(`/annonces/${listingId}`)
  revalidatePath('/')
}

export async function assignListing(
  listingId: string,
  profileId: string | null
): Promise<void> {
  const ctx = await getCtx()
  if (!ctx) return
  if (ctx.profile.role !== 'superadmin' && ctx.profile.role !== 'admin') return
  const listing = await getListingIfAllowed(ctx.supabase, ctx.profile, listingId)
  if (!listing) return
  await ctx.supabase
    .from('listings')
    .update({ assigned_to: profileId })
    .eq('id', listingId)
  revalidatePath(`/annonces/${listingId}`)
  revalidatePath('/')
}
