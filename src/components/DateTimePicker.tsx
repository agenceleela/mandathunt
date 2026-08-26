'use client'

import { useState } from 'react'

const HEURES = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5)
const JOURS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

const pad = (n: number) => String(n).padStart(2, '0')

function fmtValue(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}, ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`
}

export function DateTimePicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: string | null
  onChange: (iso: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(new Date().getMonth())
  const [sel, setSel] = useState<{ y: number; m: number; d: number } | null>(
    null
  )
  const [hour, setHour] = useState(0)
  const [minute, setMinute] = useState(0)

  const openPopup = () => {
    if (value) {
      const d = new Date(value)
      if (!Number.isNaN(d.getTime())) {
        setViewYear(d.getFullYear())
        setViewMonth(d.getMonth())
        setSel({ y: d.getFullYear(), m: d.getMonth(), d: d.getDate() })
        setHour(d.getHours())
        setMinute((Math.round(d.getMinutes() / 5) * 5) % 60)
      }
    } else {
      const now = new Date()
      setViewYear(now.getFullYear())
      setViewMonth(now.getMonth())
      setSel(null)
      setHour(0)
      setMinute(0)
    }
    setOpen(true)
  }

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  const first = new Date(viewYear, viewMonth, 1)
  const offset = (first.getDay() + 6) % 7
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  const monthLabel = first.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  })

  const valider = () => {
    if (!sel) return
    const d = new Date(sel.y, sel.m, sel.d, hour, minute)
    onChange(d.toISOString())
    setOpen(false)
  }

  return (
    <div className="relative block text-sm">
      <span className="text-gray-600">{label}</span>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPopup())}
        className={
          value
            ? 'mt-1 w-full rounded border border-gray-300 px-2 py-2 text-left text-sm text-gray-900'
            : 'mt-1 w-full rounded border border-gray-300 px-2 py-2 text-left text-sm text-gray-400'
        }
      >
        {value ? fmtValue(value) : 'dd/mm/yyyy, --:--'}
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-80 rounded-lg border border-gray-200 bg-white p-3 shadow-xl">
          <div className="flex gap-3">
            {/* Calendrier */}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="px-2 text-gray-500 hover:text-gray-800"
                >
                  ‹
                </button>
                <span className="text-sm text-gray-800">{monthLabel}</span>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="px-2 text-gray-500 hover:text-gray-800"
                >
                  ›
                </button>
              </div>
              <div className="mt-2 grid grid-cols-7 text-center text-[11px] text-gray-500">
                {JOURS.map((j, i) => (
                  <span key={i}>{j}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 text-center text-sm">
                {cells.map((d, i) =>
                  d === null ? (
                    <span key={i} />
                  ) : (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSel({ y: viewYear, m: viewMonth, d })}
                      className={
                        sel && sel.y === viewYear && sel.m === viewMonth && sel.d === d
                          ? 'mx-auto my-0.5 flex h-7 w-7 items-center justify-center rounded-full border border-red-400 text-red-600'
                          : 'mx-auto my-0.5 flex h-7 w-7 items-center justify-center rounded-full text-gray-800 hover:bg-gray-100'
                      }
                    >
                      {d}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Heures / minutes */}
            <div className="flex gap-1">
              <div className="max-h-44 w-12 overflow-y-auto rounded border border-gray-200">
                {HEURES.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHour(h)}
                    className={
                      h === hour
                        ? 'block w-full bg-indigo-600 px-1 py-0.5 text-xs text-white'
                        : 'block w-full px-1 py-0.5 text-xs text-gray-800 hover:bg-gray-100'
                    }
                  >
                    {pad(h)}
                  </button>
                ))}
              </div>
              <div className="max-h-44 w-12 overflow-y-auto rounded border border-gray-200">
                {MINUTES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMinute(m)}
                    className={
                      m === minute
                        ? 'block w-full bg-indigo-600 px-1 py-0.5 text-xs text-white'
                        : 'block w-full px-1 py-0.5 text-xs text-gray-800 hover:bg-gray-100'
                    }
                  >
                    {pad(m)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onChange(null)
                setOpen(false)
              }}
              className="text-xs text-gray-500 hover:text-gray-800"
            >
              Effacer
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={valider}
                className="rounded bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
