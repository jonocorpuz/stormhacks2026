import React from 'react';
import { useActions, useApp } from '../store';

// Drag-and-drop extraction progress. Pending pills clear on success; failures stay until dismissed.
export default function ExtractionStatus() {
  const extractions = useApp((s) => s.extractions);
  const { dismissExtraction } = useActions();
  if (!extractions.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 max-w-sm">
      {extractions.map(({ id, name, status, error }) => (
        <div
          key={id}
          className="apple-glass px-5 py-2.5 rounded-full text-sm shadow-2xl flex items-center gap-3 max-w-full"
        >
          {status === 'pending' ? (
            <>
              <span className="w-3 h-3 shrink-0 rounded-full border-2 border-current border-t-transparent animate-spin text-black/50 dark:text-white/60" />
              <span className="truncate text-black/70 dark:text-white/80">Reading {name ?? 'image'}…</span>
            </>
          ) : (
            <>
              <span className="truncate text-red-500 dark:text-red-400">
                {name ? `${name}: ` : ''}
                {error}
              </span>
              <button
                onClick={() => dismissExtraction(id)}
                aria-label="Dismiss"
                className="shrink-0 opacity-60 hover:opacity-100 text-black dark:text-white"
              >
                ×
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
