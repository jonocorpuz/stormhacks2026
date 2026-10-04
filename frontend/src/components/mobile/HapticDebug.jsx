import React, { useEffect, useState } from 'react';
import { hapticDebug, hapticTick } from './haptics';

// DEBUG (temporary): on-screen test panel for finding which touch contexts iOS lets the switch haptic
// fire from. Remove before merge.
const MODES = [
  ['normal', 'Normal'],
  ['touchstart', 'Stage touchstart'],
  ['touchend', 'Stage touchend'],
];

export default function HapticDebug() {
  const [, setFrame] = useState(0);
  const [mode, setMode] = useState(hapticDebug.mode);
  useEffect(() => {
    const id = setInterval(() => setFrame((f) => f + 1), 250);
    return () => clearInterval(id);
  }, []);
  const pick = (m) => {
    hapticDebug.mode = m;
    setMode(m);
  };
  const btn = 'px-2.5 py-1 rounded-full font-bold';

  return (
    <div className="absolute left-3 right-3 bottom-3 z-[9999] rounded-2xl bg-danger text-white p-3 text-xs font-semibold shadow-lg">
      <div className="flex items-center justify-between">
        <span>HAPTICS DEBUG</span>
        <span className="font-mono">fired {hapticDebug.fired} · {hapticDebug.method}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {MODES.map(([m, label]) => (
          <button key={m} type="button" onClick={() => pick(m)} className={`${btn} ${mode === m ? 'bg-white text-danger' : 'bg-black/30'}`}>
            {label}
          </button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <button type="button" onClick={() => hapticTick('button click')} className={`${btn} bg-white text-danger`}>
          1 Click
        </button>
        <button
          type="button"
          onTouchEnd={(e) => {
            e.preventDefault(); // no follow-up click, so only touchend is tested
            hapticTick('button touchend');
          }}
          className={`${btn} bg-white text-danger`}
        >
          2 Touchend
        </button>
        <button
          type="button"
          onClick={() => setTimeout(() => hapticTick('300ms after click'), 300)}
          className={`${btn} bg-white text-danger`}
        >
          3 Delayed
        </button>
      </div>
      <div className="mt-2 font-mono text-[10px] leading-tight break-all">
        {hapticDebug.log.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
}
