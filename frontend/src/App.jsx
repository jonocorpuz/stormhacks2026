import React, { useState, useEffect, useRef } from 'react';
import GlassButton from './components/GlassButton';
import GlassInput from './components/GlassInput';
import WidgetCreationMenu from './components/WidgetCreationMenu';
import ProfileSettingsMenu from './components/ProfileSettingsMenu';
import RecommendationListWidget from './components/RecommendationListWidget';

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [selectedWidgetType, setSelectedWidgetType] = useState('Text Note');
  const [isDarkMode, setIsDarkMode] = useState(true);

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
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Use a ref and state to strictly enforce mathematically perfect grid rows
  const gridRef = useRef(null);
  const [rowHeight, setRowHeight] = useState('200px');

  useEffect(() => {
    if (!gridRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        // The grid has 3 columns and 2 gaps of 24px (1.5rem)
        // We want 1 row height = 1 column width exactly.
        const width = entry.contentRect.width;
        // Subtract 48px for the two gaps, then divide by 3
        const calculatedHeight = (width - 48) / 3;
        setRowHeight(`${calculatedHeight}px`);
      }
    });
    observer.observe(gridRef.current);
    return () => observer.disconnect();
  }, []);

  const handleCloseMenu = () => {
    setIsMenuOpen(false);
    setIsProfileMenuOpen(false);
    setSelectedWidgetType('Text Note');
  };

  return (
    <div className="h-screen w-full overflow-y-auto overflow-x-hidden bg-[#fafafa] dark:bg-black font-sans relative overscroll-none transition-colors duration-500">
      
      {/* Click-Outside Overlay */}
      {(isMenuOpen || isProfileMenuOpen) && (
        <div 
          className="fixed inset-0 z-40 bg-transparent"
          onClick={handleCloseMenu}
        />
      )}

      {/* Floating Header */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 flex items-center justify-center gap-3 z-50 pointer-events-auto">
        
        {/* Add Button & Dropdown Container */}
        <div className="relative">
          <GlassButton onClick={() => {
            setIsProfileMenuOpen(false);
            setIsMenuOpen(!isMenuOpen);
          }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path></svg>
          </GlassButton>
          <WidgetCreationMenu 
            isOpen={isMenuOpen}
            selectedType={selectedWidgetType}
            onSelectType={setSelectedWidgetType}
            onCreate={() => {
              console.log('Created widget:', selectedWidgetType);
              handleCloseMenu();
            }}
          />
        </div>

        {/* Edit Button */}
        <GlassButton>
          <svg className="w-[1.15rem] h-[1.15rem]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
        </GlassButton>

        {/* Search Bar */}
        <GlassInput placeholder="Looking for something..?" />

        {/* Avatar & Settings Menu Container */}
        <div className="relative">
          <div 
            onClick={() => {
              setIsMenuOpen(false);
              setIsProfileMenuOpen(!isProfileMenuOpen);
            }}
            className="apple-glass w-12 h-12 rounded-full flex items-center justify-center cursor-pointer hover:bg-white dark:hover:bg-white/20 transition-colors"
          >
            <span className="text-gray-400 dark:text-white font-bold text-lg transition-colors">AN</span>
          </div>
          <ProfileSettingsMenu 
            isOpen={isProfileMenuOpen} 
            isDarkMode={isDarkMode} 
            onToggleTheme={() => setIsDarkMode(prev => !prev)} 
          />
        </div>

      </div>

      {/* Dashboard Bento Grid Container */}
      <div className="w-full max-w-7xl mx-auto pt-32 pb-10 px-8">
        <div
          ref={gridRef}
          className={`grid grid-cols-1 md:grid-cols-3 gap-6 grid-flow-dense rounded-[2rem] transition-shadow ${isDragging ? 'ring-4 ring-blue-400/60' : ''}`}
          style={{ gridAutoRows: rowHeight }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) setIsDragging(false);
          }}
          onDrop={handleDrop}
        >

          {/* Extracted screenshot results (raw JSON) */}
          {extractions.map(({ id, status, result }) => (
            <div key={id} className="apple-glass md:col-span-2 md:row-span-2 rounded-[2rem] p-6 flex flex-col shadow-2xl overflow-hidden">
              <span className="text-black/50 dark:text-white/50 font-semibold text-sm mb-3">
                {status === 'pending' ? 'Parsing screenshot…' : result.ok ? result.data.type : 'Extraction failed'}
              </span>
              {status === 'done' && (
                <pre className="flex-1 overflow-auto text-xs text-black/80 dark:text-white/80 whitespace-pre-wrap break-words">
                  {JSON.stringify(result, null, 2)}
                </pre>
              )}
            </div>
          ))}

          {/* Placeholder: 2x2 Large Square */}
          <div className="apple-glass md:col-span-2 md:row-span-2 rounded-[2rem] flex flex-col items-center justify-center text-black/50 dark:text-white/50 font-semibold shadow-2xl transition-transform hover:scale-[1.02] cursor-default">
            <span className="text-2xl">2x2 Widget</span>
            <span className="text-xs font-normal opacity-70 mt-2">col-span-2 | row-span-2</span>
          </div>
          
          {/* Recommendation List Widget */}
          <div className="md:col-span-1 md:row-span-1 h-full w-full">
            <RecommendationListWidget />
          </div>
          
          {/* Placeholder: 1x2 Tall Rectangle */}
          <div className="apple-glass md:col-span-1 md:row-span-2 rounded-[2rem] flex flex-col items-center justify-center text-black/50 dark:text-white/50 font-semibold shadow-2xl transition-transform hover:scale-[1.02] cursor-default">
            <span className="text-2xl">1x2 Widget</span>
            <span className="text-xs font-normal opacity-70 mt-2">col-span-1 | row-span-2</span>
          </div>

          {/* Placeholder: 2x1 Wide Rectangle */}
          <div className="apple-glass md:col-span-2 md:row-span-1 rounded-[2rem] flex flex-col items-center justify-center text-black/50 dark:text-white/50 font-semibold shadow-2xl transition-transform hover:scale-[1.02] cursor-default">
            <span className="text-2xl">2x1 Widget</span>
            <span className="text-xs font-normal opacity-70 mt-2">col-span-2 | row-span-1</span>
          </div>

          {/* Placeholder: 3x1 Wide Banner */}
          <div className="apple-glass md:col-span-3 md:row-span-1 rounded-[2rem] flex flex-col items-center justify-center text-black/50 dark:text-white/50 font-semibold shadow-2xl transition-transform hover:scale-[1.02] cursor-default">
            <span className="text-2xl">3x1 Widget</span>
            <span className="text-xs font-normal opacity-70 mt-2">col-span-3 | row-span-1</span>
          </div>

        </div>
      </div>
    </div>
  );
}
