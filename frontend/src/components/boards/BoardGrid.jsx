import React, { useEffect, useRef, useState } from 'react';
import { itemMatchesQuery } from '../../model';
import { useActions, useApp } from '../../store';
import ItemCard from '../items/ItemCard';
import { DEFAULT_SIZE, nextSize } from '../items/sizes';
import ItemEditor from '../ItemEditor';

const EMPTY = {};

// Bento grid of the current board's items.
// Card sizes live in board.view.sizes (presentation, frontend-owned).
// Order = board.items order; edit mode enables drag-to-reorder.
export default function BoardGrid({ query, editMode }) {
  const board = useApp((s) => s.currentBoard);
  const { deleteItem, reorderItems, setView } = useActions();
  const [editingId, setEditingId] = useState(null);
  const [dragId, setDragId] = useState(null);

  // Square cells: 1 row height = 1 column width (3 cols, 2 gaps of 24px)
  const gridRef = useRef(null);
  const [rowHeight, setRowHeight] = useState('200px');
  useEffect(() => {
    if (!gridRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) setRowHeight(`${(entry.contentRect.width - 48) / 3}px`);
    });
    observer.observe(gridRef.current);
    return () => observer.disconnect();
  }, []);

  const sizes = board.view.sizes ?? EMPTY;
  const items = board.items.filter((item) => itemMatchesQuery(item, query));
  const editingItem = board.items.find((i) => i.id === editingId);
  const indexOf = (id) => board.items.findIndex((i) => i.id === id);

  const dragPropsFor = (item) =>
    editMode && {
      draggable: true,
      onDragStart: () => setDragId(item.id),
      onDragOver: (e) => e.preventDefault(),
      onDrop: (e) => {
        e.preventDefault();
        if (dragId && dragId !== item.id) reorderItems(indexOf(dragId), indexOf(item.id));
        setDragId(null);
      },
      onDragEnd: () => setDragId(null),
    };

  return (
    <div className="w-full max-w-7xl mx-auto pt-32 pb-10 px-8">
      {board.items.length === 0 && (
        <p className="text-center text-black/40 dark:text-white/40 pt-24 text-sm">
          Nothing here yet — hit + to add something.
        </p>
      )}
      {board.items.length > 0 && items.length === 0 && (
        <p className="text-center text-black/40 dark:text-white/40 pt-24 text-sm">No matches for “{query}”.</p>
      )}

      <div
        ref={gridRef}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 grid-flow-dense"
        style={{ gridAutoRows: rowHeight }}
      >
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            size={sizes[item.id]}
            editMode={editMode}
            onOpen={() => setEditingId(item.id)}
            onDelete={() => deleteItem(item.id)}
            onCycleSize={() =>
              setView({ sizes: { ...sizes, [item.id]: nextSize(sizes[item.id] ?? DEFAULT_SIZE) } })
            }
            dragProps={dragPropsFor(item) || undefined}
          />
        ))}
      </div>

      {editingItem && <ItemEditor key={editingItem.id} item={editingItem} onClose={() => setEditingId(null)} />}
    </div>
  );
}
