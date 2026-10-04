import React from 'react';
import ListWidget from '../ListWidget';
import { useActions } from '../../store';

export default function ListCard({ item, primitive }) {
  const { updateItem } = useActions();

  // Try parsing in case we stored JSON, otherwise use as array or fallback to empty
  let items = [];
  if (Array.isArray(item.fields.items)) {
    items = item.fields.items;
  } else if (typeof item.fields.items === 'string') {
    try {
      items = JSON.parse(item.fields.items);
    } catch (e) {
      items = [];
    }
  }

  const data = {
    title: item.fields.title,
    date: item.fields.date,
    items: items,
  };

  const handleToggleItem = (id) => {
    const newItems = items.map((i) =>
      i.id === id ? { ...i, isChecked: !i.isChecked } : i
    );
    updateItem(item.id, { items: newItems });
  };

  return <ListWidget data={data} onToggleItem={handleToggleItem} />;
}
