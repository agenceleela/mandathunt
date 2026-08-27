import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AgencySelector } from '@/components/admin/AgencySelector';
import { AuthoritySelect } from '@/components/admin/AuthoritySelect';
import { ZoneForm } from '@/components/admin/ZoneForm';
import { CriteriaForm } from '@/components/admin/CriteriaForm';
import { ColumnsManager } from '@/components/admin/ColumnsManager';
import { UsersManager } from '@/components/admin/UsersManager';

export default async function ReglagesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, agency_id, first_name, last_name')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  if (profile.role !== 'admin' && profile.role !== 'superadmin') {
    redirect('/');
  }

  const { data: agency } = await supabase
    .from('agencies')
    .select('*')
    .eq('id', profile.agency_id)
    .single();

  if (!agency) {
    redirect('/');
  }

  // Pour le superadmin : liste des agences
  let agencies: { id: string; name: string }[] = [];
  if (profile.role === 'superadmin') {
    const { data } = await supabase
      .from('agencies')
      .select('id, name')
      .order('name');
    agencies = data || [];
  }

  // Admins de l'agence (pour AuthoritySelect)
  const { data: agencyAdmins } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email')
    .eq('agency_id', agency.id)
    .eq('role', 'admin');

  // Colonnes de l'agence
  const { data: columns } = await supabase
    .from('columns')
    .select('id, name, color, position')
    .eq('agency_id', agency.id)
    .order('position');

  // Utilisateurs de l'agence
  const { data: users } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, role')
    .eq('agency_id', agency.id)
    .order('role');

  // Critères par défaut
  const defaultCriteria = {
    price_min: null,
    price_max: null,
    year_min: null,
    mileage_max: null,
    has_phone: false,
    sources: ['lbc', 'lacentrale'],
  };

  const criteria = agency.criteria
    ? { ...defaultCriteria, ...agency.criteria }
    : defaultCriteria;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Réglages</h1>
          <a
            href="/"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Retour au board
          </a>
        </div>

        {/* Sélecteur d'agence (superadmin uniquement) */}
        {profile.role === 'superadmin' && agencies.length > 0 && (
          <AgencySelector agencies={agencies} currentId={agency.id} />
        )}

        {/* Autorité (superadmin uniquement) */}
        {profile.role === 'superadmin' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Autorité
            </h2>
            <AuthoritySelect
              agencyId={agency.id}
              currentAdminId={agency.authority_admin_id ?? null}
              agencyAdmins={agencyAdmins || []}
            />
          </div>
        )}

        {/* Zone */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Zone</h2>
          <ZoneForm
            agencyId={agency.id}
            initialCity={agency.city || ''}
            initialPostalCode={agency.postal_code || ''}
            initialRadiusKm={agency.radius_km ?? 20}
          />
        </div>

        {/* Critères */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Critères initiaux
          </h2>
          <CriteriaForm agencyId={agency.id} initialCriteria={criteria} />
        </div>

        {/* Colonnes */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Colonnes du board
          </h2>
          <ColumnsManager
            agencyId={agency.id}
            initialColumns={columns || []}
          />
        </div>

        {/* Utilisateurs */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Utilisateurs de l&#39;agence
          </h2>
          <UsersManager
            agencyId={agency.id}
            initialUsers={users || []}
            currentUserId={user.id}
            canCreateAdmins={profile.role === 'superadmin'}
          />
        </div>
      </div>
    </div>
  );
}
