import React from 'react';
import { INPUT_CLASS } from './styles';
import { NumberDraftInput } from './NumberBlock';

const formatPrice = (price) => (typeof price === 'number' ? price.toFixed(2) : '');

export function LineItemsView({ value, className = '' }) {
  const items = Array.isArray(value) ? value : [];
  return (
    <ul className={className}>
      {items.map((it, i) => (
        <li key={it?.id ?? i} className="flex justify-between gap-2">
          <span className="truncate">{it?.name}</span>
          <span>{formatPrice(it?.price)}</span>
        </li>
      ))}
    </ul>
  );
}

export function LineItemsInput({ value, onChange, autoFocus, flagged }) {
  const items = Array.isArray(value) ? value : [];

  const update = (i, patch) => {
    const next = [...items];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };

  const handleAdd = () => {
    onChange([...items, { id: crypto.randomUUID(), name: '', price: 0 }]);
  };

  const handleRemove = (i) => {
    onChange(items.filter((_, j) => j !== i));
  };

  return (
    <div className={`space-y-2 ${flagged ? 'ring-2 ring-warning/70 rounded-xl p-1' : ''}`}>
      {items.map((it, i) => (
        <div key={it?.id ?? i} className="flex gap-2 items-center">
          <input
            value={it?.name ?? ''}
            onChange={(e) => update(i, { name: e.target.value })}
            placeholder="Item"
            aria-label={`Item ${i + 1} name`}
            className={`${INPUT_CLASS} flex-1 min-w-0 px-4 h-10 rounded-full`}
            autoFocus={autoFocus && i === 0}
          />
          <NumberDraftInput
            value={it?.price}
            onChange={(price) => update(i, { price: price ?? 0 })}
            placeholder="0.00"
            aria-label={`Item ${i + 1} price`}
            className="px-4 h-10 rounded-full text-right"
            // INPUT_CLASS sets w-full; an inline width wins so the name keeps the remaining space.
            style={{ width: '6.5rem', flex: 'none' }}
          />
          <button
            type="button"
            onClick={() => handleRemove(i)}
            aria-label={`Remove item ${i + 1}`}
            className="text-danger font-bold w-6 hover:text-danger-strong"
          >
            ×
          </button>
        </div>
      ))}
      <button type="button" onClick={handleAdd} className="text-sm font-medium text-primary hover:text-primary-strong w-full text-left px-1">
        + Add Item
      </button>
    </div>
  );
}
