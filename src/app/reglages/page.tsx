import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ZoneForm } from '@/components/admin/ZoneForm'
import { CriteriaForm, type Criteria } from '@/components/admin/CriteriaForm'
import { ColumnsManager, type ColumnRow } from '@/components/admin/ColumnsManager'
import { UsersManager, type UserRow } from '@/components/admin/UsersManager'
import { AgencySelector } from '@/components/admin/AgencySelector'
import { AuthoritySelect } from '@/components/admin/AuthoritySelect'
import { LogoutButton } from '@/components/LogoutButton'

export const metadata: Metadata = {
  title: 'Réglages — MandatHunt',
}

const DEFAULT_CRITERIA: Criteria = {
  price_min: null,
  price_max: null,
  year_min: null,
  mileage_max: null,
  has_phone: false,
  sources: ['lbc', 'lacentrale'],
}

export default async function ReglagesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams
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
  if (!profile) redirect('/')

  const role = profile.role as string
  if (role !== 'superadmin' && role !== 'admin') redirect('/')

  // Déterminer l'agence gérée (superadmin : sélecteur ; admin : son agence)
  let agencyId: string | null = (profile.agency_id as string | null) ?? null
  let agencies: { id: string; name: string }[] = []
  if (role === 'superadmin') {
    const { data: rows } = await supabase
      .from('agencies')
      .select('id, name')
      .order('name')
    agencies = (rows as { id: string; name: string }[] | null) ?? []
    const wanted = params.agence ?? null
    const found =
      agencies.find((a) => a.id === wanted) ??
      agencies.find((a) => a.id === agencyId) ??
      agencies[0] ??
      null
    agencyId = found ? found.id : null
  }
  if (!agencyId) redirect('/')

  const { data: agency } = await supabase
    .from('agencies')
    .select('*')
    .eq('id', agencyId)
    .single()
  if (!agency) redirect('/')

  const a = agency as Record<string, unknown>

  // D16 : un admin n'a autorité que s'il est désigné (authority_admin_id)
  if (
    role === 'admin' &&
    (a.authority_admin_id as string | null | undefined) !== user.id
  ) {
    redirect('/')
  }

  const { data: columnsRaw } = await supabase
    .from('columns')
    .select('id, name, color, position')
    .eq('agency_id', agencyId)
    .order('position', { ascending: true })

  const { data: usersRaw } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, role')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: true })

  const { data: adminsRaw } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email')
    .eq('agency_id', agencyId)
    .eq('role', 'admin')

  const agencyAdmins = (
    (adminsRaw as
      | {
          id: string
          first_name: string | null
          last_name: string | null
          email: string | null
        }[]
      | null) ?? []
  ).map((p) => ({
    id: p.id,
    first_name: p.first_name ?? '',
    last_name: p.last_name ?? '',
    email: p.email ?? '',
  }))

  const criteria: Criteria = {
    ...DEFAULT_CRITERIA,
    ...((a.criteria as Partial<Criteria> | null) ?? {}),
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-3xl font-bold">Réglages</h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500">{user.email}</span>
            <a
              href="/"
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-100"
            >
              ← Board
            </a>
            <LogoutButton />
          </div>
        </div>
        {role === 'superadmin' && agencies.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Agence :</span>
            <AgencySelector agencies={agencies} currentId={agencyId} />
          </div>
        )}
        <p className="text-sm text-gray-600">
          {(a.name as string) ?? ''}
          {(a.city as string) ? ` — ${a.city as string}` : ''}
        </p>
      </div>

      {role === 'superadmin' && (
        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-semibold">Autorité de gestion</h2>
          <AuthoritySelect
            agencyId={agencyId}
            currentAdminId={
              (a.authority_admin_id as string | null | undefined) ?? null
            }
            agencyAdmins={agencyAdmins}
          />
        </section>
      )}

      <div className="space-y-8">
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Zone de chalandise</h2>
          <ZoneForm
            agencyId={agencyId}
            initialCity={(a.city as string) ?? ''}
            initialPostalCode={(a.postal_code as string) ?? ''}
            initialRadiusKm={(a.radius_km as number) ?? 20}
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Critères de filtrage</h2>
          <CriteriaForm agencyId={agencyId} initialCriteria={criteria} />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Colonnes du board</h2>
          <ColumnsManager
            agencyId={agencyId}
            initialColumns={(columnsRaw as ColumnRow[] | null) ?? []}
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Utilisateurs</h2>
          <UsersManager
            agencyId={agencyId}
            initialUsers={(usersRaw as UserRow[] | null) ?? []}
            currentUserId={user.id}
          />
        </section>
      </div>
    </div>
  )
}