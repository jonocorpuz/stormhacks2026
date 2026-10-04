import React from 'react';
import { Check } from 'lucide-react';
import { INPUT_CLASS } from './styles';

export function ListView({ value, className = '' }) {
  const items = Array.isArray(value) ? value : [];
  return (
    <ul className={`list-disc pl-5 ${className}`}>
      {items.map((it, i) => (
        <li key={i} className={it.isChecked ? 'line-through opacity-50' : ''}>
          {it.title}
        </li>
      ))}
    </ul>
  );
}

export function ListInput({ value, onChange, placeholder, autoFocus, flagged }) {
  const items = Array.isArray(value) ? value : [];

  const handleChange = (i, title) => {
    const newItems = [...items];
    newItems[i] = { ...newItems[i], title };
    onChange(newItems);
  };

  const handleToggle = (i) => {
    const newItems = [...items];
    newItems[i] = { ...newItems[i], isChecked: !newItems[i].isChecked };
    onChange(newItems);
  };

  const handleAdd = () => {
    onChange([...items, { id: crypto.randomUUID(), title: '', isChecked: false }]);
  };

  const handleRemove = (i) => {
    const newItems = [...items];
    newItems.splice(i, 1);
    onChange(newItems);
  };

  return (
    <div className={`space-y-2 ${flagged ? 'ring-2 ring-warning/70 rounded-xl p-1' : ''}`}>
      {items.map((it, i) => (
        // Same row shape as LineItemsInput (receipt): pill field + remove ×; round toggle for done.
        <div key={it?.id ?? i} className="flex gap-2 items-center">
          <button
            type="button"
            role="checkbox"
            aria-checked={Boolean(it.isChecked)}
            aria-label={`Item ${i + 1} done`}
            onClick={() => handleToggle(i)}
            className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              it.isChecked ? 'bg-primary/90 border border-primary/50 text-white shadow-md' : 'apple-glass text-transparent hover:text-ink/30'
            }`}
          >
            <Check className="w-4 h-4" strokeWidth={3} />
          </button>
          <input
            value={it.title || ''}
            onChange={e => handleChange(i, e.target.value)}
            placeholder="Item"
            aria-label={`Item ${i + 1}`}
            className={`${INPUT_CLASS} flex-1 min-w-0 px-4 h-10 rounded-full`}
            autoFocus={autoFocus && i === 0}
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
