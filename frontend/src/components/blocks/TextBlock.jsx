import React from 'react';
import { INPUT_CLASS } from './styles';

export function TextView({ value, className = '' }) {
  return <span className={`block truncate ${className}`}>{value}</span>;
}

export function TextInput({ value, onChange, placeholder, autoFocus, flagged }) {
  return (
    <input
      type="text"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className={`${INPUT_CLASS} px-4 h-10 rounded-full ${flagged ? 'ring-2 ring-amber-400/70' : ''}`}
    />
  );
}
