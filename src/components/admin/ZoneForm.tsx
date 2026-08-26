'use client';

import { useFormState } from 'react-dom';
import { updateZone } from '@/lib/admin/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
        <Label htmlFor="city">Ville</Label>
        <Input
          id="city"
          name="city"
          defaultValue={initialCity}
          required
        />
      </div>
      <div>
        <Label htmlFor="postalCode">Code postal</Label>
        <Input
          id="postalCode"
          name="postalCode"
          defaultValue={initialPostalCode}
          required
        />
      </div>
      <div>
        <Label htmlFor="radiusKm">Rayon (km)</Label>
        <Input
          id="radiusKm"
          name="radiusKm"
          type="number"
          min="1"
          max="200"
          defaultValue={initialRadiusKm}
          required
        />
      </div>
      {state && <p className="text-red-600 text-sm">{state}</p>}
      <Button type="submit">Enregistrer la zone</Button>
    </form>
  );
}
