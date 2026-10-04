import React, { useMemo } from 'react';
import ListWidget from '../ListWidget';
import { useActions } from '../../store';
import { toListEntries } from './listEntries';

export default function ListCard({ item, isCompact }) {
  const { updateItem } = useActions();

  // Normalized: tolerates corrupted shapes (JSON string, bare strings) without spreading strings.
  // Memoized: ListWidget resyncs its local state whenever data.items changes identity.
  const items = useMemo(() => toListEntries(item.fields.items), [item.fields.items]);

  const data = {
    title: item.fields.title,
    date: item.fields.date,
    items: items,
  };

  const handleToggleItem = (id) => {
    const newItems = items.map((i) =>
      i.id === id ? { ...i, isChecked: !i.isChecked } : i
    );
    updateItem(item.id, { items: newItems }).catch(() => {}); // failure shown by SaveStatus
  };

  return <ListWidget data={data} onToggleItem={handleToggleItem} isCompact={isCompact} />;
}
