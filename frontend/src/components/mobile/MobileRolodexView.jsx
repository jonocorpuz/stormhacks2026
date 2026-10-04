import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { itemMatchesQuery } from '../../model';
import { useActions, useApp } from '../../store';
import ItemCard from '../items/ItemCard';
import { DEFAULT_SIZE, FIXED_SIZES } from '../items/sizes';
import ItemEditor from '../ItemEditor';
import ProfileSettingsMenu from '../ProfileSettingsMenu';
import { DeleteConfirmModal } from '../boards/BoardGrid';

// Desktop bento cell geometry, so each card keeps the exact aspect ratio it has on the grid
// (a 2x1 spans two cells plus the gap). The Figma widgets scale off their width, so a matching
// aspect ratio means nothing clips or leaves dead space.
const CELL = 389;
const GAP = 24;

function cellsFor(item, sizes) {
  return (sizes[item.id] || FIXED_SIZES[item.primitiveId] || DEFAULT_SIZE).split('x').map(Number);
}

function aspectFor(item, sizes) {
  const [w, h] = cellsFor(item, sizes);
  return (w * CELL + (w - 1) * GAP) / (h * CELL + (h - 1) * GAP);
}

// Widgets draw a 28px corner at ~357px per column and scale with width. The opaque backing uses a
// slightly larger radius (and a 1px inset) so it always hides inside the widget's own corners.
function backingRadius(item, sizes, cardW) {
  return (28 * 1.25 * cardW) / (cellsFor(item, sizes)[0] * 357);
}

// Tilt-stack motion (defaults from the "Tilt stack prototype"): the focused card stands upright;
// upcoming cards wait in a pile below, tilted toward you; flipped cards stack above, tilted away.
const FWD_TILT = 58; // deg, waiting pile
const BACK_TILT = 14; // deg, top of flipped pile (+7deg per card deeper)
const BACK_GAP = 26; // px between flipped cards
const PERSPECTIVE = 900;
const STEP = 150; // scroll px per card flip
const FOCUS_Y = 0.36; // focused card centre, fraction of stage height
const FWD_Y = 0.8; // waiting pile centre
const MAX_CARD_W = 330;
const BAR_CLEARANCE = 72; // floating bottom bar height; piles are positioned in the space above it
const MAX_CARD_H = 0.46; // fraction of stage height, so tall cards (1x2) don't swallow the stack

const lerp = (a, b, u) => a + (b - a) * u;
const ease = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);

// Waiting pile, d cards behind the next one.
const fwdState = (d, H) => ({ y: H * FWD_Y + d * 16, rx: -FWD_TILT, s: 1 - d * 0.035, o: d < 4 ? 1 : Math.max(0, 5 - d), dim: Math.min(d * 0.08, 0.3) });
// Flipped pile, k cards below the newest.
const backState = (k, H) => ({ y: H * FOCUS_Y - k * BACK_GAP, rx: BACK_TILT + k * 7, s: 1 - k * 0.07, o: k < 3 ? 1 : Math.max(0, 4 - k), dim: Math.min(k * 0.22, 0.65) });

// Scroll-driven 3D tilt stack of the current board's cards. A sticky stage holds every card;
// scroll progress (1 card per STEP px, snapped) flips cards from the waiting pile into the
// flipped pile. Transforms are written straight to the DOM from a scroll-linked rAF, so
// scrolling never re-renders React.
export default function MobileRolodexView({ query, onQueryChange, editMode, onToggleEditMode, viewMode, onToggleViewMode }) {
  const board = useApp((s) => s.currentBoard);
  const { deleteItem } = useActions();
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const scrollRef = useRef(null);
  const cardRefs = useRef([]);
  const dotRefs = useRef([]);
  const hintRef = useRef(null);

  const sizes = board.view.sizes ?? {};
  const items = board.items.filter((item) => itemMatchesQuery(item, query));
  const editingItem = board.items.find((i) => i.id === editingId);
  const deletingItem = board.items.find((i) => i.id === deletingId);
  const openItem = useCallback((id) => setEditingId(id), []);
  const askDelete = useCallback((id) => setDeletingId(id), []);
  const n = items.length;

  // Card box: widget aspect ratio inside the prototype's card width, height-capped.
  const cardSize = (item) => {
    const aspect = aspectFor(item, sizes);
    const w = Math.max(0, Math.min(MAX_CARD_W, box.w - 40, box.h * MAX_CARD_H * aspect));
    return { w, h: w / aspect };
  };

  // Stage size drives layout (track height, pile positions).
  useLayoutEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const measure = () => setBox({ w: root.clientWidth, h: root.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    return () => ro.disconnect();
  }, []);

  const update = useCallback(() => {
    const root = scrollRef.current;
    if (!root) return;
    const H = root.clientHeight - BAR_CLEARANCE;
    const p = root.scrollTop / STEP;
    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      const t = p - i;
      let st;
      if (t >= 0) st = backState(t, H);
      else if (t <= -1) st = fwdState(-t - 1, H);
      else {
        const u = ease(t + 1);
        const a = fwdState(0, H);
        const b = backState(0, H);
        st = { y: lerp(a.y, b.y, u), rx: lerp(a.rx, b.rx, u), s: lerp(a.s, b.s, u), o: 1, dim: lerp(a.dim, b.dim, u) };
      }
      card.style.transform = `translate3d(-50%, ${st.y.toFixed(2)}px, 0) rotateX(${st.rx.toFixed(2)}deg) scale(${st.s.toFixed(4)})`;
      card.style.opacity = st.o;
      card.style.setProperty('--dim', st.dim.toFixed(3));
      // Waiting pile: later cards over earlier. Flipping card: between piles. Flipped pile: newest on top.
      card.style.zIndex = t <= -1 ? 2000 + Math.round((-t - 1) * 10) : t < 0 ? 1500 : 1000 - Math.round(t * 10);
      card.style.visibility = st.o < 0.02 ? 'hidden' : 'visible';
    });
    const active = Math.max(0, Math.min(cardRefs.current.filter(Boolean).length - 1, Math.round(p)));
    dotRefs.current.forEach((d, i) => d?.classList.toggle('bg-ink', i === active));
    if (hintRef.current) hintRef.current.style.opacity = p > 0.15 ? 0 : 1;
  }, []);

  // Re-apply after every render (new items, resize, edit mode) and on scroll.
  useLayoutEffect(update);
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    let raf = null;
    const onScroll = () => {
      if (raf === null) raf = requestAnimationFrame(() => {
        raf = null;
        update();
      });
    };
    root.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      root.removeEventListener('scroll', onScroll);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [update]);

  // Tap a card to bring it to the top of the flipped stack (controls inside it still work).
  const focusCard = (i) => (e) => {
    if (e.target.closest('button, a, input, textarea, select')) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    scrollRef.current?.scrollTo({ top: i * STEP, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <div className="relative h-full w-full flex flex-col">
      {menuOpen && <div className="absolute inset-0 z-[3000]" onClick={() => setMenuOpen(false)} />}

      {/* Header */}
      <div className="px-6 pt-7 pb-2 shrink-0">
        <p className="text-[13px] text-ink-subtle mb-1">Board</p>
        <h1 className="text-[26px] leading-tight font-bold text-ink tracking-tight truncate">{board.name}</h1>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 min-h-0 relative overflow-y-auto overflow-x-hidden hide-scrollbar overscroll-contain snap-y snap-mandatory"
        aria-label="Board cards. Scroll to flip through."
      >
        <div className="relative" style={{ height: box.h + Math.max(0, n - 1) * STEP }}>
          <div
            className="sticky top-0 overflow-hidden"
            style={{ height: box.h, perspective: `${PERSPECTIVE}px`, perspectiveOrigin: '50% 45%' }}
          >
            {box.h > 0 &&
              items.map((item, i) => {
                const { w, h } = cardSize(item);
                return (
                  <div
                    key={item.id}
                    ref={(el) => (cardRefs.current[i] = el)}
                    onClick={focusCard(i)}
                    className="absolute left-1/2 top-0 cursor-pointer will-change-transform [--dim:0]"
                    style={{ width: w, height: h, marginTop: -h / 2, transformOrigin: '50% 50%' }}
                  >
                    {/* Opaque backing: widgets are translucent glass, so stacked cards would show through. */}
                    <div
                      aria-hidden
                      className="absolute inset-px bg-canvas pointer-events-none"
                      style={{ borderRadius: backingRadius(item, sizes, w) }}
                    />
                    <ItemCard
                      item={item}
                      size={sizes[item.id]}
                      editMode={editMode}
                      isDragging={false}
                      onOpen={openItem}
                      onDelete={askDelete}
                    />
                    {/* Depth dimming: fades deeper cards toward the stage colour. */}
                    <div aria-hidden className="absolute inset-0 bg-canvas pointer-events-none opacity-[var(--dim)]" />
                  </div>
                );
              })}
          </div>
          {/* Snap points, one per card */}
          {items.map((item, i) => (
            <div key={item.id} aria-hidden className="absolute left-0 w-px h-px snap-start" style={{ top: i * STEP }} />
          ))}
        </div>
        {n === 0 && (
          <p className="absolute inset-x-0 top-1/3 text-center text-ink-subtle text-sm px-8">
            {board.items.length === 0 ? 'Nothing here yet.' : `No matches for “${query}”.`}
          </p>
        )}
      </div>

      {/* Progress rail */}
      <div aria-hidden className="absolute right-2.5 top-1/2 -translate-y-1/2 grid gap-1.5 pointer-events-none z-[2500]">
        {items.map((item, i) => (
          <i key={item.id} ref={(el) => (dotRefs.current[i] = el)} className="block w-1 h-3.5 rounded-sm bg-ink/15 transition-colors" />
        ))}
      </div>

      {n > 1 && (
        <div ref={hintRef} className="absolute inset-x-0 bottom-24 text-center text-[13px] text-ink-subtle pointer-events-none transition-opacity duration-300 z-[2500]">
          Scroll to flip through
        </div>
      )}

      {/* Bottom search / nav bar, floating over the last card */}
      <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-canvas to-transparent z-[3001]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleEditMode}
            aria-label="Edit board"
            aria-pressed={editMode}
            className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center backdrop-blur-md transition-colors ${
              editMode ? 'bg-primary text-white' : 'bg-black/70 text-white/80 hover:text-white'
            }`}
          >
            <svg className="w-[1.05rem] h-[1.05rem]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </button>

          <div className="relative flex-1 min-w-0 z-50">
            <svg className="w-4 h-4 absolute z-10 left-4 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 1110.5 3a7.5 7.5 0 016.15 13.65z" /></svg>
            <input
              type="search"
              placeholder="Search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-full bg-black/70 backdrop-blur-md text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Settings"
              className="w-11 h-11 rounded-full flex items-center justify-center bg-black/70 backdrop-blur-md text-white/90 font-bold text-sm"
            >
              AN
            </button>
            <ProfileSettingsMenu isOpen={menuOpen} placement="up" viewMode={viewMode} onToggleViewMode={onToggleViewMode} />
          </div>
        </div>
      </div>

      {editingItem && <ItemEditor key={editingItem.id} item={editingItem} onClose={() => setEditingId(null)} />}
      {deletingItem && (
        <DeleteConfirmModal
          item={deletingItem}
          onCancel={() => setDeletingId(null)}
          onConfirm={() => {
            deleteItem(deletingItem.id);
            setDeletingId(null);
          }}
        />
      )}
    </div>
  );
}
