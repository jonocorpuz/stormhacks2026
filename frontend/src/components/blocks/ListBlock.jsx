import React from 'react';
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
        <div key={i} className="flex gap-2 items-center">
          <input
            type="checkbox"
            checked={it.isChecked || false}
            onChange={() => handleToggle(i)}
            className="w-4 h-4"
          />
          <input
            value={it.title || ''}
            onChange={e => handleChange(i, e.target.value)}
            className={`${INPUT_CLASS} flex-1`}
            autoFocus={autoFocus && i === 0}
          />
          <button onClick={() => handleRemove(i)} className="text-danger font-bold w-6 hover:text-danger-strong">×</button>
        </div>
      ))}
      <button onClick={handleAdd} className="text-sm font-medium text-primary hover:text-primary-strong w-full text-left px-1">
        + Add Item
      </button>
    </div>
  );
}
