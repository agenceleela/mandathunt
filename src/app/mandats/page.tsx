import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MandatsTable, type MandatRow } from '@/components/MandatsTable'

export const metadata: Metadata = {
  title: 'Mandats — MandatHunt',
}

export default async function MandatsPage() {
  const cookieStore = await cookies()
  const supabase = await createClient()
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
  if (role === 'superadmin') {
    const wanted = cookieStore.get('mh_agency_id')?.value ?? null
    const { data: agencies } = await supabase
      .from('agencies')
      .select('id, name')
      .order('name')
    const list = (agencies as { id: string; name: string }[] | null) ?? []
    const found =
      list.find((a) => a.id === wanted) ??
      list.find((a) => a.id === agencyId) ??
      list[0] ??
      null
    if (found) {
      agencyId = found.id
      agencyName = found.name
    }
  } else {
    const { data: ag } = agencyId
      ? await supabase
          .from('agencies')
          .select('id, name')
          .eq('id', agencyId)
          .single()
      : { data: null }
    agencyName = (ag as { name: string } | null)?.name ?? ''
  }
  if (!agencyId) redirect('/')

  const { data: columnsRaw } = await supabase
    .from('columns')
    .select('id, name')
    .eq('agency_id', agencyId)
  const columns = (columnsRaw as { id: string; name: string }[] | null) ?? []
  const columnNameById = new Map(columns.map((c) => [c.id, c.name]))
  const mandatColumnIds = new Set(
    columns.filter((c) => c.name === 'RDV MANDAT').map((c) => c.id)
  )

  const { data: listingsRaw } = await supabase
    .from('listings')
    .select('*')
    .eq('agency_id', agencyId)

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
    nameById.set(
      p.id,
      [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Attribué'
    )
  }

  // Mandats : colonne « RDV MANDAT » ou date de RDV définie
  const mandatsRaw = (
    (listingsRaw as Record<string, unknown>[] | null) ?? []
  ).filter(
    (l) =>
      mandatColumnIds.has((l.column_id as string | null) ?? '') ||
      (l.rdv_date as string | null) != null
  )

  mandatsRaw.sort((a, b) => {
    const da = (a.rdv_date as string | null) ?? null
    const db = (b.rdv_date as string | null) ?? null
    if (da && db) return da.localeCompare(db)
    if (da) return -1
    if (db) return 1
    return ((b.published_at as string | null) ?? '').localeCompare(
      (a.published_at as string | null) ?? ''
    )
  })

  const rows: MandatRow[] = mandatsRaw.map((l) => ({
    id: l.id as string,
    title: (l.title as string | null) ?? null,
    photo_url: (l.photo_url as string | null) ?? null,
    city: (l.city as string | null) ?? null,
    postal_code: (l.postal_code as string | null) ?? null,
    price: (l.price as number | null) ?? null,
    brand: (l.brand as string | null) ?? null,
    model: (l.model as string | null) ?? null,
    year: (l.year as number | null) ?? null,
    phone: (l.phone as string | null) ?? null,
    phone_e164: (l.phone_e164 as string | null) ?? null,
    source: (l.source as string) ?? 'lbc',
    rdv_date: (l.rdv_date as string | null) ?? null,
    status:
      columnNameById.get((l.column_id as string | null) ?? '') ?? '—',
    assignee: nameById.get((l.assigned_to as string | null) ?? '') ?? null,
  }))

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold text-gray-900">Mandats</h1>
            <p className="text-gray-600">
              {agencyName ? `Agence : ${agencyName}` : 'Aucune agence configurée'}
              {` — ${rows.length} mandat${rows.length > 1 ? 's' : ''}`}
            </p>
            <p className="text-xs text-gray-500">
              Annonces en colonne « RDV MANDAT » ou avec un rendez-vous défini.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500">{user.email}</span>
            <a
              href="/"
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-100"
            >
              ← Board
            </a>
          </div>
        </header>

        <MandatsTable rows={rows} />
      </div>
    </main>
  )
}