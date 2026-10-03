import React from 'react';
import { INPUT_CLASS } from './styles';

export function LongtextView({ value, className = '' }) {
  return <p className={`whitespace-pre-wrap break-words ${className}`}>{value}</p>;
}

export function LongtextInput({ value, onChange, placeholder, autoFocus, flagged }) {
  return (
    <textarea
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className={`${INPUT_CLASS} p-3 rounded-xl resize-none h-24 ${flagged ? 'ring-2 ring-amber-400/70' : ''}`}
    />
  );
}
