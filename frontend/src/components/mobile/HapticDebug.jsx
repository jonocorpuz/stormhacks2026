import React, { useEffect, useRef, useState } from 'react';
import { hapticDebug, hapticLog, hapticTick } from './haptics';

// DEBUG (temporary): on-screen test panel for finding which touch contexts iOS lets the switch haptic
// fire from. Remove before merge.
const MODES = [
  ['normal', 'Normal'],
  ['touchstart', 'Stage touchstart'],
  ['touchend', 'Stage touchend'],
];

const BURST_EVERY_MS = 250;
const BURST_COUNT = 12; // 3s of ticks: count the buzzes to measure how long iOS keeps the activation window open

export default function HapticDebug() {
  const [, setFrame] = useState(0);
  const padRef = useRef(null);
  const burstTimers = useRef([]);
  // Drag pad: touch-action none + cancelled touchmoves, so iOS can never pan it. On release, tick every
  // 250ms for 3s. Tells us (a) whether a non-panned drag's touchend opens the window, (b) how long it lasts.
  useEffect(() => {
    const pad = padRef.current;
    if (!pad) return;
    let sx = 0;
    let sy = 0;
    const onStart = (e) => {
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
      burstTimers.current.forEach(clearTimeout);
    };
    const onMove = (e) => e.cancelable && e.preventDefault();
    const onEnd = (e) => {
      const t = e.changedTouches[0];
      const d = Math.round(Math.hypot(t.clientX - sx, t.clientY - sy));
      hapticLog(`pad release, moved ${d}px`);
      burstTimers.current = Array.from({ length: BURST_COUNT }, (_, i) =>
        setTimeout(() => hapticTick(`burst ${i + 1}/${BURST_COUNT} @${i * BURST_EVERY_MS}ms`), i * BURST_EVERY_MS),
      );
    };
    pad.addEventListener('touchstart', onStart, { passive: true });
    pad.addEventListener('touchmove', onMove, { passive: false });
    pad.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      pad.removeEventListener('touchstart', onStart);
      pad.removeEventListener('touchmove', onMove);
      pad.removeEventListener('touchend', onEnd);
      burstTimers.current.forEach(clearTimeout);
    };
  }, []);
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
      <div ref={padRef} className="mt-2 h-16 rounded-xl bg-black/30 touch-none select-none flex items-center justify-center text-center">
        DRAG PAD: tap it, then drag it. Count the buzzes each time
      </div>
      <div className="mt-2 font-mono text-[10px] leading-tight break-all">
        {hapticDebug.log.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
}
