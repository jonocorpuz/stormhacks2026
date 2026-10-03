import React, { useState, useEffect } from 'react';
import { useApp } from './store';
import GlassButton from './components/GlassButton';
import GlassInput from './components/GlassInput';
import CreateItemMenu from './components/CreateItemMenu';
import ProfileSettingsMenu from './components/ProfileSettingsMenu';

import BoardMenu from './components/boards/BoardMenu';
import BoardGate from './components/boards/BoardGate';
import BoardGrid from './components/boards/BoardGrid';
import SaveStatus from './components/SaveStatus';

export default function App() {
  const currentBoard = useApp((s) => s.currentBoard);
  const [openMenu, setOpenMenu] = useState(null); // 'create' | 'profile' | 'boards' | null
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [query, setQuery] = useState('');

  // Screenshot drops: each entry is { id, status: 'pending' | 'done', result }
  const [extractions, setExtractions] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = [...e.dataTransfer.files].find(f => f.type.startsWith('image/'));
    if (!file) return;

    const id = crypto.randomUUID();
    setExtractions(prev => [{ id, status: 'pending' }, ...prev]);

    const reader = new FileReader();
    reader.onload = async () => {
      // Strip the "data:image/png;base64," prefix
      const image = reader.result.split(',')[1];
      let result;
      try {
        const res = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image, mimeType: file.type }),
        });
        result = await res.json();
      } catch (err) {
        result = { ok: false, error: err.message };
      }
      setExtractions(prev => prev.map(x => (x.id === id ? { id, status: 'done', result } : x)));
    };
    reader.readAsDataURL(file);
  };

  // Apply dark mode globally to the html document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

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
          <ProfileSettingsMenu
            isOpen={openMenu === 'profile'}
            isDarkMode={isDarkMode}
            onToggleTheme={() => setIsDarkMode((prev) => !prev)}
          />
        </div>
      </div>

      {currentBoard ? (
        <div className="relative">
          {/* Temporary display of extractions as overlay while BoardGrid is refactored */}
          {extractions.length > 0 && (
            <div className="fixed top-32 right-8 w-96 z-[60] flex flex-col gap-4 max-h-[calc(100vh-10rem)] overflow-y-auto">
               {extractions.map(({ id, status, result }) => (
                <div key={id} className="apple-glass rounded-[2rem] p-6 flex flex-col shadow-2xl overflow-hidden bg-white/80 dark:bg-black/80 backdrop-blur-xl shrink-0">
                  <span className="text-black/50 dark:text-white/50 font-semibold text-sm mb-3">
                    {status === 'pending' ? 'Parsing screenshot…' : result.ok ? result.data?.type || 'Extracted' : 'Extraction failed'}
                  </span>
                  {status === 'done' && (
                    <pre className="flex-1 overflow-auto text-xs text-black/80 dark:text-white/80 whitespace-pre-wrap break-words max-h-60">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}

          <BoardGrid query={query} editMode={editMode} />
          

        </div>
      ) : (
        <BoardGate />
      )}

      <SaveStatus />
    </div>
  );
}
