'use client'

import { useFormState } from 'react-dom'
import { updateCriteria } from '@/lib/admin/actions'

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

export function CriteriaForm({ agencyId, initialCriteria }: CriteriaFormProps) {
  const [state, formAction] = useFormState(
    async (_prev: string | null, formData: FormData) => {
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
          />
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="has_phone"
          name="has_phone"
          defaultChecked={initialCriteria.has_phone}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
        />
        <label htmlFor="has_phone" className="text-sm font-medium">
          Téléphone obligatoire
        </label>
      </div>
      <div className="space-y-2">
        <span className="block text-sm font-medium">Sources</span>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="source_lbc"
            name="source_lbc"
            defaultChecked={initialCriteria.sources.includes('lbc')}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
          <label htmlFor="source_lbc" className="text-sm font-medium">
            leboncoin
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="source_lacentrale"
            name="source_lacentrale"
            defaultChecked={initialCriteria.sources.includes('lacentrale')}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
          <label htmlFor="source_lacentrale" className="text-sm font-medium">
            La Centrale
          </label>
        </div>
      </div>
      {state && <p className="text-red-600 text-sm">{state}</p>}
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Enregistrer les critères
      </button>
    </form>
  )
}
