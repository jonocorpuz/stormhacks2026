import React from 'react';
import { useApp } from '../store';

// Surfaces store save/load errors. Silent otherwise.
export default function SaveStatus() {
  const status = useApp((s) => s.status);
  const error = useApp((s) => s.error);
  if (status !== 'error') return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 apple-glass px-5 py-2.5 rounded-full text-sm text-red-500 dark:text-red-400 shadow-2xl">
      Couldn't save: {error}
    </div>
  );
}
