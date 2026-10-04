import React, { useEffect, useRef, useState } from 'react';
import NoteWidget from '../NoteWidget';
import { useActions } from '../../store';

const pad = (n) => String(n).padStart(2, '0');
// Typing stays local; the store (and autosave) gets it once the user pauses.
const SAVE_DELAY_MS = 400;

// Footer date matches the design's MM/DD/YYYY; shows when the note was last edited.
function formatDate(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`;
}

const text = (v) => (typeof v === 'string' ? v : '');

export default function NoteCard({ item }) {
  const { updateItem } = useActions();
  const [draft, setDraft] = useState(null);
  const pending = useRef(null);
  const timer = useRef(null);

  const flush = () => {
    clearTimeout(timer.current);
    if (!pending.current) return;
    const patch = pending.current;
    pending.current = null;
    updateItem(item.id, patch).finally(() => setDraft((d) => (pending.current ? d : null)));
  };
  const flushRef = useRef(flush);
  useEffect(() => {
    flushRef.current = flush;
  });
  // Save whatever's left if the card unmounts mid-typing.
  useEffect(() => () => flushRef.current(), []);

  const handleChange = (patch) => {
    pending.current = { ...pending.current, ...patch };
    setDraft((d) => ({ ...d, ...patch }));
    clearTimeout(timer.current);
    timer.current = setTimeout(() => flushRef.current(), SAVE_DELAY_MS);
  };

  const data = {
    title: draft?.title ?? text(item.fields.title),
    body: draft?.body ?? text(item.fields.body),
    date: formatDate(item.updatedAt),
  };

  return <NoteWidget data={data} onChange={handleChange} />;
}
