import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ZoneForm } from '@/components/admin/ZoneForm'
import { CriteriaForm, type Criteria } from '@/components/admin/CriteriaForm'
import { ColumnsManager, type ColumnRow } from '@/components/admin/ColumnsManager'
import { UsersManager, type UserRow } from '@/components/admin/UsersManager'

export default async function ReglagesPage() {
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
  const agencyId = profile.agency_id as string | null
  if (!agencyId) redirect('/')

  const { data: agency } = await supabase
    .from('agencies')
    .select('*')
    .eq('id', agencyId)
    .single()
  if (!agency) redirect('/')

  const { data: columnsRaw } = await supabase
    .from('columns')
    .select('id, name, color, position')
    .eq('agency_id', agencyId)
    .order('position', { ascending: true })

  const { data: usersRaw } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, role')
    .eq('agency_id', agencyId)

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

  return (
    <div className="container mx-auto py-8 max-w-4xl px-4">
      <h1 className="text-3xl font-bold mb-8">Réglages</h1>
      <div className="space-y-8">
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Zone de chalandise</h2>
          <ZoneForm
            agencyId={agency.id}
            initialCity={agency.city}
            initialPostalCode={agency.postal_code}
            initialRadiusKm={agency.radius_km}
          />
        </section>
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Critères de filtrage</h2>
          <CriteriaForm agencyId={agency.id} initialCriteria={criteria} />
        </section>
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Colonnes du board</h2>
          <ColumnsManager
            agencyId={agency.id}
            initialColumns={(columnsRaw as ColumnRow[] | null) ?? []}
          />
        </section>
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Utilisateurs</h2>
          <UsersManager
            agencyId={agency.id}
            initialUsers={(usersRaw as UserRow[] | null) ?? []}
            currentUserId={user.id}
          />
        </section>
      </div>
    </div>
  )
}
