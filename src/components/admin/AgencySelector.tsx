'use client'

import { useRouter } from 'next/navigation'

export function AgencySelector({
  agencies,
  currentId,
}: {
  agencies: { id: string; name: string }[]
  currentId: string
}) {
  const router = useRouter()
  return (
    <select
      value={currentId}
      onChange={(e) => router.push(`/reglages?agence=${e.target.value}`)}
      className="px-3 py-2 border border-gray-300 rounded bg-white text-gray-900"
    >
      {agencies.map((a) => (
        <option key={a.id} value={a.id}>
          {a.name}
        </option>
      ))}
    </select>
  )
}
