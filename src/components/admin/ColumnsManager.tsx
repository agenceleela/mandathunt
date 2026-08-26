'use client';

import { useState } from 'react';
import { useFormState } from 'react-dom';
import { createColumn, updateColumn, deleteColumn, reorderColumns } from '@/lib/admin/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Column {
  id: string;
  name: string;
  color: string;
  position: number;
}

interface ColumnsManagerProps {
  agencyId: string;
  initialColumns: Column[];
}

export function ColumnsManager({ agencyId, initialColumns }: ColumnsManagerProps) {
  const [columns, setColumns] = useState(initialColumns);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnColor, setNewColumnColor] = useState('#3b82f6');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const handleCreate = async () => {
    if (!newColumnName.trim()) return;
    await createColumn(agencyId, newColumnName, newColumnColor);
    setNewColumnName('');
    setNewColumnColor('#3b82f6');
  };

  const handleUpdate = async (columnId: string) => {
    await updateColumn(columnId, editName, editColor);
    setEditingId(null);
  };

  const handleDelete = async (columnId: string) => {
    if (!confirm('Supprimer cette colonne ? Les annonces seront déplacées vers la première colonne.')) return;
    await deleteColumn(columnId);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (dragIndex === dropIndex) return;

    const newColumns = [...columns];
    const [removed] = newColumns.splice(dragIndex, 1);
    newColumns.splice(dropIndex, 0, removed);
    setColumns(newColumns);

    await reorderColumns(newColumns.map((c) => c.id));
  };

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
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="color"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  className="w-20"
                />
                <Button size="sm" onClick={() => handleUpdate(column.id)}>
                  Valider
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                  Annuler
                </Button>
              </>
            ) : (
              <>
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: column.color }}
                />
                <span className="flex-1">{column.name}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingId(column.id);
                    setEditName(column.name);
                    setEditColor(column.color);
                  }}
                >
                  Modifier
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(column.id)}>
                  Supprimer
                </Button>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-2 pt-4 border-t">
        <Label>Nouvelle colonne</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Nom de la colonne"
            value={newColumnName}
            onChange={(e) => setNewColumnName(e.target.value)}
            className="flex-1"
          />
          <Input
            type="color"
            value={newColumnColor}
            onChange={(e) => setNewColumnColor(e.target.value)}
            className="w-20"
          />
          <Button onClick={handleCreate}>Ajouter</Button>
        </div>
      </div>
    </div>
  );
}
