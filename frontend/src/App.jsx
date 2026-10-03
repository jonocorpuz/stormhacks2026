import React, { useState } from 'react';
import GlassButton from './components/GlassButton';
import GlassInput from './components/GlassInput';
import WidgetCreationMenu from './components/WidgetCreationMenu';
import ProfileSettingsMenu from './components/ProfileSettingsMenu';

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [selectedWidgetType, setSelectedWidgetType] = useState('Text Note');

  const handleCloseMenu = () => {
    setIsMenuOpen(false);
    setIsProfileMenuOpen(false);
    setSelectedWidgetType('Text Note');
  };

  return (
    <div className="h-screen w-full overflow-y-auto overflow-x-hidden bg-black font-sans relative">
      
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
            <span className="text-2xl leading-none font-light">+</span>
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
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
        </GlassButton>

        {/* Search Bar */}
        <GlassInput placeholder="Search..." />

        {/* Avatar & Settings Menu Container */}
        <div className="relative">
          <div 
            onClick={() => {
              setIsMenuOpen(false);
              setIsProfileMenuOpen(!isProfileMenuOpen);
            }}
            className="apple-glass w-12 h-12 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors"
          >
            <span className="text-white font-bold text-lg">U</span>
          </div>
          <ProfileSettingsMenu isOpen={isProfileMenuOpen} />
        </div>

      </div>

      {/* Dashboard Bento Grid Container */}
      <div className="w-full max-w-7xl mx-auto pt-32 pb-10 px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 grid-flow-dense">
          
          {/* Placeholder 1: 2-Wide */}
          <div className="apple-glass col-span-1 md:col-span-2 min-h-[300px] rounded-[2rem] flex flex-col items-center justify-center text-white/50 font-semibold shadow-2xl transition-transform hover:scale-[1.02] cursor-default">
            <span className="text-2xl">2-Wide Widget</span>
            <span className="text-xs font-normal opacity-70 mt-2">col-span-2 | min-h-[300px]</span>
          </div>
          
          {/* Placeholder 2: 1-Wide */}
          <div className="apple-glass col-span-1 min-h-[200px] rounded-[2rem] flex flex-col items-center justify-center text-white/50 font-semibold shadow-2xl transition-transform hover:scale-[1.02] cursor-default">
            <span className="text-2xl">1-Wide Widget</span>
            <span className="text-xs font-normal opacity-70 mt-2">col-span-1 | min-h-[200px]</span>
          </div>
          
          {/* Placeholder 3: 1-Wide (Taller) */}
          <div className="apple-glass col-span-1 min-h-[250px] rounded-[2rem] flex flex-col items-center justify-center text-white/50 font-semibold shadow-2xl transition-transform hover:scale-[1.02] cursor-default">
            <span className="text-2xl">1-Wide Widget</span>
            <span className="text-xs font-normal opacity-70 mt-2">col-span-1 | min-h-[250px]</span>
          </div>
          
          {/* Placeholder 4: 3-Wide */}
          <div className="apple-glass col-span-1 md:col-span-3 min-h-[150px] rounded-[2rem] flex flex-col items-center justify-center text-white/50 font-semibold shadow-2xl transition-transform hover:scale-[1.02] cursor-default">
            <span className="text-2xl">3-Wide Widget</span>
            <span className="text-xs font-normal opacity-70 mt-2">col-span-3 | min-h-[150px]</span>
          </div>
          
          {/* Placeholder 5: 1-Wide */}
          <div className="apple-glass col-span-1 min-h-[200px] rounded-[2rem] flex flex-col items-center justify-center text-white/50 font-semibold shadow-2xl transition-transform hover:scale-[1.02] cursor-default">
            <span className="text-2xl">1-Wide Widget</span>
            <span className="text-xs font-normal opacity-70 mt-2">col-span-1 | min-h-[200px]</span>
          </div>
          
          {/* Placeholder 6: 1-Wide (Tallest) */}
          <div className="apple-glass col-span-1 min-h-[350px] rounded-[2rem] flex flex-col items-center justify-center text-white/50 font-semibold shadow-2xl transition-transform hover:scale-[1.02] cursor-default">
            <span className="text-2xl">1-Wide Widget</span>
            <span className="text-xs font-normal opacity-70 mt-2">col-span-1 | min-h-[350px]</span>
          </div>
          
          {/* Placeholder 7: 1-Wide */}
          <div className="apple-glass col-span-1 min-h-[200px] rounded-[2rem] flex flex-col items-center justify-center text-white/50 font-semibold shadow-2xl transition-transform hover:scale-[1.02] cursor-default">
            <span className="text-2xl">1-Wide Widget</span>
            <span className="text-xs font-normal opacity-70 mt-2">col-span-1 | min-h-[200px]</span>
          </div>

        </div>
      </div>
    </div>
  );
}
