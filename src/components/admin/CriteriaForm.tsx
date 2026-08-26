'use client';

import { useFormState } from 'react-dom';
import { updateCriteria } from '@/lib/admin/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface CriteriaFormProps {
  agencyId: string;
  initialCriteria: {
    price_min: number | null;
    price_max: number | null;
    year_min: number | null;
    mileage_max: number | null;
    has_phone: boolean;
    sources: string[];
  };
}

export function CriteriaForm({ agencyId, initialCriteria }: CriteriaFormProps) {
  const [state, formAction] = useFormState(async (prev: string | null, formData: FormData) => {
    try {
      const criteria = {
        price_min: formData.get('price_min') ? parseInt(formData.get('price_min') as string, 10) : null,
        price_max: formData.get('price_max') ? parseInt(formData.get('price_max') as string, 10) : null,
        year_min: formData.get('year_min') ? parseInt(formData.get('year_min') as string, 10) : null,
        mileage_max: formData.get('mileage_max') ? parseInt(formData.get('mileage_max') as string, 10) : null,
        has_phone: formData.get('has_phone') === 'on',
        sources: [
          ...(formData.get('source_lbc') === 'on' ? ['lbc'] : []),
          ...(formData.get('source_lacentrale') === 'on' ? ['lacentrale'] : []),
        ],
      };
      await updateCriteria(agencyId, criteria);
      return null;
    } catch (error) {
      return 'Erreur lors de la mise à jour des critères';
    }
  }, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price_min">Prix min (€)</Label>
          <Input
            id="price_min"
            name="price_min"
            type="number"
            min="0"
            defaultValue={initialCriteria.price_min ?? ''}
          />
        </div>
        <div>
          <Label htmlFor="price_max">Prix max (€)</Label>
          <Input
            id="price_max"
            name="price_max"
            type="number"
            min="0"
            defaultValue={initialCriteria.price_max ?? ''}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="year_min">Année min</Label>
          <Input
            id="year_min"
            name="year_min"
            type="number"
            min="1950"
            max="2030"
            defaultValue={initialCriteria.year_min ?? ''}
          />
        </div>
        <div>
          <Label htmlFor="mileage_max">Kilométrage max</Label>
          <Input
            id="mileage_max"
            name="mileage_max"
            type="number"
            min="0"
            defaultValue={initialCriteria.mileage_max ?? ''}
          />
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="has_phone"
          name="has_phone"
          defaultChecked={initialCriteria.has_phone}
        />
        <Label htmlFor="has_phone">Téléphone obligatoire</Label>
      </div>
      <div className="space-y-2">
        <Label>Sources</Label>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="source_lbc"
            name="source_lbc"
            defaultChecked={initialCriteria.sources.includes('lbc')}
          />
          <Label htmlFor="source_lbc">leboncoin</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="source_lacentrale"
            name="source_lacentrale"
            defaultChecked={initialCriteria.sources.includes('lacentrale')}
          />
          <Label htmlFor="source_lacentrale">La Centrale</Label>
        </div>
      </div>
      {state && <p className="text-red-600 text-sm">{state}</p>}
      <Button type="submit">Enregistrer les critères</Button>
    </form>
  );
}
