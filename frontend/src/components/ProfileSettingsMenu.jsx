import React, { useState } from 'react';
import { useActions, useApp } from '../store';
import demoBoard from '../fixtures/demoBoard.json';

export default function ProfileSettingsMenu({ isOpen, viewMode = 'desktop', onToggleViewMode }) {
  const isDarkMode = useApp((s) => s.theme) === 'dark';
  const name = useApp((s) => s.name);
  const { toggleTheme, setName, importBoard } = useActions();
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');
  if (!isOpen) {
    if (editingName) setEditingName(false); // reopening starts from the menu, not a stale field
    return null;
  }

  const saveName = (e) => {
    e.preventDefault();
    setName(draftName);
    setEditingName(false);
  };

  return (
    <div className="absolute top-full right-0 mt-4 w-56 p-2 apple-glass rounded-2xl origin-top-right animate-slide-down-fade z-50">
      <ul className="flex flex-col">
        {/* Change Name: inline field; the avatar shows its initials */}
        {editingName ? (
          <li className="px-2 py-1.5">
            <form onSubmit={saveName} className="flex items-center gap-2">
              <input
                autoFocus
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && setEditingName(false)}
                placeholder="Your name"
                aria-label="Name"
                className="flex-1 min-w-0 px-3 py-1.5 rounded-lg bg-ink/5 dark:bg-ink/10 text-sm text-ink outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button type="submit" className="px-3 py-1.5 rounded-lg bg-primary/90 text-white text-xs font-semibold hover:bg-primary-strong/90 transition-colors">
                Save
              </button>
            </form>
          </li>
        ) : (
          <li
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-ink/5 dark:hover:bg-ink/10 cursor-pointer transition-colors text-sm"
            onClick={(e) => {
              e.stopPropagation();
              setDraftName(name ?? '');
              setEditingName(true);
            }}
          >
            <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            <span>{name ? 'Change Name' : 'Set Name'}</span>
          </li>
        )}

        {/* Theme Toggle */}
        <li 
          className="flex items-center justify-between px-4 py-2.5 rounded-xl hover:bg-ink/5 dark:hover:bg-ink/10 cursor-pointer transition-colors text-sm"
          onClick={(e) => {
            e.stopPropagation();
            toggleTheme();
          }}
        >
          <div className="flex items-center gap-3">
            {isDarkMode ? (
              <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
            ) : (
              <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            )}
            <span>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
          </div>
          {/* Toggle Switch */}
          <div className={`w-8 h-4 rounded-full relative transition-colors ${isDarkMode ? 'bg-primary' : 'bg-ink-subtle'}`}>
            <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${isDarkMode ? 'translate-x-4 left-0.5' : 'translate-x-0 left-0.5'}`}></div>
          </div>
        </li>
        
        {/* Force Mobile Mode: desktop grid vs. phone simulator. Real phones get mobile automatically (App.jsx). */}
        {onToggleViewMode && (
          <li
            className="flex items-center justify-between px-4 py-2.5 rounded-xl hover:bg-ink/5 dark:hover:bg-ink/10 cursor-pointer transition-colors text-sm"
            onClick={(e) => {
              e.stopPropagation();
              onToggleViewMode();
            }}
          >
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="7" y="2" width="10" height="20" rx="2" strokeWidth="2" /><path strokeLinecap="round" strokeWidth="2" d="M11 18h2" /></svg>
              <span>Force Mobile Mode</span>
            </div>
            <div className={`w-8 h-4 rounded-full relative transition-colors ${viewMode === 'mobile' ? 'bg-primary' : 'bg-ink-subtle'}`}>
              <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform ${viewMode === 'mobile' ? 'translate-x-4' : 'translate-x-0'}`}></div>
            </div>
          </li>
        )}

        {/* Load Data: adds a pre-set demo board (fixtures/demoBoard.json) and opens it */}
        <li
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-ink/5 dark:hover:bg-ink/10 cursor-pointer transition-colors text-sm"
          onClick={(e) => {
            e.stopPropagation();
            importBoard(demoBoard).catch(() => {}); // throws while extracting; save failure shown by SaveStatus
          }}
        >
          <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          <span>Load Data</span>
        </li>

        <hr className="border-line dark:border-ink/10 my-1 mx-2" />
        
        {/* Logout: no accounts yet, so it clears the local profile (name → default avatar) */}
        <li
          onClick={(e) => {
            e.stopPropagation();
            setName(null);
          }}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-danger/10 cursor-pointer transition-colors text-sm text-danger">
          <svg className="w-4 h-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          <span>Logout</span>
        </li>
      </ul>
    </div>
  );
}
