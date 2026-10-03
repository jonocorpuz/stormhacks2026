import React from 'react';

export default function GlassInput({ className = '', ...props }) {
  return (
    <div className="relative flex items-center">
      <svg 
        className="w-[1.125rem] h-[1.125rem] absolute left-4 text-gray-400 dark:text-white/60 pointer-events-none z-10" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 1110.5 3a7.5 7.5 0 016.15 13.65z"></path>
      </svg>
      <input 
        className={`apple-glass pl-[2.6rem] pr-6 h-12 rounded-full text-gray-500 font-medium dark:font-normal dark:text-white placeholder-gray-400/80 dark:placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-white/50 w-64 transition-all ${className}`}
        {...props}
      />
    </div>
  );
}
