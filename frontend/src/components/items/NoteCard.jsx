import React from 'react';
import NoteWidget from '../NoteWidget';

const pad = (n) => String(n).padStart(2, '0');

// Footer date matches the design's MM/DD/YYYY; shows when the note was last edited.
function formatDate(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`;
}

export default function NoteCard({ item }) {
  const data = {
    title: typeof item.fields.title === 'string' ? item.fields.title : '',
    body: typeof item.fields.body === 'string' ? item.fields.body : '',
    date: formatDate(item.updatedAt),
  };

  return <NoteWidget data={data} />;
}
