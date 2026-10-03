import React from 'react';
import GlassButton from './components/GlassButton';
import GlassInput from './components/GlassInput';

export default function App() {
  return (
    <div className="min-h-screen bg-black relative p-6 font-sans overflow-hidden flex flex-col items-center justify-center">
      
      {/* Floating Header */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center justify-center gap-3 z-50 pointer-events-auto">
        
        {/* Add Button */}
        <GlassButton>
          <span className="text-2xl leading-none font-light">+</span>
        </GlassButton>

        {/* Edit Button */}
        <GlassButton>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
        </GlassButton>

        {/* Search Bar */}
        <GlassInput placeholder="Search..." />

        {/* Avatar */}
        <div className="apple-glass w-12 h-12 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors">
          <span className="text-white font-bold text-lg">U</span>
        </div>

      </div>

      {/* Simple Blank Bento Grid */}
      <div className="w-full max-w-6xl mt-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 auto-rows-[280px]">
          {/* Card 1 */}
          <div className="md:col-span-1 md:row-span-2 bg-zinc-900 rounded-[2rem]"></div>

          {/* Card 2 */}
          <div className="md:col-span-2 md:row-span-1 bg-zinc-900 rounded-[2rem]"></div>

          {/* Card 5 */}
          <div className="md:col-span-1 md:row-span-2 bg-zinc-900 rounded-[2rem]"></div>

          {/* Card 3 */}
          <div className="md:col-span-1 md:row-span-1 bg-zinc-900 rounded-[2rem]"></div>

          {/* Card 4 */}
          <div className="md:col-span-1 md:row-span-1 bg-zinc-900 rounded-[2rem]"></div>
        </div>
      </div>
    </div>
  );
}
