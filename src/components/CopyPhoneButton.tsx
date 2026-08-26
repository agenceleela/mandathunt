'use client'

import { useState } from 'react'

export function CopyPhoneButton({
  phone,
  phoneE164,
}: {
  phone: string | null
  phoneE164: string | null
}) {
  const [copied, setCopied] = useState(false)
  if (!phoneE164) return null

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(phoneE164)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // presse-papiers indisponible
    }
  }

  return (
    <button
      onClick={copy}
      className="text-sm border border-blue-300 text-blue-700 rounded px-3 py-1.5 hover:bg-blue-50"
      title="Copier au format +33"
    >
      {copied ? 'copié !' : phone ?? phoneE164}
    </button>
  )
}
