import { useEffect, useState } from 'react';

// Matches the exit animations in index.css (.is-closing rules).
export const EXIT_MS = 240;

const present = (v) => v !== null && v !== undefined && v !== false;

// Keeps a popup on screen briefly after it's dismissed so its exit animation can play.
// Returns [value to render, closing]: while closing, the last present value (e.g. the item being
// deleted, which may already be gone from the board) is kept. Pass `isOpen || null` for booleans.
export function useExiting(value, ms = EXIT_MS) {
  const [shown, setShown] = useState(present(value) ? value : null);
  if (present(value) && value !== shown) setShown(value);
  const closing = !present(value) && shown !== null;
  useEffect(() => {
    if (!closing) return;
    const t = setTimeout(() => setShown(null), ms);
    return () => clearTimeout(t);
  }, [closing, ms]);
  return [present(value) ? value : shown, closing];
}
