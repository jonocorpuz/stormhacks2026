import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { itemMatchesQuery } from '../../model';
import { useActions, useApp } from '../../store';
import ItemCard from '../items/ItemCard';
import { DEFAULT_SIZE, FIXED_SIZES } from '../items/sizes';
import ItemEditor from '../ItemEditor';
import CreateItemMenu from '../CreateItemMenu';
import GlassButton from '../GlassButton';
import GlassInput from '../GlassInput';
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
const FWD_TILT = 40; // deg, waiting pile
const FWD_SCALE = 1.15; // waiting pile sits larger, leaning out toward you
const BACK_TILT = 14; // deg, first card behind the focused one (+7deg per card deeper); focused card is flat
const BACK_GAP = 44; // px between flipped cards
const PERSPECTIVE = 900;
const STEP = 220; // scroll px per card flip
const PUSH_MS = 380; // other cards slide off-screen when one is opened
const FOLLOW_MS = 260; // drawn progress glides toward the scroll position with this time constant
// Pile positions place the centre of a card's top square (w x w): square cards are centred there,
// taller cards share the same top edge and extend downward.
const FOCUS_Y = 0.38; // focused card centre, fraction of stage height
const FWD_Y = 0.8; // waiting pile centre
const MAX_CARD_W = 330;
const BAR_CLEARANCE = 72; // floating bottom search bar; piles are positioned between it and the top buttons
const TOP_CLEARANCE = 64; // floating top-right buttons

// Same staggered entrance as the desktop header (App.jsx navPop) and grid cards (BoardGrid).
const navPop = (order) => ({ animationDelay: `${500 + order * 110}ms` });
const cardPop = (i) => ({ animationDuration: '850ms', animationDelay: `${Math.min(i * 75, 600)}ms` });

const lerp = (a, b, u) => a + (b - a) * u;
const ease = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);

// Waiting pile, d cards behind the next one.
const fwdState = (d, H) => ({ y: H * FWD_Y + d * 16, rx: -FWD_TILT, s: FWD_SCALE - d * 0.035, o: d < 4 ? 1 : Math.max(0, 5 - d), dim: Math.min(d * 0.08, 0.3) });
// Flipped pile, k cards below the newest. k = 0 is the focused card: flat, tilting in as it's covered.
const backState = (k, H) => ({ y: H * FOCUS_Y - k * BACK_GAP, rx: Math.min(k, 1) * BACK_TILT + Math.max(0, k - 1) * 7, s: 1 - k * 0.07, o: k < 3 ? 1 : Math.max(0, 4 - k), dim: Math.min(k * 0.22, 0.65) });

// Scroll-driven 3D tilt stack of the current board's cards. A sticky stage holds every card;
// scroll progress (1 card per STEP px, snapped) flips cards from the waiting pile into the
// flipped pile. Transforms are written straight to the DOM from a scroll-linked rAF, so
// scrolling never re-renders React.
export default function MobileRolodexView({ query, onQueryChange, editMode, onToggleEditMode, viewMode, onToggleViewMode }) {
  const board = useApp((s) => s.currentBoard);
  const { deleteItem } = useActions();
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [openMenu, setOpenMenu] = useState(null); // 'create' | 'profile' | null
  const toggleMenu = (name) => setOpenMenu((open) => (open === name ? null : name));
  const closeMenu = () => setOpenMenu(null);
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

  // Card box: every card takes the full card width; height follows the widget aspect ratio.
  const cardSize = (item) => {
    const aspect = aspectFor(item, sizes);
    const w = Math.max(0, Math.min(MAX_CARD_W, box.w - 40));
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

  // Drawn progress (in cards). Trails the scroll position so flips play out smoothly even on
  // a fast wheel tick or snap; null until first paint.
  const shownRef = useRef(null);
  // Id of the tapped-open card (null when closed): it rests flat in focus while every other card
  // is pushed off-screen, earlier cards up and later cards down. push.amt animates 0 -> 1 -> 0;
  // push.id stays set while closing so cards slide back in from the right side.
  const openRef = useRef(null);
  const pushRef = useRef({ id: null, amt: 0, raf: null });

  const render = useCallback((p) => {
    const root = scrollRef.current;
    if (!root) return;
    const H = root.clientHeight - BAR_CLEARANCE - TOP_CLEARANCE;
    const push = pushRef.current;
    const openIdx = push.id === null ? -1 : cardRefs.current.findIndex((c) => c?.dataset.id === push.id);
    const pushY = openIdx < 0 ? 0 : ease(push.amt) * root.clientHeight;
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
      const dy = Math.sign(i - openIdx) * pushY;
      card.style.transform = `translate3d(-50%, ${(st.y + TOP_CLEARANCE + dy).toFixed(2)}px, 0) rotateX(${st.rx.toFixed(2)}deg) scale(${st.s.toFixed(4)})`;
      card.style.opacity = st.o;
      card.style.pointerEvents = openRef.current !== null && card.dataset.id !== openRef.current ? 'none' : '';
      card.style.setProperty('--dim', st.dim.toFixed(3));
      // Waiting pile: later cards over earlier. Flipping card: between piles. Flipped pile: newest on top.
      card.style.zIndex = t <= -1 ? 2000 + Math.round((-t - 1) * 10) : t < 0 ? 1500 : 1000 - Math.round(t * 10);
      card.style.visibility = st.o < 0.02 ? 'hidden' : 'visible';
    });
    const active = Math.max(0, Math.min(cardRefs.current.filter(Boolean).length - 1, Math.round(p)));
    // Swap (not stack) the classes: bg-ink/15 comes later in the CSS and would win over bg-ink.
    dotRefs.current.forEach((d, i) => {
      d?.classList.toggle('bg-ink', i === active);
      d?.classList.toggle('bg-ink/15', i !== active);
    });
    if (hintRef.current) hintRef.current.style.opacity = p > 0.15 ? 0 : 1;
  }, []);

  // Re-apply after every render (new items, resize, edit mode) at the current drawn progress.
  useLayoutEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    if (shownRef.current === null) shownRef.current = root.scrollTop / STEP;
    render(shownRef.current);
  });

  // Open/close a card, animating the push of the others.
  const setOpen = useCallback(
    (id) => {
      const push = pushRef.current;
      openRef.current = id;
      if (id !== null) push.id = id;
      const target = id === null ? 0 : 1;
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (push.raf !== null) cancelAnimationFrame(push.raf);
      let last = 0;
      const tick = (now) => {
        const dt = last ? now - last : 16;
        last = now;
        const step = reduce ? 1 : dt / PUSH_MS;
        push.amt = target ? Math.min(1, push.amt + step) : Math.max(0, push.amt - step);
        if (push.amt === 0) push.id = null;
        render(shownRef.current);
        push.raf = push.amt === target ? null : requestAnimationFrame(tick);
      };
      push.raf = requestAnimationFrame(tick);
    },
    [render],
  );

  // On scroll, ease the drawn progress toward the scroll position each frame until it settles.
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const push = pushRef.current;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let raf = null;
    let last = 0;
    const tick = (now) => {
      const target = root.scrollTop / STEP;
      const dt = last ? now - last : 16;
      last = now;
      const cur = shownRef.current ?? target;
      const next = reduce ? target : cur + (target - cur) * (1 - Math.exp(-dt / FOLLOW_MS));
      shownRef.current = Math.abs(target - next) < 0.001 ? target : next;
      render(shownRef.current);
      if (shownRef.current !== target) raf = requestAnimationFrame(tick);
      else {
        raf = null;
        last = 0;
      }
    };
    const onScroll = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    // Scrolling by hand closes an open card (the tap's own smooth scroll doesn't).
    const onUserScroll = () => {
      if (openRef.current !== null) setOpen(null);
    };
    root.addEventListener('scroll', onScroll, { passive: true });
    root.addEventListener('wheel', onUserScroll, { passive: true });
    root.addEventListener('touchmove', onUserScroll, { passive: true });
    return () => {
      root.removeEventListener('scroll', onScroll);
      root.removeEventListener('wheel', onUserScroll);
      root.removeEventListener('touchmove', onUserScroll);
      if (raf !== null) cancelAnimationFrame(raf);
      if (push.raf !== null) cancelAnimationFrame(push.raf);
    };
  }, [render, setOpen]);

  // Tap a card to open it: it scrolls into focus (flat) and the rest are pushed off-screen.
  // Tapping it again or the empty stage closes it. Controls inside the card still work.
  const focusCard = (i, id) => (e) => {
    if (e.target.closest('button, a, input, textarea, select')) return;
    e.stopPropagation();
    if (openRef.current === id) return setOpen(null);
    setOpen(id);
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    scrollRef.current?.scrollTo({ top: i * STEP, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <div className="relative h-full w-full flex flex-col">
      {openMenu && <div className="absolute inset-0 z-[3000]" onClick={closeMenu} />}

      {/* Top actions: same glass buttons and pop-in as the desktop header. New + Edit top left
          (create menu opens from the left edge), profile top right (settings menu from the right). */}
      <div className="absolute top-4 left-4 z-[3001] flex items-center gap-2">
        <div className="pop-in" style={navPop(2)}>
          <GlassButton onClick={() => toggleMenu('create')} aria-label="New" className="nav-grow">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          </GlassButton>
        </div>
        <div className="pop-in" style={navPop(1)}>
          <GlassButton
            onClick={onToggleEditMode}
            aria-label="Edit board"
            aria-pressed={editMode}
            className={`nav-grow ${editMode ? '!bg-primary !text-white' : ''}`}
          >
            <svg className="w-[1.15rem] h-[1.15rem]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </GlassButton>
        </div>
        <CreateItemMenu isOpen={openMenu === 'create'} onClose={closeMenu} />
      </div>
      <div className="absolute top-4 right-4 z-[3001]">
        <div className="pop-in" style={navPop(1)}>
          <div
            onClick={() => toggleMenu('profile')}
            aria-label="Settings"
            className="nav-grow apple-glass w-12 h-12 rounded-full flex items-center justify-center cursor-pointer hover:bg-white dark:hover:bg-white/20 transition-colors"
          >
            <span className="text-ink-subtle font-bold text-lg transition-colors">AN</span>
          </div>
        </div>
        <ProfileSettingsMenu isOpen={openMenu === 'profile'} viewMode={viewMode} onToggleViewMode={onToggleViewMode} />
      </div>

      <div
        ref={scrollRef}
        onClick={() => openRef.current !== null && setOpen(null)}
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
                    data-id={item.id}
                    onClick={focusCard(i, item.id)}
                    className="absolute left-1/2 top-0 cursor-pointer will-change-transform [--dim:0]"
                    style={{ width: w, height: h, marginTop: -w / 2, transformOrigin: `50% ${w / 2}px` }}
                  >
                    {/* Opaque backing: widgets are translucent glass, so stacked cards would show through. */}
                    <div
                      aria-hidden
                      className="absolute inset-px bg-canvas pointer-events-none"
                      style={{ borderRadius: backingRadius(item, sizes, w) }}
                    />
                    <div className="pop-in w-full h-full" style={cardPop(i)}>
                      <ItemCard
                        item={item}
                        size={sizes[item.id]}
                        editMode={editMode}
                        isDragging={false}
                        onOpen={openItem}
                        onDelete={askDelete}
                      />
                    </div>
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

      {/* Bottom search bar, floating over the waiting pile */}
      <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-canvas to-transparent z-[3001]">
        <div className="pop-in buoyant hover:scale-[1.03]" style={navPop(0)}>
          <GlassInput placeholder="Search" value={query} onChange={(e) => onQueryChange(e.target.value)} className="!w-full" />
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
