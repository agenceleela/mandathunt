'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ListingCard, type Listing } from '@/components/ListingCard'
import { moveListing } from '@/lib/board-actions'

export type Column = {
  id: string
  name: string
  color: string | null
  position: number
}

export function Board({ columns, listings }: { columns: Column[]; listings: Listing[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'date' | 'price_asc' | 'price_desc'>('date')
  const [dragId, setDragId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const base = q
      ? listings.filter((l) =>
          [l.title, l.brand, l.model].some((v) => (v ?? '').toLowerCase().includes(q))
        )
      : listings
    const sorted = [...base]
    if (sort === 'date')
      sorted.sort((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? ''))
    if (sort === 'price_asc') sorted.sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
    if (sort === 'price_desc') sorted.sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
    return sorted
  }, [listings, search, sort])

  const onDrop = (columnId: string) => {
    if (!dragId) return
    const id = dragId
    setDragId(null)
    startTransition(async () => {
      await moveListing(id, columnId)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher (titre, marque, modèle)…"
          className="border border-gray-300 rounded px-3 py-2 text-sm w-72"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="border border-gray-300 rounded px-2 py-2 text-sm"
        >
          <option value="date">Tri : date de publication</option>
          <option value="price_asc">Tri : prix croissant</option>
          <option value="price_desc">Tri : prix décroissant</option>
        </select>
        {pending && <span className="text-xs text-gray-500">Enregistrement…</span>}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => {
          const cards = filtered.filter((l) => l.column_id === col.id)
          return (
            <div
              key={col.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(col.id)}
              className="w-72 shrink-0 rounded-lg bg-gray-100 p-3 space-y-3"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: col.color ?? '#6b7280' }}
                />
                <span className="font-semibold text-gray-900">{col.name}</span>
                <span className="text-sm text-gray-500">({cards.length})</span>
              </div>
              {cards.length === 0 ? (
                <p className="text-xs text-gray-500">Aucune annonce dans cette colonne</p>
              ) : (
                cards.map((l) => (
                  <div
                    key={l.id}
                    draggable
                    onDragStart={() => setDragId(l.id)}
                    onDragEnd={() => setDragId(null)}
                    className={dragId === l.id ? 'opacity-50' : ''}
                  >
                    <ListingCard listing={l} />
                  </div>
                ))
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
