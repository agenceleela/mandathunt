'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { moveListing } from '@/lib/board-actions'
import { addNote, assignListing, setRdvDate } from '@/lib/listing-actions'

type Column = { id: string; name: string }
type Profile = { id: string; name: string }

export function ListingActions({
  listingId,
  columnId,
  columns,
  rdvDate,
  assignedTo,
  profiles,
  canAssign,
}: {
  listingId: string
  columnId: string | null
  columns: Column[]
  rdvDate: string | null
  assignedTo: string | null
  profiles: Profile[]
  canAssign: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [note, setNote] = useState('')

  const run = (fn: () => Promise<void>) => {
    startTransition(async () => {
      await fn()
      router.refresh()
    })
  }

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="font-semibold text-gray-900">Actions</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-gray-600">Statut (colonne)</span>
          <select
            value={columnId ?? ''}
            onChange={(e) => run(() => moveListing(listingId, e.target.value))}
            className="mt-1 w-full border border-gray-300 rounded px-2 py-2 text-sm"
          >
            {columns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-gray-600">Date de RDV</span>
          <input
            type="date"
            value={rdvDate ? rdvDate.slice(0, 10) : ''}
            onChange={(e) =>
              run(() => setRdvDate(listingId, e.target.value || null))
            }
            className="mt-1 w-full border border-gray-300 rounded px-2 py-2 text-sm"
          />
        </label>

        {canAssign && (
          <label className="block text-sm">
            <span className="text-gray-600">Attribution</span>
            <select
              value={assignedTo ?? ''}
              onChange={(e) =>
                run(() => assignListing(listingId, e.target.value || null))
              }
              className="mt-1 w-full border border-gray-300 rounded px-2 py-2 text-sm"
            >
              <option value="">Non attribué</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          const t = note
          setNote('')
          run(() => addNote(listingId, t))
        }}
        className="space-y-2"
      >
        <span className="text-sm text-gray-600">Ajouter une note d'appel</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded px-2 py-2 text-sm"
          placeholder="Ex. : vendeur à rappeler demain matin…"
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white rounded px-3 py-2 text-sm hover:bg-indigo-700"
        >
          Enregistrer la note
        </button>
      </form>

      {pending && <p className="text-xs text-gray-500">Enregistrement…</p>}
    </div>
  )
}
