'use client'

import { useEffect, useState, useTransition } from 'react'
import {
  addNote,
  assignListing,
  getListingDetails,
  setRappelDate,
  setRdvDate,
  type ListingDetails,
} from '@/lib/listing-actions'
import { moveListing } from '@/lib/board-actions'
import { CopyPhoneButton } from '@/components/CopyPhoneButton'
import { DateTimePicker } from '@/components/DateTimePicker'

const fmtDateTime = (s: string | null) =>
  s
    ? new Date(s).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'

export function ListingModal({
  listingId,
  onClose,
}: {
  listingId: string
  onClose: () => void
}) {
  const [details, setDetails] = useState<ListingDetails | null>(null)
  const [note, setNote] = useState('')
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    getListingDetails(listingId).then(setDetails)
  }, [listingId])

  const run = (fn: () => Promise<unknown>) => {
    startTransition(async () => {
      await fn()
      const d = await getListingDetails(listingId)
      setDetails(d)
    })
  }

  if (!details) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={onClose}
      >
        <p className="rounded-lg bg-white p-6 text-sm text-gray-700">
          Chargement…
        </p>
      </div>
    )
  }

  const {
    listing: l,
    columns,
    notes,
    priceHistory,
    statusHistory,
    profiles,
    canAssign,
    currentColumnName,
  } = details

  let trend: { dir: 'up' | 'down'; pct: number } | null = null
  if (priceHistory.length >= 2) {
    const last = priceHistory[0].price
    const prev = priceHistory[1].price
    if (prev > 0 && last !== prev) {
      trend = {
        dir: last > prev ? 'up' : 'down',
        pct: Math.round((Math.abs(last - prev) / prev) * 100),
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 overflow-y-auto"
      onClick={onClose}
    >
      <div className="flex min-h-full items-start justify-center p-4 sm:p-8">
        <div
          className="w-full max-w-5xl rounded-lg bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* En-tête */}
          <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-lg font-bold text-gray-900">
                  {l.title ?? 'Annonce'}
                </h1>
                <span className="text-[10px] uppercase bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">
                  {l.source === 'lbc' ? 'LBC' : 'La Centrale'}
                </span>
                {l.url && (
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    Voir l'annonce originale
                  </a>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {l.city} {l.postal_code} · Publié le {fmtDateTime(l.published_at)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-2xl leading-none text-gray-400 hover:text-gray-700"
              title="Fermer"
            >
              ×
            </button>
          </div>

          {currentColumnName === 'À ne plus recontacter' && (
            <div className="mx-4 mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
              Liste d'opposition — ne pas recontacter ce vendeur (RGPD).
            </div>
          )}

          <div className="grid gap-6 p-4 lg:grid-cols-2">
            {/* Colonne gauche */}
            <div className="space-y-4">
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <div className="relative h-64 bg-gray-100">
                  {l.photo_url ? (
                    <img
                      src={l.photo_url}
                      alt=""
                      className="h-64 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-64 w-full items-center justify-center text-gray-400">
                      {l.brand ?? 'Annonce'}
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-3 py-1.5 text-sm text-white">
                    {l.city} {l.postal_code}
                  </div>
                </div>
                <div className="space-y-2 p-4">
                  <p className="text-2xl font-bold text-red-600">
                    {l.price != null
                      ? `${l.price.toLocaleString('fr-FR')} €`
                      : '—'}
                    {trend && (
                      <span
                        className={
                          trend.dir === 'up'
                            ? 'ml-2 text-base text-red-600'
                            : 'ml-2 text-base text-green-600'
                        }
                      >
                        {trend.dir === 'up' ? '↗' : '↘'} {trend.pct}%
                      </span>
                    )}
                  </p>
                  <CopyPhoneButton phone={l.phone} phoneE164={l.phone_e164} />
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <h2 className="mb-3 font-semibold text-gray-900">
                  Caractéristiques
                </h2>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <dt className="text-gray-500">Marque</dt>
                  <dd className="text-gray-900">{l.brand ?? '—'}</dd>
                  <dt className="text-gray-500">Modèle</dt>
                  <dd className="text-gray-900">{l.model ?? '—'}</dd>
                  <dt className="text-gray-500">Année</dt>
                  <dd className="text-gray-900">{l.year ?? '—'}</dd>
                  <dt className="text-gray-500">Kilométrage</dt>
                  <dd className="text-gray-900">
                    {l.mileage != null
                      ? `${l.mileage.toLocaleString('fr-FR')} km`
                      : '—'}
                  </dd>
                  <dt className="text-gray-500">Carburant</dt>
                  <dd className="text-gray-900">{l.fuel ?? '—'}</dd>
                  <dt className="text-gray-500">Boîte</dt>
                  <dd className="text-gray-900">{l.gearbox ?? '—'}</dd>
                  <dt className="text-gray-500">Puissance</dt>
                  <dd className="text-gray-900">{l.power ?? '—'}</dd>
                  <dt className="text-gray-500">État</dt>
                  <dd className="text-gray-900">{l.condition ?? '—'}</dd>
                  <dt className="text-gray-500">Distance agence</dt>
                  <dd className="text-gray-900">
                    {l.distance_km != null
                      ? `${l.distance_km.toLocaleString('fr-FR')} km`
                      : '—'}
                  </dd>
                </dl>
              </div>

              {l.description && (
                <div className="rounded-lg border border-gray-200 p-4">
                  <h2 className="mb-2 font-semibold text-gray-900">
                    Description
                  </h2>
                  <p className="whitespace-pre-wrap text-sm text-gray-700">
                    {l.description}
                  </p>
                </div>
              )}
            </div>

            {/* Colonne droite */}
            <div className="space-y-4">
              <div className="space-y-3 rounded-lg border border-green-200 p-4">
                <h2 className="font-semibold text-gray-900">Actions</h2>
                <label className="block text-sm">
                  <span className="text-gray-600">Statut (colonne)</span>
                  <select
                    value={l.column_id ?? ''}
                    onChange={(e) =>
                      run(() => moveListing(l.id, e.target.value))
                    }
                    className="mt-1 w-full rounded border border-gray-300 px-2 py-2 text-sm text-gray-900"
                  >
                    {columns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>

                <DateTimePicker
                  label="Date de RDV"
                  value={l.rdv_date}
                  onChange={(iso) => run(() => setRdvDate(l.id, iso))}
                />

                <DateTimePicker
                  label="Date de rappel"
                  value={l.rappel_date}
                  onChange={(iso) => run(() => setRappelDate(l.id, iso))}
                />

                {canAssign && (
                  <label className="block text-sm">
                    <span className="text-gray-600">Attribution</span>
                    <select
                      value={l.assigned_to ?? ''}
                      onChange={(e) =>
                        run(() => assignListing(l.id, e.target.value || null))
                      }
                      className="mt-1 w-full rounded border border-gray-300 px-2 py-2 text-sm text-gray-900"
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
                {pending && (
                  <p className="text-xs text-gray-500">Enregistrement…</p>
                )}
              </div>

              {/* Notes : liste + ajout dans le même bloc */}
              <div className="rounded-lg border border-orange-200 p-4">
                <h2 className="font-semibold text-gray-900">
                  Notes ({notes.length})
                </h2>
                <ul className="mt-3 space-y-3">
                  {notes.length === 0 && (
                    <li className="text-sm text-gray-500">
                      Aucune note pour l'instant.
                    </li>
                  )}
                  {notes.map((n, i) => (
                    <li key={i} className="text-sm">
                      <p className="whitespace-pre-wrap text-gray-800">
                        {n.text}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {n.author ? `${n.author} · ` : ''}
                        {fmtDateTime(n.at)}
                      </p>
                    </li>
                  ))}
                </ul>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    const t = note
                    setNote('')
                    run(() => addNote(l.id, t))
                  }}
                  className="mt-4 flex items-start gap-2"
                >
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    placeholder="Entrez votre note ici…"
                    className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-900 placeholder:text-gray-400"
                  />
                  <button
                    type="submit"
                    className="rounded bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
                  >
                    Ajouter
                  </button>
                </form>
              </div>

              <div className="rounded-lg border border-blue-200 p-4">
                <h2 className="mb-3 font-semibold text-gray-900">
                  Historique de l'annonce ({priceHistory.length + statusHistory.length})
                </h2>
                <h3 className="text-xs font-semibold uppercase text-gray-500">
                  Prix
                </h3>
                {priceHistory.length === 0 ? (
                  <p className="mt-1 text-sm text-gray-500">
                    Aucune variation de prix.
                  </p>
                ) : (
                  <ul className="mt-1 space-y-1 text-sm">
                    {priceHistory.map((h, i) => (
                      <li key={i} className="flex justify-between">
                        <span className="text-gray-500">{fmtDateTime(h.at)}</span>
                        <span className="text-gray-900">
                          {h.price.toLocaleString('fr-FR')} €
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <h3 className="mt-3 text-xs font-semibold uppercase text-gray-500">
                  Statuts
                </h3>
                {statusHistory.length === 0 ? (
                  <p className="mt-1 text-sm text-gray-500">Aucun déplacement.</p>
                ) : (
                  <ul className="mt-1 space-y-1 text-sm">
                    {statusHistory.map((s, i) => (
                      <li key={i} className="flex justify-between gap-2">
                        <span className="text-gray-900">
                          {s.from ?? '—'} → {s.to ?? '—'}
                          {s.author ? ` · ${s.author}` : ''}
                        </span>
                        <span className="text-gray-500">{fmtDateTime(s.at)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
