import React from 'react';

export default function GlassButton({ children, className = '', ...props }) {
  return (
    <button 
      className={`apple-glass w-12 h-12 flex items-center justify-center text-gray-400 dark:text-white rounded-full hover:bg-white dark:hover:bg-white/20 transition-colors ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
