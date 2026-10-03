import React from 'react';

// Fallback for values that don't match their block (or unknown blocks).
// Shows the raw data instead of hiding it — never lose information.
export function RawView({ value, className = '' }) {
  return (
    <code className={`block text-xs text-amber-600 dark:text-amber-300 break-all ${className}`}>
      {JSON.stringify(value)}
    </code>
  );
}
