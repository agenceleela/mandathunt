import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ZoneForm } from '@/components/admin/ZoneForm'
import { CriteriaForm, type Criteria } from '@/components/admin/CriteriaForm'
import { ColumnsManager, type ColumnRow } from '@/components/admin/ColumnsManager'
import { UsersManager, type UserRow } from '@/components/admin/UsersManager'
import { AgencySelector } from '@/components/admin/AgencySelector'
import { AuthoritySelect } from '@/components/admin/AuthoritySelect'

export default async function ReglagesPage({
  searchParams,
}: {
  searchParams: Promise<{ agence?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id, role')
    .eq('id', user.id)
    .single()
  if (!profile) redirect('/')
  const role = profile.role as string
  if (role !== 'admin' && role !== 'superadmin') redirect('/')
  const isSuper = role === 'superadmin'

  let agencies: { id: string; name: string }[] = []
  if (isSuper) {
    const { data: all } = await supabase
      .from('agencies')
      .select('id, name')
      .order('name')
    agencies = (all as { id: string; name: string }[] | null) ?? []
  }
  const agencyId = isSuper
    ? (params.agence ?? agencies[0]?.id ?? (profile.agency_id as string))
    : (profile.agency_id as string)
  if (!agencyId) redirect('/')

  const { data: agency } = await supabase
    .from('agencies')
    .select('*')
    .eq('id', agencyId)
    .single()
  if (!agency) redirect('/')

  // Un admin n'accède aux réglages que s'il est l'admin désigné de la zone
  if (!isSuper) {
    const authority = (agency as { authority_admin_id: string | null })
      .authority_admin_id
    if (authority !== user.id) redirect('/')
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
  const users = (usersRaw as UserRow[] | null) ?? []

  const rawCriteria = (agency.criteria ?? null) as Partial<Criteria> | null
  const criteria: Criteria = {
    price_min:
      typeof rawCriteria?.price_min === 'number' ? rawCriteria.price_min : null,
    price_max:
      typeof rawCriteria?.price_max === 'number' ? rawCriteria.price_max : null,
    year_min:
      typeof rawCriteria?.year_min === 'number' ? rawCriteria.year_min : null,
    mileage_max:
      typeof rawCriteria?.mileage_max === 'number'
        ? rawCriteria.mileage_max
        : null,
    has_phone: rawCriteria?.has_phone === true,
    sources: Array.isArray(rawCriteria?.sources)
      ? (rawCriteria.sources as string[])
      : ['lbc', 'lacentrale'],
  }

  const admins = users
    .filter((u) => u.role === 'admin')
    .map((u) => ({
      id: u.id,
      name: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email || 'Admin',
    }))
  const currentAuthority = (agency as { authority_admin_id: string | null })
    .authority_admin_id

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Réglages</h1>
          <span className="text-sm text-gray-600 border border-gray-300 rounded px-2 py-1">
            {isSuper ? 'Superadmin — toutes agences' : 'Admin désigné — votre agence'}
          </span>
        </div>

        {isSuper && agencies.length > 0 && (
          <section className="space-y-2 mb-8">
            <h2 className="text-xl font-semibold text-gray-900">
              Agence à régler
            </h2>
            <AgencySelector agencies={agencies} currentId={agencyId} />
          </section>
        )}

        {isSuper && (
          <section className="space-y-2 mb-8">
            <h2 className="text-xl font-semibold text-gray-900">Autorité</h2>
            <AuthoritySelect
              agencyId={agencyId}
              admins={admins}
              current={currentAuthority}
            />
          </section>
        )}

        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              Zone de chalandise
            </h2>
            <ZoneForm
              agencyId={agency.id}
              initialCity={agency.city}
              initialPostalCode={agency.postal_code}
              initialRadiusKm={agency.radius_km}
            />
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              Critères de filtrage
            </h2>
            <CriteriaForm agencyId={agency.id} initialCriteria={criteria} />
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              Colonnes du board
            </h2>
            <ColumnsManager
              agencyId={agency.id}
              initialColumns={(columnsRaw as ColumnRow[] | null) ?? []}
            />
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              Utilisateurs
            </h2>
            <UsersManager
              agencyId={agency.id}
              initialUsers={users}
              currentUserId={user.id}
              canCreateAdmins={isSuper}
            />
          </section>
        </div>
      </div>
    </div>
  )
}
