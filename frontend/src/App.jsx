import React, { useState } from 'react';
import { createCapture } from './model';
import { useActions, useApp } from './store';
import GlassButton from './components/GlassButton';
import GlassInput from './components/GlassInput';
import CreateItemMenu from './components/CreateItemMenu';
import ProfileSettingsMenu from './components/ProfileSettingsMenu';

import BoardMenu from './components/boards/BoardMenu';
import BoardGate from './components/boards/BoardGate';
import BoardGrid from './components/boards/BoardGrid';
import SaveStatus from './components/SaveStatus';
import ExtractionStatus from './components/ExtractionStatus';

// File → base64 (no data-URL prefix).
const readBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export default function App() {
  const currentBoard = useApp((s) => s.currentBoard);
  const { ingestCaptures } = useActions();
  const [openMenu, setOpenMenu] = useState(null); // 'create' | 'profile' | 'boards' | null
  const [editMode, setEditMode] = useState(false);
  const [query, setQuery] = useState('');

  const [isDragging, setIsDragging] = useState(false);

  // Dropped files → captures → store extracts onto current board (unsupported types flagged there).
  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = [...e.dataTransfer.files];
    if (!files.length) return;
    const captures = await Promise.all(
      files.map(async (f) => createCapture('image', f.type, await readBase64(f), f.name)),
    );
    ingestCaptures(captures);
  };

  const toggleMenu = (name) => setOpenMenu((open) => (open === name ? null : name));
  const closeMenu = () => setOpenMenu(null);

  return (
    <div 
      className={`h-screen w-full overflow-y-auto overflow-x-hidden bg-[#fafafa] dark:bg-black font-sans relative overscroll-none transition-colors duration-500`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setIsDragging(false);
      }}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {isDragging && <div className="absolute inset-0 z-50 ring-4 ring-blue-400/60 pointer-events-none" />}

      {/* Click-Outside Overlay */}
      {openMenu && <div className="fixed inset-0 z-40 bg-transparent" onClick={closeMenu} />}

      {/* Floating Header */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 flex items-center justify-center gap-3 z-50 pointer-events-auto">

        {currentBoard && (
          <>
            <BoardMenu
              isOpen={openMenu === 'boards'}
              onToggle={() => toggleMenu('boards')}
              onClose={closeMenu}
            />

            {/* Add Button & Dropdown Container */}
            <div className="relative">
              <GlassButton onClick={() => toggleMenu('create')} aria-label="New">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path></svg>
              </GlassButton>
              <CreateItemMenu isOpen={openMenu === 'create'} onClose={closeMenu} />
            </div>

            {/* Edit Mode Toggle */}
            <GlassButton
              onClick={() => setEditMode((on) => !on)}
              aria-label="Edit board"
              aria-pressed={editMode}
              className={editMode ? '!bg-blue-500 !text-white' : ''}
            >
              <svg className="w-[1.15rem] h-[1.15rem]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
            </GlassButton>

            {/* Search Bar */}
            <GlassInput placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
          </>
        )}

        {/* Avatar & Settings Menu Container */}
        <div className="relative">
          <div
            onClick={() => toggleMenu('profile')}
            className="apple-glass w-12 h-12 rounded-full flex items-center justify-center cursor-pointer hover:bg-white dark:hover:bg-white/20 transition-colors"
          >
            <span className="text-gray-400 dark:text-white font-bold text-lg transition-colors">AN</span>
          </div>
          <ProfileSettingsMenu isOpen={openMenu === 'profile'} />
        </div>
      </div>

      {currentBoard ? (
        <div className="relative">
          <BoardGrid query={query} editMode={editMode} />
          

        </div>
      ) : (
        <BoardGate />
      )}

      <SaveStatus />
      <ExtractionStatus />
    </div>
  );
}
