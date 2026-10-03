import React from 'react';

export default function GlassInput({ className = '', ...props }) {
  return (
    <input 
      className={`apple-glass px-6 h-12 rounded-full text-black dark:text-white placeholder-black/50 dark:placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-black/30 dark:focus:ring-white/50 w-64 transition-all ${className}`}
      {...props}
    />
  );
}
