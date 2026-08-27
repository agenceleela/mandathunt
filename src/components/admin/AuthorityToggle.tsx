'use client'

import { useTransition } from 'react'
import { updateAgencyAuthority } from '@/lib/admin/actions'

export function AuthorityToggle({
  agencyId,
  selfManaged,
}: {
  agencyId: string
  selfManaged: boolean
}) {
  const [pending, startTransition] = useTransition()

  const set = (value: boolean) => {
    startTransition(async () => {
      await updateAgencyAuthority(agencyId, value)
    })
  }

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm text-gray-900">
        <input
          type="radio"
          name="authority"
          checked={selfManaged}
          onChange={() => set(true)}
          className="h-4 w-4 text-blue-600 border-gray-300"
        />
        Superadmin + admin local
      </label>
      <label className="flex items-center gap-2 text-sm text-gray-900">
        <input
          type="radio"
          name="authority"
          checked={!selfManaged}
          onChange={() => set(false)}
          className="h-4 w-4 text-blue-600 border-gray-300"
        />
        Superadmin uniquement
      </label>
      {pending && <p className="text-xs text-gray-500">Enregistrement…</p>}
    </div>
  )
}
