'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'

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
  supabase: SupabaseClient,
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
  revalidatePath('/')
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
  revalidatePath('/')
}

export async function setRappelDate(
  listingId: string,
  date: string | null
): Promise<void> {
  const ctx = await getCtx()
  if (!ctx) return
  const listing = await getListingIfAllowed(ctx.supabase, ctx.profile, listingId)
  if (!listing) return
  await ctx.supabase
    .from('listings')
    .update({ rappel_date: date ? new Date(date).toISOString() : null })
    .eq('id', listingId)
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
  revalidatePath('/')
}

export type ListingDetails = {
  listing: {
    id: string
    title: string | null
    photo_url: string | null
    city: string | null
    postal_code: string | null
    distance_km: number | null
    price: number | null
    brand: string | null
    model: string | null
    year: number | null
    mileage: number | null
    fuel: string | null
    gearbox: string | null
    power: string | null
    condition: string | null
    description: string | null
    phone: string | null
    phone_e164: string | null
    source: string
    url: string | null
    column_id: string | null
    assigned_to: string | null
    rdv_date: string | null
    rappel_date: string | null
    published_at: string | null
  }
  columns: { id: string; name: string }[]
  notes: { text: string; at: string; author: string | null }[]
  priceHistory: { price: number; at: string }[]
  statusHistory: {
    from: string | null
    to: string | null
    at: string
    author: string | null
  }[]
  profiles: { id: string; name: string }[]
  canAssign: boolean
  currentColumnName: string | null
}

export async function getListingDetails(
  listingId: string
): Promise<ListingDetails | null> {
  const ctx = await getCtx()
  if (!ctx) return null
  const allowed = await getListingIfAllowed(
    ctx.supabase,
    ctx.profile,
    listingId
  )
  if (!allowed) return null

  const { supabase, profile } = ctx

  const { data: listing } = await supabase
    .from('listings')
    .select('*')
    .eq('id', listingId)
    .single()
  if (!listing) return null
  const l = listing as Record<string, unknown>

  const { data: columnsRaw } = await supabase
    .from('columns')
    .select('id, name')
    .eq('agency_id', l.agency_id as string)
    .order('position')
  const columns =
    (columnsRaw as { id: string; name: string }[] | null) ?? []
  const columnNameById = new Map(columns.map((c) => [c.id, c.name]))

  const { data: notesRaw } = await supabase
    .from('notes')
    .select('text, at, user_id')
    .eq('listing_id', listingId)
    .order('at', { ascending: false })

  const { data: priceRaw } = await supabase
    .from('price_history')
    .select('price, at')
    .eq('listing_id', listingId)
    .order('at', { ascending: false })

  const { data: statusRaw } = await supabase
    .from('status_history')
    .select('from_column_id, to_column_id, user_id, at')
    .eq('listing_id', listingId)
    .order('at', { ascending: false })

  const { data: profilesRaw } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
  const profilesAll =
    (profilesRaw as {
      id: string
      first_name: string | null
      last_name: string | null
    }[] | null) ?? []
  const nameById = new Map<string, string>()
  for (const p of profilesAll) {
    nameById.set(
      p.id,
      [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Utilisateur'
    )
  }

  return {
    listing: {
      id: l.id as string,
      title: (l.title as string | null) ?? null,
      photo_url: (l.photo_url as string | null) ?? null,
      city: (l.city as string | null) ?? null,
      postal_code: (l.postal_code as string | null) ?? null,
      distance_km: (l.distance_km as number | null) ?? null,
      price: (l.price as number | null) ?? null,
      brand: (l.brand as string | null) ?? null,
      model: (l.model as string | null) ?? null,
      year: (l.year as number | null) ?? null,
      mileage: (l.mileage as number | null) ?? null,
      fuel: (l.fuel as string | null) ?? null,
      gearbox: (l.gearbox as string | null) ?? null,
      power: (l.power as string | null) ?? null,
      condition: (l.condition as string | null) ?? null,
      description: (l.description as string | null) ?? null,
      phone: (l.phone as string | null) ?? null,
      phone_e164: (l.phone_e164 as string | null) ?? null,
      source: (l.source as string) ?? 'lbc',
      url: (l.url as string | null) ?? null,
      column_id: (l.column_id as string | null) ?? null,
      assigned_to: (l.assigned_to as string | null) ?? null,
      rdv_date: (l.rdv_date as string | null) ?? null,
      rappel_date: (l.rappel_date as string | null) ?? null,
      published_at: (l.published_at as string | null) ?? null,
    },
    columns,
    notes: ((notesRaw as { text: string; at: string; user_id: string | null }[] | null) ?? []).map(
      (n) => ({
        text: n.text,
        at: n.at,
        author: n.user_id ? (nameById.get(n.user_id) ?? null) : null,
      })
    ),
    priceHistory: (priceRaw as { price: number; at: string }[] | null) ?? [],
    statusHistory: ((statusRaw as {
      from_column_id: string | null
      to_column_id: string | null
      user_id: string | null
      at: string
    }[] | null) ?? []).map((s) => ({
      from: s.from_column_id
        ? (columnNameById.get(s.from_column_id) ?? null)
        : null,
      to: s.to_column_id ? (columnNameById.get(s.to_column_id) ?? null) : null,
      at: s.at,
      author: s.user_id ? (nameById.get(s.user_id) ?? null) : null,
    })),
    profiles: profilesAll.map((p) => ({
      id: p.id,
      name: nameById.get(p.id) ?? 'Utilisateur',
    })),
    canAssign: profile.role === 'superadmin' || profile.role === 'admin',
    currentColumnName: (l.column_id as string | null)
      ? (columnNameById.get(l.column_id as string) ?? null)
      : null,
  }
}
