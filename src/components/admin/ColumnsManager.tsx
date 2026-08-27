'use client'

import { useState, type DragEvent } from 'react'
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

export function ColumnsManager({
  agencyId,
  initialColumns,
}: ColumnsManagerProps) {
  const [columns, setColumns] = useState(initialColumns)
  const [newColumnName, setNewColumnName] = useState('')
  const [newColumnColor, setNewColumnColor] = useState('#3b82f6')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  const handleCreate = async () => {
    if (!newColumnName.trim()) return
    await createColumn(agencyId, newColumnName.trim(), newColumnColor)
    setNewColumnName('')
    setNewColumnColor('#3b82f6')
  }

  const handleUpdate = async (columnId: string) => {
    if (!editName.trim()) return
    await updateColumn(columnId, editName.trim(), editColor)
    setEditingId(null)
  }

  const handleDelete = async (columnId: string) => {
    if (
      !confirm(
        'Supprimer cette colonne ? Les annonces seront déplacées vers la première colonne.'
      )
    )
      return
    await deleteColumn(columnId)
  }

  const handleDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString())
  }

  const handleDrop = async (e: DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault()
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'), 10)
    if (dragIndex === dropIndex) return
    const newColumns = [...columns]
    const [removed] = newColumns.splice(dragIndex, 1)
    newColumns.splice(dropIndex, 0, removed)
    setColumns(newColumns)
    await reorderColumns(newColumns.map((c) => c.id))
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {columns.map((column, index) => (
          <div
            key={column.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, index)}
            className="flex items-center gap-2 p-2 border rounded cursor-move hover:bg-gray-50"
          >
            {editingId === column.id ? (
              <>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 px-3 py-1 border border-gray-300 rounded text-gray-900"
                />
                <input
                  type="color"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  className="w-20 h-9 border border-gray-300 rounded"
                />
                <button
                  onClick={() => handleUpdate(column.id)}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Valider
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100"
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
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100"
                >
                  Modifier
                </button>
                <button
                  onClick={() => handleDelete(column.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
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
            className="flex-1 px-3 py-2 border border-gray-300 rounded text-gray-900"
          />
          <input
            type="color"
            value={newColumnColor}
            onChange={(e) => setNewColumnColor(e.target.value)}
            className="w-20 h-9 border border-gray-300 rounded"
          />
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Ajouter
          </button>
        </div>
      </div>
    </div>
  )
}
