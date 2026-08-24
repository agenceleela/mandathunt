'use client'

import { useTransition } from 'react'
import { setActiveAgency } from '@/lib/auth/actions'
import { useRouter } from 'next/navigation'

interface Agency {
  id: string
  name: string
  city: string
  postal_code: string
}

interface AgencySelectorProps {
  agencies: Agency[]
  currentAgencyId: string
}

export default function AgencySelector({ agencies, currentAgencyId }: AgencySelectorProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const agencyId = e.target.value
    startTransition(async () => {
      await setActiveAgency(agencyId)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-zinc-500 dark:text-zinc-400">Agence :</span>
      <select
        value={currentAgencyId}
        onChange={handleChange}
        disabled={isPending}
        className="px-3 py-1.5 text-sm border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {agencies.map((agency) => (
          <option key={agency.id} value={agency.id}>
            {agency.name} ({agency.city})
          </option>
        ))}
      </select>
    </div>
  )
}
