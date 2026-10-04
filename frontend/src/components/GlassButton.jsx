import React from 'react';

export default function GlassButton({ children, className = '', ...props }) {
  return (
    <button 
      className={`apple-glass w-12 h-12 flex items-center justify-center text-ink-subtle rounded-full hover:bg-surface dark:hover:bg-ink/20 transition-colors ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
