'use client'

import { useState } from 'react'
import Link from 'next/link'

export type Listing = {
  id: string
  column_id: string | null
  title: string | null
  photo_url: string | null
  city: string | null
  postal_code: string | null
  price: number | null
  brand: string | null
  model: string | null
  year: number | null
  mileage: number | null
  fuel: string | null
  phone: string | null
  phone_e164: string | null
  source: string
  published_at: string | null
  assignee: string | null
  trend: { dir: 'up' | 'down'; pct: number } | null
}

export function ListingCard({ listing }: { listing: Listing }) {
  const [copied, setCopied] = useState(false)
  const [imgError, setImgError] = useState(false)

  const copyPhone = async () => {
    if (!listing.phone_e164) return
    try {
      await navigator.clipboard.writeText(listing.phone_e164)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // presse-papiers indisponible
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden cursor-grab">
      <Link href={`/annonces/${listing.id}`} className="block relative h-32 bg-gray-100">
        {listing.photo_url && !imgError ? (
          <img
            src={listing.photo_url}
            alt=""
            className="h-32 w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="h-32 w-full flex items-center justify-center text-gray-400 text-sm">
            {listing.brand ?? 'Annonce'}
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1">
          {listing.city} {listing.postal_code}
        </div>
      </Link>

      <div className="p-3 space-y-2">
        <Link
          href={`/annonces/${listing.id}`}
          className="block text-sm font-semibold text-gray-900 hover:text-indigo-600"
        >
          {listing.title}
        </Link>

        <div className="flex items-center justify-between gap-2">
          <p className="text-red-600 font-bold">
            {listing.price != null
              ? `${listing.price.toLocaleString('fr-FR')} €`
              : '—'}
            {listing.trend && (
              <span
                className={
                  listing.trend.dir === 'up'
                    ? 'ml-1 text-red-600'
                    : 'ml-1 text-green-600'
                }
              >
                {listing.trend.dir === 'up' ? '↗' : '↘'} {listing.trend.pct}%
              </span>
            )}
          </p>
          {listing.phone_e164 && (
            <button
              onClick={copyPhone}
              className="text-xs border border-blue-300 text-blue-700 rounded px-2 py-1 hover:bg-blue-50"
              title="Copier au format +33"
            >
              {copied ? 'copié !' : listing.phone}
            </button>
          )}
        </div>

        <p className="text-xs text-gray-600">
          {listing.model} – {listing.year}
        </p>
        <p className="text-xs text-gray-600">
          {listing.mileage != null
            ? listing.mileage.toLocaleString('fr-FR')
            : '—'}{' '}
          km – {listing.fuel}
        </p>
        <p className="text-xs text-gray-500">
          Publié le{' '}
          {listing.published_at
            ? new Date(listing.published_at).toLocaleDateString('fr-FR')
            : '—'}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">
            {listing.source === 'lbc' ? 'LBC' : 'La Centrale'}
          </span>
          <span className="text-xs text-gray-600 border border-gray-200 rounded px-2 py-0.5">
            {listing.assignee ?? 'Non attribué'}
          </span>
        </div>
      </div>
    </div>
  )
}
