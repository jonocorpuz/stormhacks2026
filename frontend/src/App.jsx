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
import MobileRolodexView from './components/mobile/MobileRolodexView';
import SaveStatus from './components/SaveStatus';
import ExtractionStatus from './components/ExtractionStatus';
import DropOverlay from './components/DropOverlay';

// File → base64 (no data-URL prefix).
const readBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const THEME_KEY = 'theme';

// Saved choice wins; otherwise follow the OS setting. index.html applies the same rule before
// React loads so the page doesn't flash the wrong theme.
function getInitialDarkMode() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved === 'dark';
  } catch {
    // Storage blocked: fall through to the system setting.
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

// Nav pops in after the cards, rippling outward from the search bar (order = distance from it).
const navPop = (order) => ({ animationDelay: `${500 + order * 110}ms` });

export default function App() {
  const currentBoard = useApp((s) => s.currentBoard);
  const { ingestCaptures } = useActions();
  const [openMenu, setOpenMenu] = useState(null); // 'create' | 'profile' | 'boards' | null
  const [editMode, setEditMode] = useState(false);
  const [query, setQuery] = useState('');
  // 'desktop' = bento grid; 'mobile' = Rolodex inside a phone simulator.
  const [viewMode, setViewMode] = useState('desktop');
  const isMobile = viewMode === 'mobile';
  const toggleViewMode = () => {
    setOpenMenu(null);
    setViewMode((mode) => (mode === 'desktop' ? 'mobile' : 'desktop'));
  };

  const [isDragging, setIsDragging] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
      className={`h-screen w-full overflow-y-auto overflow-x-hidden bg-canvas dot-grid font-sans relative overscroll-none transition-colors duration-500`}
      onDragOver={(e) => {
        // Only OS file drags, not text/link drags from inside the page.
        if (!e.dataTransfer.types.includes('Files')) return;
        e.preventDefault();
        setIsDragging(true);
        // Glow follows the cursor; set directly to skip a re-render per dragover.
        e.currentTarget.style.setProperty('--drop-x', `${e.clientX}px`);
        e.currentTarget.style.setProperty('--drop-y', `${e.clientY}px`);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setIsDragging(false);
      }}
      onDrop={handleDrop}
      onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 0)}
    >
      <DropOverlay active={isDragging} />

      {isMobile ? (
        // Phone simulator. translateZ makes it the containing block for fixed-position modals
        // (editor, delete confirm), so they stay inside the "screen" instead of covering the monitor.
        <div className="min-h-full flex items-center justify-center py-8 px-4">
          <div className="w-full max-w-[400px] h-[min(850px,calc(100vh-4rem))] mx-auto relative overflow-hidden rounded-[3rem] border-8 border-black shadow-2xl bg-canvas dot-grid [transform:translateZ(0)]">
            {currentBoard ? (
              <MobileRolodexView
                query={query}
                onQueryChange={setQuery}
                editMode={editMode}
                onToggleEditMode={() => setEditMode((on) => !on)}
                viewMode={viewMode}
                onToggleViewMode={toggleViewMode}
              />
            ) : (
              <BoardGate />
            )}
          </div>
        </div>
      ) : (
      <>
      {/* Click-Outside Overlay */}
      {openMenu && <div className="fixed inset-0 z-40 bg-transparent" onClick={closeMenu} />}

      {/* Fog behind the header once content scrolls under it */}
      <div aria-hidden className={`nav-fog fixed inset-x-0 top-0 h-44 z-40 pointer-events-none ${scrolled ? 'is-on' : ''}`}>
        {Array.from({ length: 6 }, (_, i) => <div key={i} />)}
      </div>

      {/* Floating Header */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 flex items-center justify-center gap-3 z-50 pointer-events-auto">

        {currentBoard && (
          <>
            <div className="pop-in" style={navPop(3)}>
              <BoardMenu
                isOpen={openMenu === 'boards'}
                onToggle={() => toggleMenu('boards')}
                onClose={closeMenu}
              />
            </div>

            {/* Add Button & Dropdown Container */}
            <div className="relative pop-in" style={navPop(2)}>
              <GlassButton onClick={() => toggleMenu('create')} aria-label="New" className="nav-grow">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path></svg>
              </GlassButton>
              <CreateItemMenu isOpen={openMenu === 'create'} onClose={closeMenu} />
            </div>

            {/* Edit Mode Toggle */}
            <div className="pop-in" style={navPop(1)}>
              <GlassButton
                onClick={() => setEditMode((on) => !on)}
                aria-label="Edit board"
                aria-pressed={editMode}
                className={`nav-grow ${editMode ? '!bg-blue-500 !text-white' : ''}`}
              >
                <svg className="w-[1.15rem] h-[1.15rem]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
              </GlassButton>
            </div>

            {/* Search Bar */}
            <div className="pop-in buoyant hover:scale-[1.03]" style={navPop(0)}>
              <GlassInput placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          </>
        )}

        {/* Avatar & Settings Menu Container */}
        <div className="relative pop-in" style={navPop(1)}>
          <div
            onClick={() => toggleMenu('profile')}
            className="nav-grow apple-glass w-12 h-12 rounded-full flex items-center justify-center cursor-pointer hover:bg-white dark:hover:bg-white/20 transition-colors"
          >
            <span className="text-ink-subtle font-bold text-lg transition-colors">AN</span>
          </div>
          <ProfileSettingsMenu isOpen={openMenu === 'profile'} viewMode={viewMode} onToggleViewMode={toggleViewMode} />
        </div>
      </div>

      {currentBoard ? (
        <div className="relative">
          <BoardGrid query={query} editMode={editMode} />
        </div>
      ) : (
        <BoardGate />
      )}
      </>
      )}

      <SaveStatus />
      <ExtractionStatus />
    </div>
  );
}
