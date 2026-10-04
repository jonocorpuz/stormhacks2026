import React, { useCallback, useEffect, useRef, useState } from 'react';
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

function aspectFor(item, sizes) {
  const [w, h] = (sizes[item.id] || FIXED_SIZES[item.primitiveId] || DEFAULT_SIZE).split('x').map(Number);
  return (w * CELL + (w - 1) * GAP) / (h * CELL + (h - 1) * GAP);
}

// Rolodex falloff: a card reaches its smallest/faintest at the screen edge (half a screen from centre).
const MIN_SCALE = 0.85;
const MIN_OPACITY = 0.4;
const MAX_TILT_DEG = 18;

// Vertical, snap-scrolling stack of the current board's cards. The centred card is full size;
// neighbours scale down, fade and tilt away like a Rolodex drum. Styles are written straight to
// the DOM from a scroll-linked rAF, so scrolling never re-renders React.
export default function MobileRolodexView({ query, onQueryChange, editMode, onToggleEditMode, viewMode, onToggleViewMode }) {
  const board = useApp((s) => s.currentBoard);
  const { deleteItem } = useActions();
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const scrollRef = useRef(null);

  const sizes = board.view.sizes ?? {};
  const items = board.items.filter((item) => itemMatchesQuery(item, query));
  const editingItem = board.items.find((i) => i.id === editingId);
  const deletingItem = board.items.find((i) => i.id === deletingId);
  const openItem = useCallback((id) => setEditingId(id), []);
  const askDelete = useCallback((id) => setDeletingId(id), []);
  const itemKey = items.map((i) => i.id).join(',');

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    let raf = null;
    const update = () => {
      raf = null;
      const box = root.getBoundingClientRect();
      const mid = box.top + box.height / 2;
      for (const card of root.querySelectorAll('[data-rolodex-card]')) {
        const r = card.parentElement.getBoundingClientRect();
        const d = (r.top + r.height / 2 - mid) / (box.height / 2); // -1 top edge .. 1 bottom edge
        const a = Math.min(Math.abs(d), 1);
        card.style.transform = `perspective(1200px) rotateX(${(-Math.max(-1, Math.min(1, d)) * MAX_TILT_DEG).toFixed(2)}deg) scale(${(1 - (1 - MIN_SCALE) * a).toFixed(4)})`;
        card.style.opacity = (1 - (1 - MIN_OPACITY) * a).toFixed(3);
      }
    };
    const schedule = () => {
      if (raf === null) raf = requestAnimationFrame(update);
    };
    // Start with the first card centred (the spacer above it is half a screen).
    const first = root.querySelector('[data-rolodex-slot]');
    if (first && root.scrollTop === 0) {
      root.scrollTop = first.offsetTop + first.offsetHeight / 2 - root.clientHeight / 2;
    }
    update();
    root.addEventListener('scroll', schedule, { passive: true });
    const ro = new ResizeObserver(schedule);
    ro.observe(root);
    return () => {
      root.removeEventListener('scroll', schedule);
      ro.disconnect();
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [itemKey]);

  return (
    <div className="relative h-full w-full">
      {menuOpen && <div className="absolute inset-0 z-40" onClick={() => setMenuOpen(false)} />}

      {/* Size container (the phone screen): cards are at most 70% of its height and fit at their
          own aspect ratio, so slots hug their card and neighbours peek in above and below. */}
      <div ref={scrollRef} className="h-full overflow-y-auto snap-y snap-mandatory hide-scrollbar overscroll-contain [container-type:size]">
        {/* Spacers let the first and last cards reach the centre snap point. */}
        <div aria-hidden className="h-1/2" />
        {items.map((item) => (
          <div key={item.id} data-rolodex-slot className="w-full flex-shrink-0 snap-center flex items-center justify-center px-4 py-2">
            <div
              data-rolodex-card
              className="will-change-transform"
              style={{
                aspectRatio: aspectFor(item, sizes),
                width: `min(100cqw - 2rem, 70cqh * ${aspectFor(item, sizes)})`,
              }}
            >
                <ItemCard
                  item={item}
                  size={sizes[item.id]}
                  editMode={editMode}
                  isDragging={false}
                  onOpen={openItem}
                  onDelete={askDelete}
                />
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="h-[20%] flex items-center justify-center text-center text-ink-subtle text-sm px-8">
            {board.items.length === 0 ? 'Nothing here yet.' : `No matches for “${query}”.`}
          </p>
        )}
        <div aria-hidden className="h-1/2" />
      </div>

      {/* Bottom search / nav bar, floating over the last card */}
      <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-canvas to-transparent z-50">
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
