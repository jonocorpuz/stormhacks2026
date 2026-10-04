import React from 'react';
import { initials } from '../model';
import { useApp } from '../store';

// Profile button face: initials of the saved name, or a person glyph when none is set.
export default function ProfileAvatar() {
  const letters = initials(useApp((s) => s.name));
  if (letters) {
    return <span className="text-ink-subtle font-bold text-lg transition-colors">{letters}</span>;
  }
  return (
    <svg className="w-5 h-5 text-ink-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
