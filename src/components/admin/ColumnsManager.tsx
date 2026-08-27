'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  createColumn,
  updateColumn,
  deleteColumn,
  reorderColumns,
} from '@/lib/admin/actions'

export type ColumnRow = {
  id: string
  name: string
  color: string
  position: number
}

interface ColumnsManagerProps {
  agencyId: string
  initialColumns: ColumnRow[]
}

const inputClass =
  'px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
const btnClass =
  'px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
const btnOutlineClass =
  'px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50'
const btnDestructiveClass =
  'px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50'

export function ColumnsManager({ agencyId, initialColumns }: ColumnsManagerProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [columns, setColumns] = useState(initialColumns)
  const [newColumnName, setNewColumnName] = useState('')
  const [newColumnColor, setNewColumnColor] = useState('#3b82f6')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  // Synchronise l'état local quand le serveur renvoie de nouvelles données
  useEffect(() => {
    setColumns(initialColumns)
  }, [initialColumns])

  const run = (fn: () => Promise<void>) => {
    startTransition(async () => {
      await fn()
      router.refresh()
    })
  }

  const handleCreate = () => {
    const name = newColumnName.trim()
    if (!name) return
    setNewColumnName('')
    setNewColumnColor('#3b82f6')
    run(() => createColumn(agencyId, name, newColumnColor))
  }

  const handleUpdate = (columnId: string) => {
    const name = editName.trim()
    if (!name) return
    setEditingId(null)
    run(() => updateColumn(columnId, name, editColor))
  }

  const handleDelete = (columnId: string) => {
    if (
      !window.confirm(
        'Supprimer cette colonne ? Les annonces seront déplacées vers la première colonne.'
      )
    )
      return
    run(() => deleteColumn(columnId))
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString())
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'), 10)
    if (dragIndex === dropIndex) return
    const next = [...columns]
    const [removed] = next.splice(dragIndex, 1)
    next.splice(dropIndex, 0, removed)
    setColumns(next)
    run(() => reorderColumns(next.map((c) => c.id)))
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {columns.map((column, index) => (
          <div
            key={column.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            className="flex items-center gap-2 p-2 border rounded cursor-move hover:bg-gray-50"
          >
            {editingId === column.id ? (
              <>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={`${inputClass} flex-1`}
                />
                <input
                  type="color"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  className="w-20 h-9 border border-gray-300 rounded"
                />
                <button
                  onClick={() => handleUpdate(column.id)}
                  disabled={pending}
                  className={btnClass}
                >
                  Valider
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  disabled={pending}
                  className={btnOutlineClass}
                >
                  Annuler
                </button>
              </>
            ) : (
              <>
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: column.color }}
                />
                <span className="flex-1">{column.name}</span>
                <button
                  onClick={() => {
                    setEditingId(column.id)
                    setEditName(column.name)
                    setEditColor(column.color)
                  }}
                  disabled={pending}
                  className={btnOutlineClass}
                >
                  Modifier
                </button>
                <button
                  onClick={() => handleDelete(column.id)}
                  disabled={pending}
                  className={btnDestructiveClass}
                >
                  Supprimer
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-2 pt-4 border-t">
        <span className="block text-sm font-medium">Nouvelle colonne</span>
        <div className="flex gap-2">
          <input
            placeholder="Nom de la colonne"
            value={newColumnName}
            onChange={(e) => setNewColumnName(e.target.value)}
            className={`${inputClass} flex-1`}
          />
          <input
            type="color"
            value={newColumnColor}
            onChange={(e) => setNewColumnColor(e.target.value)}
            className="w-20 h-9 border border-gray-300 rounded"
          />
          <button onClick={handleCreate} disabled={pending} className={btnClass}>
            Ajouter
          </button>
        </div>
        {pending && (
          <p className="text-xs text-gray-500">Enregistrement…</p>
        )}
      </div>
    </div>
  )
}