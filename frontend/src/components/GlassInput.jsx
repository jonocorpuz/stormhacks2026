import React from 'react';

export default function GlassInput({ className = '', ...props }) {
  return (
    <input 
      className={`apple-glass px-6 h-12 rounded-full text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 w-64 ${className}`}
      {...props}
    />
  );
}
