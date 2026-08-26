import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CopyPhoneButton } from '@/components/CopyPhoneButton'
import { ListingActions } from '@/components/ListingActions'

export const metadata: Metadata = {
  title: 'Fiche annonce — MandatHunt',
}

type ListingRow = {
  id: string
  agency_id: string
  source: string
  url: string | null
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
  column_id: string | null
  assigned_to: string | null
  rdv_date: string | null
  published_at: string | null
}

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('fr-FR') : '—'

export default async function AnnoncePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
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

  const { data: listing } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .single()
  const l = listing as ListingRow | null
  if (!l) redirect('/')
  if (role !== 'superadmin' && l.agency_id !== profile.agency_id) redirect('/')

  const { data: columnsRaw } = await supabase
    .from('columns')
    .select('id, name, color, position')
    .eq('agency_id', l.agency_id)
    .order('position')
  const columns = (columnsRaw as { id: string; name: string }[] | null) ?? []

  const currentColumn = columns.find((c) => c.id === l.column_id)
  const isOpposition = currentColumn?.name === 'À ne plus recontacter'

  const { data: historyRaw } = await supabase
    .from('price_history')
    .select('price, at')
    .eq('listing_id', l.id)
    .order('at', { ascending: false })
  const history = (historyRaw as { price: number; at: string }[] | null) ?? []
  let trend: { dir: 'up' | 'down'; pct: number } | null = null
  if (history.length >= 2) {
    const last = history[0].price
    const prev = history[1].price
    if (prev > 0 && last !== prev) {
      trend = {
        dir: last > prev ? 'up' : 'down',
        pct: Math.round((Math.abs(last - prev) / prev) * 100),
      }
    }
  }

  const { data: statusRaw } = await supabase
    .from('status_history')
    .select('from_column_id, to_column_id, user_id, at')
    .eq('listing_id', l.id)
    .order('at', { ascending: false })
  const statusHistory =
    (statusRaw as {
      from_column_id: string | null
      to_column_id: string | null
      user_id: string | null
      at: string
    }[] | null) ?? []

  const { data: notesRaw } = await supabase
    .from('notes')
    .select('text, at, user_id')
    .eq('listing_id', l.id)
    .order('at', { ascending: false })
  const notes =
    (notesRaw as { text: string; at: string; user_id: string | null }[] | null) ??
    []

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
  const columnNameById = new Map(columns.map((c) => [c.id, c.name]))

  const canAssign = role === 'superadmin' || role === 'admin'

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link href="/" className="text-sm text-indigo-600 hover:underline">
          ← Retour au board
        </Link>

        {isOpposition && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">
            Liste d'opposition — ne pas recontacter ce vendeur (RGPD).
          </div>
        )}

        <header className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold text-gray-900">
              {l.title ?? 'Annonce'}
            </h1>
            <span className="text-[11px] uppercase bg-gray-200 text-gray-700 rounded px-2 py-1">
              {l.source === 'lbc' ? 'LBC' : 'La Centrale'}
            </span>
            {l.url && (
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-indigo-600 hover:underline"
              >
                Voir l'annonce originale
              </a>
            )}
          </div>
          <p className="text-gray-600">
            {l.city} {l.postal_code} · Publié le {fmtDate(l.published_at)}
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
              <div className="relative h-64 bg-gray-100">
                {l.photo_url ? (
                  <img
                    src={l.photo_url}
                    alt=""
                    className="h-64 w-full object-cover"
                  />
                ) : (
                  <div className="h-64 w-full flex items-center justify-center text-gray-400">
                    {l.brand ?? 'Annonce'}
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-sm px-3 py-1.5">
                  {l.city} {l.postal_code}
                </div>
              </div>
              <div className="p-4 space-y-1">
                <p className="text-2xl font-bold text-red-600">
                  {l.price != null
                    ? `${l.price.toLocaleString('fr-FR')} €`
                    : '—'}
                  {trend && (
                    <span
                      className={
                        trend.dir === 'up'
                          ? 'ml-2 text-base text-red-600'
                          : 'ml-2 text-base text-green-600'
                      }
                    >
                      {trend.dir === 'up' ? '↗' : '↘'} {trend.pct}%
                    </span>
                  )}
                </p>
                <div className="pt-2">
                  <CopyPhoneButton phone={l.phone} phoneE164={l.phone_e164} />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="font-semibold text-gray-900 mb-3">
                Caractéristiques
              </h2>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-gray-500">Marque</dt>
                <dd>{l.brand ?? '—'}</dd>
                <dt className="text-gray-500">Modèle</dt>
                <dd>{l.model ?? '—'}</dd>
                <dt className="text-gray-500">Année</dt>
                <dd>{l.year ?? '—'}</dd>
                <dt className="text-gray-500">Kilométrage</dt>
                <dd>
                  {l.mileage != null
                    ? `${l.mileage.toLocaleString('fr-FR')} km`
                    : '—'}
                </dd>
                <dt className="text-gray-500">Carburant</dt>
                <dd>{l.fuel ?? '—'}</dd>
                <dt className="text-gray-500">Boîte</dt>
                <dd>{l.gearbox ?? '—'}</dd>
                <dt className="text-gray-500">Puissance</dt>
                <dd>{l.power ?? '—'}</dd>
                <dt className="text-gray-500">État</dt>
                <dd>{l.condition ?? '—'}</dd>
                <dt className="text-gray-500">Distance agence</dt>
                <dd>
                  {l.distance_km != null
                    ? `${l.distance_km.toLocaleString('fr-FR')} km`
                    : '—'}
                </dd>
              </dl>
            </div>

            {l.description && (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <h2 className="font-semibold text-gray-900 mb-2">
                  Description
                </h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {l.description}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <ListingActions
              listingId={l.id}
              columnId={l.column_id}
              columns={columns}
              rdvDate={l.rdv_date}
              assignedTo={l.assigned_to}
              profiles={profilesAll.map((p) => ({
                id: p.id,
                name: nameById.get(p.id) ?? 'Utilisateur',
              }))}
              canAssign={canAssign}
            />

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="font-semibold text-gray-900 mb-3">
                Historique prix
              </h2>
              {history.length === 0 ? (
                <p className="text-sm text-gray-500">Aucune variation de prix.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {history.map((h, i) => (
                    <li key={i} className="flex justify-between">
                      <span className="text-gray-500">{fmtDate(h.at)}</span>
                      <span>{h.price.toLocaleString('fr-FR')} €</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="font-semibold text-gray-900 mb-3">
                Historique statuts
              </h2>
              {statusHistory.length === 0 ? (
                <p className="text-sm text-gray-500">Aucun déplacement.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {statusHistory.map((s, i) => (
                    <li key={i} className="flex justify-between gap-2">
                      <span>
                        {columnNameById.get(s.from_column_id ?? '') ?? '—'} →{' '}
                        {columnNameById.get(s.to_column_id ?? '') ?? '—'}
                        {s.user_id && nameById.get(s.user_id)
                          ? ` · ${nameById.get(s.user_id)}`
                          : ''}
                      </span>
                      <span className="text-gray-500">{fmtDate(s.at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="font-semibold text-gray-900 mb-3">Notes</h2>
              {notes.length === 0 ? (
                <p className="text-sm text-gray-500">Aucune note pour l'instant.</p>
              ) : (
                <ul className="space-y-3 text-sm">
                  {notes.map((n, i) => (
                    <li key={i} className="rounded bg-gray-50 p-3">
                      <p className="text-gray-800 whitespace-pre-wrap">
                        {n.text}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {n.user_id && nameById.get(n.user_id)
                          ? `${nameById.get(n.user_id)} · `
                          : ''}
                        {fmtDate(n.at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
