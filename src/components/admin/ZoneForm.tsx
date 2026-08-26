'use client';

import { useFormState } from 'react-dom';
import { updateZone } from '@/lib/admin/actions';

interface ZoneFormProps {
  agencyId: string;
  initialCity: string;
  initialPostalCode: string;
  initialRadiusKm: number;
}

export function ZoneForm({
  agencyId,
  initialCity,
  initialPostalCode,
  initialRadiusKm,
}: ZoneFormProps) {
  const [state, formAction] = useFormState(async (prev: string | null, formData: FormData) => {
    try {
      const city = formData.get('city') as string;
      const postalCode = formData.get('postalCode') as string;
      const radiusKm = parseInt(formData.get('radiusKm') as string, 10);
      await updateZone(agencyId, city, postalCode, radiusKm);
      return null;
    } catch (error) {
      return 'Erreur lors de la mise à jour de la zone';
    }
  }, null);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="city" className="block text-sm font-medium mb-1">Ville</label>
        <input
          id="city"
          name="city"
          defaultValue={initialCity}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label htmlFor="postalCode" className="block text-sm font-medium mb-1">Code postal</label>
        <input
          id="postalCode"
          name="postalCode"
          defaultValue={initialPostalCode}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label htmlFor="radiusKm" className="block text-sm font-medium mb-1">Rayon (km)</label>
        <input
          id="radiusKm"
          name="radiusKm"
          type="number"
          min="1"
          max="200"
          defaultValue={initialRadiusKm}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      {state && <p className="text-red-600 text-sm">{state}</p>}
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Enregistrer la zone
      </button>
    </form>
  );
}
