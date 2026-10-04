import React from 'react';
import { useActions, useApp } from '../store';

export default function ProfileSettingsMenu({ isOpen }) {
  const isDarkMode = useApp((s) => s.theme) === 'dark';
  const { toggleTheme } = useActions();
  if (!isOpen) return null;

  return (
    <div className="absolute top-full right-0 mt-4 w-56 p-2 apple-glass rounded-2xl origin-top-right animate-slide-down-fade z-50">
      <ul className="flex flex-col">
        {/* Change Profile Photo */}
        <li className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-ink/5 dark:hover:bg-ink/10 cursor-pointer transition-colors text-sm">
          <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          <span>Change Profile Photo</span>
        </li>
        
        {/* Change Name */}
        <li className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-ink/5 dark:hover:bg-ink/10 cursor-pointer transition-colors text-sm">
          <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
          <span>Change Name</span>
        </li>
        
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
        
        <hr className="border-ink/10 my-1 mx-2" />
        
        {/* Logout */}
        <li className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-danger/10 cursor-pointer transition-colors text-sm text-danger">
          <svg className="w-4 h-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          <span>Logout</span>
        </li>
      </ul>
    </div>
  );
}
