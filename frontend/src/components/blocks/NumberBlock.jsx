import React, { useState } from 'react';
import { INPUT_CLASS } from './styles';

export function NumberView({ value, className = '' }) {
  return <span className={`block truncate ${className}`}>{typeof value === 'number' ? value : ''}</span>;
}

// Text while typing ("5." stays "5."), number in storage. Blank clears the value.
export function NumberDraftInput({ value, onChange, className = '', ...props }) {
  const [text, setText] = useState(typeof value === 'number' ? String(value) : '');

  const handleChange = (e) => {
    const next = e.target.value;
    setText(next);
    if (next.trim() === '') onChange(undefined);
    else if (Number.isFinite(Number(next))) onChange(Number(next));
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      onChange={handleChange}
      className={`${INPUT_CLASS} ${className}`}
      {...props}
    />
  );
}

export function NumberInput({ value, onChange, placeholder, autoFocus, flagged }) {
  return (
    <NumberDraftInput
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className={`px-4 h-10 rounded-full ${flagged ? 'ring-2 ring-amber-400/70' : ''}`}
    />
  );
}
