import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Board, type Column } from '@/components/Board'
import type { Listing } from '@/components/ListingCard'
import { LogoutButton } from '@/components/LogoutButton'

export const metadata: Metadata = {
  title: 'Tableau de bord — MandatHunt',
  description: 'Board kanban de votre agence',
}

export default async function HomePage() {
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
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, agency_id')
    .eq('id', user.id)
    .single()
  if (!profile) redirect('/login')

  const role = profile.role as string

  let agencyId = (profile.agency_id as string | null) ?? null
  let agencyName = ''
  let authorityAdminId: string | null = null
  if (role === 'superadmin') {
    const wanted = cookieStore.get('mh_agency_id')?.value ?? null
    const { data: agencies } = await supabase
      .from('agencies')
      .select('id, name')
      .order('name')
    const list =
      (agencies as { id: string; name: string }[] | null) ?? []
    const found =
      list.find((a) => a.id === wanted) ??
      list.find((a) => a.id === agencyId) ??
      list[0]
    if (found) {
      agencyId = found.id
      agencyName = found.name
    }
  } else {
    const { data: ag } = agencyId
      ? await supabase
          .from('agencies')
          .select('id, name, authority_admin_id')
          .eq('id', agencyId)
          .single()
      : { data: null }
    const agency =
      (ag as { name: string; authority_admin_id: string | null } | null) ??
      null
    agencyName = agency?.name ?? ''
    authorityAdminId = agency?.authority_admin_id ?? null
  }

  // D16 : lien Réglages visible par superadmin ou admin désigné
  const canAccessSettings =
    role === 'superadmin' ||
    (role === 'admin' && authorityAdminId === user.id)

  const { data: columnsRaw } = agencyId
    ? await supabase
        .from('columns')
        .select('id, name, color, position')
        .eq('agency_id', agencyId)
        .order('position')
    : { data: null }

  const { data: listingsRaw } = agencyId
    ? await supabase.from('listings').select('*').eq('agency_id', agencyId)
    : { data: null }

  const { data: historyRaw } = await supabase
    .from('price_history')
    .select('listing_id, price, at')
    .order('at', { ascending: false })

  // Tendance prix : dernier vs avant-dernier
  const historyByListing = new Map<string, { price: number }[]>()
  for (const h of (historyRaw as { listing_id: string; price: number }[] | null) ?? []) {
    const arr = historyByListing.get(h.listing_id) ?? []
    arr.push({ price: h.price })
    historyByListing.set(h.listing_id, arr)
  }

  // Noms d'attribution
  const assignedIds = Array.from(
    new Set(
      ((listingsRaw as { assigned_to: string | null }[] | null) ?? [])
        .map((l) => l.assigned_to)
        .filter((v): v is string => v != null)
    )
  )
  const { data: profilesRaw } = assignedIds.length
    ? await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', assignedIds)
    : { data: null }
  const nameById = new Map<string, string>()
  for (const p of (profilesRaw as { id: string; first_name: string | null; last_name: string | null }[] | null) ?? []) {
    nameById.set(p.id, [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Attribué')
  }

  const listings: Listing[] = ((listingsRaw as Record<string, unknown>[] | null) ?? []).map(
    (l) => {
      const hist = historyByListing.get(l.id as string) ?? []
      let trend: Listing['trend'] = null
      if (hist.length >= 2) {
        const last = hist[0].price
        const prev = hist[1].price
        if (prev > 0 && last !== prev) {
          trend = {
            dir: last > prev ? 'up' : 'down',
            pct: Math.round((Math.abs(last - prev) / prev) * 100),
          }
        }
      }
      return {
        id: l.id as string,
        column_id: (l.column_id as string | null) ?? null,
        title: (l.title as string | null) ?? null,
        photo_url: (l.photo_url as string | null) ?? null,
        city: (l.city as string | null) ?? null,
        postal_code: (l.postal_code as string | null) ?? null,
        price: (l.price as number | null) ?? null,
        brand: (l.brand as string | null) ?? null,
        model: (l.model as string | null) ?? null,
        year: (l.year as number | null) ?? null,
        mileage: (l.mileage as number | null) ?? null,
        fuel: (l.fuel as string | null) ?? null,
        phone: (l.phone as string | null) ?? null,
        phone_e164: (l.phone_e164 as string | null) ?? null,
        source: (l.source as string) ?? 'lbc',
        published_at: (l.published_at as string | null) ?? null,
        assignee: nameById.get((l.assigned_to as string | null) ?? '') ?? null,
        trend,
      }
    }
  )

  const columns: Column[] = ((columnsRaw as Record<string, unknown>[] | null) ?? []).map(
    (c) => ({
      id: c.id as string,
      name: c.name as string,
      color: (c.color as string | null) ?? null,
      position: c.position as number,
    })
  )

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold text-gray-900">MandatHunt</h1>
            <p className="text-gray-600">
              {agencyName ? `Agence : ${agencyName}` : 'Aucune agence configurée'}
              {role === 'superadmin' ? ' · superadmin' : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500">{user.email}</span>
            {canAccessSettings && (
              <a
                href="/reglages"
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-100"
              >
                Réglages
              </a>
            )}
            <LogoutButton />
          </div>
        </header>

        <Board columns={columns} listings={listings} />
      </div>
    </main>
  )
}