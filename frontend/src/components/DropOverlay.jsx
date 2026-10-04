import React from 'react';

// Full-screen drop target shown while files hover the window. Always mounted so it can animate
// out as well as in. Cursor-following glow reads --drop-x/--drop-y, set by App on dragover.
export default function DropOverlay({ active }) {
  return (
    <div aria-hidden className={`drop-overlay fixed inset-0 z-[60] pointer-events-none ${active ? 'is-on' : ''}`}>
      <div className="drop-overlay-glow absolute inset-0" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="drop-overlay-card apple-glass rounded-3xl px-10 py-8 flex flex-col items-center gap-4">
          <div className="drop-overlay-icon w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0l-4.5 4.5M12 4l4.5 4.5M4 16v2.5A1.5 1.5 0 005.5 20h13a1.5 1.5 0 001.5-1.5V16" />
            </svg>
          </div>
          <div className="text-center">
            <div className="text-ink font-semibold text-lg">Drop to add</div>
            <div className="text-ink-muted text-sm">Files go onto this board</div>
          </div>
        </div>
      </div>
    </div>
  );
}
