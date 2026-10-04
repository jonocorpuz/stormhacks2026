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
          className={`apple-glass px-5 py-2.5 text-sm shadow-2xl flex items-center gap-3 max-w-full ${status === 'pending' ? 'rounded-full' : 'rounded-2xl'}`}
        >
          {status === 'pending' ? (
            <>
              <span className="w-3 h-3 shrink-0 rounded-full border-2 border-current border-t-transparent animate-spin text-ink/50 dark:text-ink/60" />
              <span className="truncate text-ink/85 dark:text-ink/80">Reading {name ?? 'image'}…</span>
            </>
          ) : (
            <>
              {/* Full error, wrapped: it's the only clue to what went wrong. Filename may truncate. */}
              <span className="min-w-0 flex flex-col text-danger" title={error}>
                {name && <span className="truncate font-semibold">{name}</span>}
                <span className="break-words select-text">{error}</span>
              </span>
              <button
                onClick={() => dismissExtraction(id)}
                aria-label="Dismiss"
                className="shrink-0 opacity-60 hover:opacity-100 text-ink"
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
