import React from 'react';

// Fallback for values that don't match their block (or unknown blocks).
// Shows the raw data instead of hiding it — never lose information.
export function RawView({ value, className = '' }) {
  return (
    <code className={`block text-xs text-warning break-all ${className}`}>
      {JSON.stringify(value)}
    </code>
  );
}
