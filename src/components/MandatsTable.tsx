'use client'

import { useState } from 'react'
import { ListingModal } from '@/components/ListingModal'
import { CopyPhoneButton } from '@/components/CopyPhoneButton'

export type MandatRow = {
  id: string
  title: string | null
  photo_url: string | null
  city: string | null
  postal_code: string | null
  price: number | null
  brand: string | null
  model: string | null
  year: number | null
  phone: string | null
  phone_e164: string | null
  source: string
  rdv_date: string | null
  status: string
  assignee: string | null
}

const fmtDateTime = (s: string | null) =>
  s
    ? new Date(s).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'

export function MandatsTable({ rows }: { rows: MandatRow[] }) {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 text-left text-gray-700">
          <tr>
            <th className="p-3 font-semibold">Annonce</th>
            <th className="p-3 font-semibold">Ville</th>
            <th className="p-3 font-semibold">Prix</th>
            <th className="p-3 font-semibold">Téléphone</th>
            <th className="p-3 font-semibold">Source</th>
            <th className="p-3 font-semibold">RDV</th>
            <th className="p-3 font-semibold">Statut</th>
            <th className="p-3 font-semibold">Attribué à</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {rows.length === 0 && (
            <tr>
              <td colSpan={8} className="p-6 text-center text-gray-500">
                Aucun mandat pour l'instant. Déplacez une annonce en
                « RDV MANDAT » ou définissez une date de rendez-vous.
              </td>
            </tr>
          )}
          {rows.map((r) => (
            <tr
              key={r.id}
              onClick={() => setOpenId(r.id)}
              className="cursor-pointer hover:bg-gray-50"
            >
              <td className="p-3">
                <div className="flex items-center gap-3">
                  {r.photo_url ? (
                    <img
                      src={r.photo_url}
                      alt=""
                      className="h-10 w-14 rounded object-cover"
                    />
                  ) : (
                    <div className="h-10 w-14 rounded bg-gray-200" />
                  )}
                  <div>
                    <div className="font-medium text-gray-900">
                      {r.title ?? 'Annonce'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {[r.model, r.year].filter(Boolean).join(' ')}
                    </div>
                  </div>
                </div>
              </td>
              <td className="p-3 text-gray-600">
                {r.city} {r.postal_code}
              </td>
              <td className="p-3 font-semibold text-red-600">
                {r.price != null
                  ? `${r.price.toLocaleString('fr-FR')} €`
                  : '—'}
              </td>
              <td
                className="p-3"
                onClick={(e) => e.stopPropagation()}
              >
                {r.phone_e164 ? (
                  <CopyPhoneButton phone={r.phone} phoneE164={r.phone_e164} />
                ) : (
                  '—'
                )}
              </td>
              <td className="p-3">
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] uppercase text-gray-600">
                  {r.source === 'lbc' ? 'LBC' : 'La Centrale'}
                </span>
              </td>
              <td className="p-3 text-gray-900">{fmtDateTime(r.rdv_date)}</td>
              <td className="p-3 text-gray-600">{r.status}</td>
              <td className="p-3 text-gray-600">
                {r.assignee ?? 'Non attribué'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {openId && (
        <ListingModal listingId={openId} onClose={() => setOpenId(null)} />
      )}
    </div>
  )
}