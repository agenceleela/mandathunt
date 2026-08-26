import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ZoneForm } from '@/components/admin/ZoneForm';
import { CriteriaForm } from '@/components/admin/CriteriaForm';
import { ColumnsManager } from '@/components/admin/ColumnsManager';
import { UsersManager } from '@/components/admin/UsersManager';

export default async function ReglagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Récupérer le profil
  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id, role')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/');

  // Vérifier les permissions
  if (profile.role !== 'admin' && profile.role !== 'superadmin') {
    redirect('/');
  }

  // Récupérer l'agence
  const { data: agency } = await supabase
    .from('agencies')
    .select('*')
    .eq('id', profile.agency_id)
    .single();

  if (!agency) redirect('/');

  // Récupérer les colonnes
  const { data: columns } = await supabase
    .from('columns')
    .select('*')
    .eq('agency_id', agency.id)
    .order('position', { ascending: true });

  // Récupérer les utilisateurs de l'agence
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .eq('agency_id', agency.id)
    .order('created_at', { ascending: true });

  const criteria = (agency.criteria as any) || {
    price_min: null,
    price_max: null,
    year_min: null,
    mileage_max: null,
    has_phone: false,
    sources: ['lbc', 'lacentrale'],
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
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
          <ColumnsManager agencyId={agency.id} initialColumns={columns || []} />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Utilisateurs</h2>
          <UsersManager
            agencyId={agency.id}
            initialUsers={users || []}
            currentUserId={user.id}
          />
        </section>
      </div>
    </div>
  );
}
