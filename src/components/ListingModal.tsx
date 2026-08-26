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
    profiles,
    canAssign,
    currentColumnName,
  } = details

  const assignedName =
    profiles.find((p) => p.id === l.assigned_to)?.name ?? null

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

  // Historique source : du plus ancien au plus récent, avec au minimum
  // une ligne "Nouvelle publication" (date de publication + prix actuel)
  const fromHistory = [...priceHistory]
    .reverse()
    .map((h, i) => ({
      at: h.at,
      price: h.price,
      label: i === 0 ? 'Nouvelle publication' : 'Modification de prix',
    }))
  const timeline = (
    fromHistory.length
      ? fromHistory
      : [
          {
            at: l.published_at ?? '',
            price: l.price,
            label: 'Nouvelle publication',
          },
        ]
  ).reverse()

  const submitNote = () => {
    const t = note.trim()
    if (!t) return
    setNote('')
    run(() => addNote(l.id, t))
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 overflow-y-auto"
      onClick={onClose}
    >
      <div className="flex min-h-full items-start justify-center p-4 sm:p-8">
        <div
          className="w-full max-w-6xl rounded-lg bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* En-tête */}
          <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-lg font-bold text-gray-900">
                  {l.title ?? 'Annonce'}
                </h1>
                {l.url && (
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    Consulter
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

          {/* 3 colonnes : photo | contacter | gérer */}
          <div className="grid gap-4 p-4 lg:grid-cols-3">
            {/* Gauche : photo + prix + caractéristiques + description */}
            <div className="space-y-4">
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <div className="relative h-56 bg-gray-100">
                  {l.photo_url ? (
                    <img
                      src={l.photo_url}
                      alt=""
                      className="h-56 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-56 w-full items-center justify-center text-gray-400">
                      {l.brand ?? 'Annonce'}
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-3 py-1.5 text-sm text-white">
                    {l.city} {l.postal_code}
                  </div>
                </div>
              </div>

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

              <div>
                <h2 className="mb-2 text-sm font-semibold text-gray-900">
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
                <div>
                  <h2 className="mb-2 text-sm font-semibold text-gray-900">
                    Description
                  </h2>
                  <p className="whitespace-pre-wrap text-sm text-gray-700">
                    {l.description}
                  </p>
                </div>
              )}
            </div>

            {/* Centre : contacter le propriétaire */}
            <div className="space-y-4">
              <div className="space-y-3 rounded-lg border border-blue-300 p-4">
                <h2 className="text-sm font-semibold text-gray-900">
                  Contacter le propriétaire
                </h2>
                <div>
                  <span className="inline-block rounded border border-orange-300 px-2 py-1 text-xs text-orange-600">
                    {l.source === 'lbc' ? 'leboncoin' : 'La Centrale'}
                  </span>
                </div>
                <div>
                  <CopyPhoneButton
                    phone={l.phone}
                    phoneE164={l.phone_e164}
                  />
                </div>
              </div>
            </div>

            {/* Droite : gérer + notes + historique */}
            <div className="space-y-4">
              <div className="space-y-3 rounded-lg border border-green-300 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-sm">
                    <span className="text-xs text-gray-500">Géré par</span>
                    {canAssign ? (
                      <select
                        value={l.assigned_to ?? ''}
                        onChange={(e) =>
                          run(() =>
                            assignListing(l.id, e.target.value || null)
                          )
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
                    ) : (
                      <p className="mt-1 text-gray-900">
                        {assignedName ?? 'Non attribué'}
                      </p>
                    )}
                  </div>
                  <div className="text-sm">
                    <span className="text-xs text-gray-500">Statut</span>
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
                  </div>
                </div>

                <DateTimePicker
                  label="Définir un rappel"
                  value={l.rappel_date}
                  onChange={(iso) => run(() => setRappelDate(l.id, iso))}
                />

                <DateTimePicker
                  label="Ajouter un rendez-vous"
                  value={l.rdv_date}
                  onChange={(iso) => run(() => setRdvDate(l.id, iso))}
                />

                {pending && (
                  <p className="text-xs text-gray-500">Enregistrement…</p>
                )}
              </div>

              {/* Notes sous Gérer */}
              <div className="rounded-lg border border-orange-300 p-4">
                <h2 className="text-sm font-semibold text-gray-900">
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
                <div className="mt-4 flex items-start gap-2">
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        submitNote()
                      }
                    }}
                    rows={2}
                    placeholder="Entrez votre note ici…"
                    className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-900 placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={submitNote}
                    className="rounded bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
                  >
                    Ajouter
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-gray-400">
                  Entrée pour ajouter · Maj+Entrée pour aller à la ligne
                </p>
              </div>

              {/* Historique sous Notes */}
              <div className="rounded-lg border border-teal-300 p-4">
                <h2 className="text-sm font-semibold text-gray-900">
                  Historique de l'annonce ({timeline.length})
                </h2>
                <ul className="mt-3 space-y-3 text-sm">
                  {timeline.map((h, i) => (
                    <li
                      key={i}
                      className="flex items-start justify-between gap-2"
                    >
                      <div>
                        <p className="text-gray-500">{fmtDateTime(h.at)}</p>
                        <p className="text-xs text-red-500">{h.label}</p>
                      </div>
                      <span className="font-semibold text-gray-900">
                        {h.price != null
                          ? `${h.price.toLocaleString('fr-FR')} €`
                          : '—'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
