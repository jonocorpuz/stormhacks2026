// Coerces whatever is stored under a list field into valid checklist entries for display.
// Stored data may be corrupted (JSON string, bare strings, non-arrays); spreading a string
// would yield { '0': 'T', '1': 'a', ... }, so every entry is rebuilt explicitly.

import type { ListItem } from '../../types/widgets';

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Ids derived from position are stable across renders, so toggles find the same entry. */
function toEntry(raw: unknown, index: number): ListItem | null {
  if (typeof raw === 'string' || typeof raw === 'number') {
    return { id: `entry-${index}`, title: String(raw), isChecked: false };
  }
  if (!isRecord(raw)) return null;
  const title = raw.title ?? raw.name ?? raw.text;
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : `entry-${index}`,
    title: typeof title === 'string' || typeof title === 'number' ? String(title) : '',
    isChecked: raw.isChecked === true,
  };
}

export function toListEntries(value: unknown): ListItem[] {
  let list: unknown = value;
  if (typeof value === 'string') {
    try {
      list = JSON.parse(value);
    } catch {
      // A plain (non-JSON) string: one line per entry.
      list = value.split('\n').map((line) => line.trim()).filter(Boolean);
    }
  }
  if (!Array.isArray(list)) return [];
  return list.map(toEntry).filter((entry): entry is ListItem => entry !== null);
}
