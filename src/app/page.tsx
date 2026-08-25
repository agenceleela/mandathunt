import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Tableau de bord — MandatHunt',
  description: 'Colonnes et compteurs de votre agence',
}

type Column = {
  id: string
  name: string
  color: string | null
  position: number
}

type Agency = {
  id: string
  name: string
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
          // lecture seule en server component : le refresh de session
          // est géré par le middleware
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

  // Agence active : cookie mh_agency_id pour superadmin, sinon agence du profil
  let agencyId = (profile.agency_id as string | null) ?? null
  let agencyName = ''
  if (role === 'superadmin') {
    const wanted = cookieStore.get('mh_agency_id')?.value ?? null
    const { data: agencies } = await supabase
      .from('agencies')
      .select('id, name')
      .order('name')
    const list = (agencies as Agency[] | null) ?? []
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
          .select('id, name')
          .eq('id', agencyId)
          .single()
      : { data: null }
    agencyName = (ag as Agency | null)?.name ?? ''
  }

  const { data: columns } = agencyId
    ? await supabase
        .from('columns')
        .select('id, name, color, position')
        .eq('agency_id', agencyId)
        .order('position')
    : { data: null }

  const { data: listings } = agencyId
    ? await supabase
        .from('listings')
        .select('column_id')
        .eq('agency_id', agencyId)
    : { data: null }

  const counts = new Map<string, number>()
  for (const l of (listings as { column_id: string | null }[] | null) ?? []) {
    if (l.column_id) counts.set(l.column_id, (counts.get(l.column_id) ?? 0) + 1)
  }

  const cols = (columns as Column[] | null) ?? []

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="space-y-1">
          <h1 className="text-3xl font-extrabold text-gray-900">MandatHunt</h1>
          <p className="text-gray-600">
            {agencyName ? `Agence : ${agencyName}` : 'Aucune agence configurée'}
            {role === 'superadmin' ? ' · superadmin' : ''}
          </p>
        </header>

        {cols.length === 0 ? (
          <p className="text-gray-600">Aucune colonne pour cette agence.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {cols.map((c) => (
              <div
                key={c.id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: c.color ?? '#6b7280' }}
                  />
                  <span className="font-semibold text-gray-900">{c.name}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {counts.get(c.id) ?? 0}
                </p>
                <p className="text-xs text-gray-500">annonce(s)</p>
              </div>
            ))}
          </div>
        )}

        <p className="text-sm text-gray-500">Board kanban complet à l'étape 3.</p>
      </div>
    </main>
  )
}
