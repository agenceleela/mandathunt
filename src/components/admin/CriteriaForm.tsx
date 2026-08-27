'use client'

import { useFormState } from 'react-dom'
import { updateCriteria } from '@/lib/admin/actions'
import { SubmitButton } from '@/components/SubmitButton'

export type Criteria = {
  price_min: number | null
  price_max: number | null
  year_min: number | null
  mileage_max: number | null
  has_phone: boolean
  sources: string[]
}

interface CriteriaFormProps {
  agencyId: string
  initialCriteria: Criteria
}

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'

export function CriteriaForm({ agencyId, initialCriteria }: CriteriaFormProps) {
  const [state, formAction] = useFormState(
    async (prev: string | null, formData: FormData) => {
      void prev
      try {
        const criteria: Criteria = {
          price_min: formData.get('price_min')
            ? parseInt(formData.get('price_min') as string, 10)
            : null,
          price_max: formData.get('price_max')
            ? parseInt(formData.get('price_max') as string, 10)
            : null,
          year_min: formData.get('year_min')
            ? parseInt(formData.get('year_min') as string, 10)
            : null,
          mileage_max: formData.get('mileage_max')
            ? parseInt(formData.get('mileage_max') as string, 10)
            : null,
          has_phone: formData.get('has_phone') === 'on',
          sources: [
            ...(formData.get('source_lbc') === 'on' ? ['lbc'] : []),
            ...(formData.get('source_lacentrale') === 'on'
              ? ['lacentrale']
              : []),
          ],
        }
        await updateCriteria(agencyId, criteria)
        return null
      } catch {
        return 'Erreur lors de la mise à jour des critères'
      }
    },
    null
  )

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="price_min" className="block text-sm font-medium mb-1">
            Prix min (€)
          </label>
          <input
            id="price_min"
            name="price_min"
            type="number"
            min="0"
            defaultValue={initialCriteria.price_min ?? ''}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="price_max" className="block text-sm font-medium mb-1">
            Prix max (€)
          </label>
          <input
            id="price_max"
            name="price_max"
            type="number"
            min="0"
            defaultValue={initialCriteria.price_max ?? ''}
            className={inputClass}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="year_min" className="block text-sm font-medium mb-1">
            Année min
          </label>
          <input
            id="year_min"
            name="year_min"
            type="number"
            min="1950"
            max="2030"
            defaultValue={initialCriteria.year_min ?? ''}
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="mileage_max"
            className="block text-sm font-medium mb-1"
          >
            Kilométrage max
          </label>
          <input
            id="mileage_max"
            name="mileage_max"
            type="number"
            min="0"
            defaultValue={initialCriteria.mileage_max ?? ''}
            className={inputClass}
          />
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <input
          id="has_phone"
          name="has_phone"
          type="checkbox"
          defaultChecked={initialCriteria.has_phone}
          className="h-4 w-4 rounded border-gray-300"
        />
        <label htmlFor="has_phone" className="text-sm font-medium">
          Téléphone obligatoire
        </label>
      </div>
      <div className="space-y-2">
        <span className="block text-sm font-medium">Sources</span>
        <div className="flex items-center space-x-2">
          <input
            id="source_lbc"
            name="source_lbc"
            type="checkbox"
            defaultChecked={initialCriteria.sources.includes('lbc')}
            className="h-4 w-4 rounded border-gray-300"
          />
          <label htmlFor="source_lbc" className="text-sm">
            leboncoin
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            id="source_lacentrale"
            name="source_lacentrale"
            type="checkbox"
            defaultChecked={initialCriteria.sources.includes('lacentrale')}
            className="h-4 w-4 rounded border-gray-300"
          />
          <label htmlFor="source_lacentrale" className="text-sm">
            La Centrale
          </label>
        </div>
      </div>
      {state && <p className="text-red-600 text-sm">{state}</p>}
      <SubmitButton>Enregistrer les critères</SubmitButton>
    </form>
  )
}