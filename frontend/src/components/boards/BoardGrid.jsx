import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ResponsiveGridLayout } from 'react-grid-layout';
import { WidthProvider } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { findPrimitive, itemMatchesQuery } from '../../model';
import { useActions, useApp } from '../../store';
import ItemCard from '../items/ItemCard';
import { DEFAULT_SIZE, FIXED_SIZES } from '../items/sizes';
import ItemEditor from '../ItemEditor';
import { useExiting } from '../useExiting';

// v2 grid (not the legacy wrapper) so we can pass our own `compactor` prop.
const ResponsiveReactGridLayout = WidthProvider(ResponsiveGridLayout);

const EMPTY = {};

/**
 * Cell-first (row-major) dense bin-packing pass.
 * Scans (y, x) top-to-bottom, left-to-right and fills each open cell with the first
 * fitting item from `orderedItems`, using lookahead to avoid creating unfillable 1x1 holes.
 */
function runCellFirstPack(orderedItems, cols, pinnedRect = null) {
  const grid = [];
  const fits = (x, y, w, h) => {
    if (x < 0 || y < 0 || x + w > cols) return false;
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        if (grid[y + dy]?.[x + dx]) return false;
      }
    }
    return true;
  };
  const occupy = (x, y, w, h) => {
    for (let dy = 0; dy < h; dy++) {
      if (!grid[y + dy]) grid[y + dy] = [];
      for (let dx = 0; dx < w; dx++) {
        grid[y + dy][x + dx] = true;
      }
    }
  };

  const placed = new Map();
  if (pinnedRect) {
    const pw = Math.min(pinnedRect.w, cols);
    const px = Math.max(0, Math.min(pinnedRect.x, cols - pw));
    const py = Math.max(0, pinnedRect.y);
    occupy(px, py, pw, pinnedRect.h);
    placed.set(pinnedRect.i, {
      ...pinnedRect,
      x: px,
      y: py,
      w: pw,
      h: pinnedRect.h,
      moved: false,
    });
  }

  const remaining = orderedItems
    .filter((it) => !pinnedRect || it.i !== pinnedRect.i)
    .map((it) => ({ ...it, w: Math.min(it.w, cols), h: it.h }));

  let x = 0;
  let y = 0;
  const maxRowsSearch = Math.max(50, (orderedItems.length + 2) * 4);

  while (remaining.length > 0 && y < maxRowsSearch) {
    if (grid[y]?.[x]) {
      x++;
      if (x >= cols) {
        x = 0;
        y++;
      }
      continue;
    }

    let availW = 0;
    while (x + availW < cols && !grid[y]?.[x + availW]) {
      availW++;
    }

    const fitting = remaining.filter((it) => fits(x, y, it.w, it.h));
    if (fitting.length === 0) {
      x++;
      if (x >= cols) {
        x = 0;
        y++;
      }
      continue;
    }

    let chosen = fitting[0];

    if (fitting.length > 1) {
      const totalWidth1Remaining = remaining.filter((it) => it.w === 1).length;
      const createsUnfillableGap = (cand) => {
        const otherWidth1Count = totalWidth1Remaining - (cand.w === 1 ? 1 : 0);
        let width1GapsNeeded = 0;
        if (availW - cand.w === 1) {
          width1GapsNeeded++;
        }
        if (cols === 3 && x === 1 && cand.w === 1 && cand.h > 1 && !grid[y + 1]?.[0]) {
          width1GapsNeeded++;
        }
        return width1GapsNeeded > otherWidth1Count;
      };

      if (createsUnfillableGap(chosen)) {
        const better = fitting.find((cand) => !createsUnfillableGap(cand));
        if (better) chosen = better;
      }
    }

    occupy(x, y, chosen.w, chosen.h);
    placed.set(chosen.i, { ...chosen, x, y, moved: false });
    const idx = remaining.indexOf(chosen);
    remaining.splice(idx, 1);

    x += chosen.w;
    if (x >= cols) {
      x = 0;
      y++;
    }
  }

  return { placed, grid };
}

/**
 * Computes a hole-free iOS-style dense layout. When `pinnedRect` is provided during an active
 * drag, other items flow around the dragged widget's hovered slot in real time.
 */
export function packDenseLayout(orderedItems, cols, pinnedRect = null, dragDirX = null) {
  if (!pinnedRect) {
    const { placed } = runCellFirstPack(orderedItems, cols, null);
    return orderedItems.map((it) => placed.get(it.i) ?? { ...it, x: 0, y: 0, moved: false });
  }

  const pw = Math.min(pinnedRect.w, cols);
  const px = Math.max(0, Math.min(pinnedRect.x, cols - pw));
  const py = Math.max(0, pinnedRect.y);

  let best = runCellFirstPack(orderedItems, cols, { ...pinnedRect, x: px, y: py, w: pw });

  const emptyCellsOnRow = (grid, row) => {
    let empty = 0;
    for (let c = 0; c < cols; c++) {
      if (!grid[row]?.[c]) empty++;
    }
    return empty;
  };

  if (pw < cols && emptyCellsOnRow(best.grid, py) > 0) {
    const candidatesX =
      dragDirX === 'left'
        ? [0, cols - pw]
        : dragDirX === 'right'
          ? [cols - pw, 0]
          : [0, cols - pw];

    for (const candX of candidatesX) {
      if (candX === px) continue;
      const attempt = runCellFirstPack(orderedItems, cols, {
        ...pinnedRect,
        x: candX,
        y: py,
        w: pw,
      });
      if (emptyCellsOnRow(attempt.grid, py) < emptyCellsOnRow(best.grid, py)) {
        best = attempt;
        break;
      }
    }
  }

  const intermediate = Array.from(best.placed.values()).sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });

  const { placed: finalPlaced } = runCellFirstPack(intermediate, cols, null);
  return orderedItems.map((it) => finalPlaced.get(it.i) ?? { ...it, x: 0, y: 0, moved: false });
}

// Bento grid of the current board's items.
// Card sizes live in board.view.sizes (presentation, frontend-owned).
// Order = board.items order; edit mode enables drag-to-reorder.
// Guard lives here, not in BoardGridView: hooks there must run unconditionally, and the
// board can vanish (delete/switch) before this unmounts.
export default function BoardGrid(props) {
  const board = useApp((s) => s.currentBoard);
  if (!board) return null;
  return <BoardGridView board={board} {...props} />;
}

function BoardGridView({ board, query, editMode }) {
  if (typeof ResizeObserver !== 'undefined' && !ResizeObserver.prototype.unobserve) {
    ResizeObserver.prototype.unobserve = () => {};
  }

  const { deleteItem, reorderItems, setView } = useActions();
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [settlingId, setSettlingId] = useState(null);
  const settleTimerRef = useRef(null);

  // Square cells: 1 row height = 1 column width (3 cols, 2 gaps of 24px)
  const gridRef = useRef(null);
  const [rowHeight, setRowHeight] = useState(200);
  const [cols, setCols] = useState(
    window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1,
  );

  useEffect(() => {
    if (!gridRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        let newCols = 1;
        let gaps = 0;
        if (window.innerWidth >= 1024) {
          newCols = 3;
          gaps = 48; // 2 * 24px gap
        } else if (window.innerWidth >= 768) {
          newCols = 2;
          gaps = 24; // 1 * 24px gap
        }
        setCols(newCols);
        if (width > 0) {
          setRowHeight((width - gaps) / newCols);
        }
      }
    });
    observer.observe(gridRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => clearTimeout(settleTimerRef.current), []);

  const sizes = board.view.sizes ?? EMPTY;
  // Memoized so layout packing + RGL re-layout only run when items/query change, not every render.
  const items = useMemo(
    () => board.items.filter((item) => itemMatchesQuery(item, query)),
    [board.items, query],
  );
  // Stable per-id handlers so memoized cards skip re-render during drag/settle state changes.
  const openItem = useCallback((id) => setEditingId(id), []);
  const askDelete = useCallback((id) => setDeletingId(id), []);
  // Kept through the exit animation (the deleted item is already gone from the board by then).
  const [editingItem, editorClosing] = useExiting(board.items.find((i) => i.id === editingId));
  const [deletingItem, deleteClosing] = useExiting(board.items.find((i) => i.id === deletingId));

  // Drag state for the compactor. Written only in drag event handlers, read only inside
  // compact() (which react-grid-layout calls during drag), so it never feeds render output.
  const activeDragRef = useRef(null);
  const baseOrderRef = useRef([]);

  const itemSpecs = useMemo(
    () =>
      items.map((item) => {
        const sizeStr = sizes[item.id] || FIXED_SIZES[item.primitiveId] || DEFAULT_SIZE;
        const [wStr, hStr] = sizeStr.split('x');
        return { i: item.id, x: 0, y: 0, w: parseInt(wStr, 10) || 1, h: parseInt(hStr, 10) || 1 };
      }),
    [items, sizes],
  );

  // iOS-style 2D dense flow: compaction displaces widgets both vertically and horizontally
  // in real time during drag. Built from this render's items (no render-phase ref writes),
  // so the grid's compaction can never run against a stale order or size map.
  const compactor = useMemo(() => {
    const itemsOrder = itemSpecs.map((spec) => spec.i);
    const sizeMap = new Map(itemSpecs.map((spec) => [spec.i, spec]));
    const compact = (layout, gridCols) => {
      if (!layout || layout.length === 0) return [];
      const dragState = activeDragRef.current;
      const orderIds = dragState ? baseOrderRef.current : itemsOrder;
      const orderMap = new Map(orderIds.map((id, idx) => [id, idx]));

      const normalized = layout.map((l) => {
        const spec = sizeMap.get(l.i);
        return {
          ...l,
          w: Math.min(spec ? spec.w : l.w, gridCols),
          h: spec ? spec.h : l.h,
        };
      });

      const ordered = [...normalized].sort((a, b) => {
        const ia = orderMap.get(a.i) ?? 9999;
        const ib = orderMap.get(b.i) ?? 9999;
        return ia - ib;
      });

      let pinned = null;
      if (dragState) {
        const draggedItem = normalized.find((l) => l.i === dragState.id);
        if (draggedItem) {
          pinned = {
            ...draggedItem,
            x: dragState.rawX ?? draggedItem.x,
            y: dragState.rawY ?? draggedItem.y,
          };
        }
      }

      const packed = packDenseLayout(ordered, gridCols, pinned, dragState?.dirX ?? null);
      const packedMap = new Map(packed.map((p) => [p.i, p]));
      return layout.map((l) => packedMap.get(l.i) ?? { ...l, moved: false });
    };
    return { type: 'vertical', allowOverlap: false, preventCollision: false, compact };
  }, [itemSpecs]);

  const layoutArray = useMemo(() => packDenseLayout(itemSpecs, cols, null, null), [itemSpecs, cols]);
  const layoutMap = useMemo(
    () => new Map(layoutArray.map((pos) => [pos.i, pos])),
    [layoutArray],
  );
  const currentBreakpoint = cols === 3 ? 'lg' : cols === 2 ? 'md' : 'sm';
  const responsiveLayouts = useMemo(
    () => ({
      lg: packDenseLayout(itemSpecs, 3, null, null),
      md: packDenseLayout(itemSpecs, 2, null, null),
      sm: packDenseLayout(itemSpecs, 1, null, null),
    }),
    [itemSpecs],
  );

  // Children keep first-seen order so reorders move grid positions, not DOM nodes.
  // Held in state (adjusted during render, React's "previous render info" pattern), not a ref.
  const [mountOrder, setMountOrder] = useState(() => new Map());
  const unseen = items.filter((it) => !mountOrder.has(it.id));
  if (unseen.length > 0) {
    const next = new Map(mountOrder);
    unseen.forEach((it) => next.set(it.id, next.size));
    setMountOrder(next);
  }
  const stableItems = useMemo(
    () => [...items].sort((a, b) => (mountOrder.get(a.id) ?? 0) - (mountOrder.get(b.id) ?? 0)),
    [items, mountOrder],
  );

  return (
    <div ref={gridRef} className="w-full max-w-7xl mx-auto pt-32 pb-10 px-8 overflow-visible">
      {board.items.length === 0 && (
        <p className="text-center text-ink/40 pt-24 text-sm">
          Nothing here yet — hit + to add something.
        </p>
      )}
      {board.items.length > 0 && items.length === 0 && (
        <p className="text-center text-ink/40 pt-24 text-sm">No matches for “{query}”.</p>
      )}

      {items.length > 0 && (
        <ResponsiveReactGridLayout
          className="layout overflow-visible"
          breakpoint={currentBreakpoint}
          breakpoints={{ lg: 1024, md: 768, sm: 0 }}
          cols={{ lg: 3, md: 2, sm: 1 }}
          rowHeight={rowHeight}
          margin={[24, 24]}
          containerPadding={[0, 0]}
          // Outside edit mode only the card's grip drags; in edit mode the whole card does.
          dragConfig={{ enabled: true, bounded: false, handle: editMode ? undefined : '.drag-handle', cancel: '.card-action-btn' }}
          resizeConfig={{ enabled: false }}
          compactor={compactor}
          layouts={responsiveLayouts}
          onDragStart={(_layout, oldItem, newItem) => {
            const target = newItem || oldItem;
            if (!target) return;
            clearTimeout(settleTimerRef.current);
            setSettlingId(null);
            baseOrderRef.current = items.map((it) => it.id);
            activeDragRef.current = {
              id: target.i,
              rawX: target.x,
              rawY: target.y,
              dirX: null,
            };
            setDragId(target.i);
          }}
          onDrag={(_layout, _oldItem, newItem) => {
            if (!newItem || !activeDragRef.current) return;
            const prev = activeDragRef.current;
            let dirX = prev.dirX;
            if (newItem.x !== prev.rawX) {
              dirX = newItem.x < prev.rawX ? 'left' : 'right';
            }
            activeDragRef.current = {
              id: newItem.i,
              rawX: newItem.x,
              rawY: newItem.y,
              dirX,
            };
          }}
          onDragStop={(layout, _oldItem, newItem) => {
            const stoppedId = newItem?.i ?? activeDragRef.current?.id ?? null;
            activeDragRef.current = null;
            setDragId(null);
            if (stoppedId) {
              setSettlingId(stoppedId);
              clearTimeout(settleTimerRef.current);
              settleTimerRef.current = setTimeout(() => setSettlingId(null), 320);
            }

            // Sort the compacted post-drag layout in reading order (y, then x)
            // and synchronize board.items to match.
            const sortedIds = [...layout]
              .sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y))
              .map((l) => l.i);

            const currentIds = board.items.map((it) => it.id);
            const visibleSet = new Set(sortedIds);
            const visibleCurrentIds = currentIds.filter((id) => visibleSet.has(id));

            const workingIds = [...currentIds];
            for (let targetVisIdx = 0; targetVisIdx < sortedIds.length; targetVisIdx++) {
              const targetId = sortedIds[targetVisIdx];
              const currentVisId = visibleCurrentIds[targetVisIdx];
              if (targetId === currentVisId) continue;

              const fromIdx = workingIds.indexOf(targetId);
              const toIdx = workingIds.indexOf(currentVisId);
              if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
                const [moved] = workingIds.splice(fromIdx, 1);
                workingIds.splice(toIdx, 0, moved);
                reorderItems(fromIdx, toIdx).catch(() => {}); // failure shown by SaveStatus
              }
              // Recompute visibleCurrentIds after splice
              const updatedVisible = workingIds.filter((id) => visibleSet.has(id));
              for (let k = 0; k < updatedVisible.length; k++) {
                visibleCurrentIds[k] = updatedVisible[k];
              }
            }
          }}
        >
          {stableItems.map((item, i) => {
            const layoutPos = layoutMap.get(item.id) || { x: 0, y: i, w: 1, h: 1 };
            const isDragging = dragId === item.id;
            const isSettling = settlingId === item.id;

            return (
              <div
                key={item.id}
                data-grid={{ x: layoutPos.x, y: layoutPos.y, w: layoutPos.w, h: layoutPos.h }}
                className={
                  isDragging
                    ? '!z-50 shadow-2xl shadow-black/50 rounded-card'
                    : isSettling
                      ? '!z-40'
                      : ''
                }
              >
                {/* Inner wrapper: the grid item's own transform is owned by react-grid-layout */}
                <div className="pop-in w-full h-full" style={{ animationDuration: '850ms', animationDelay: `${Math.min(i * 75, 600)}ms` }}>
                  <ItemCard
                    item={item}
                    size={sizes[item.id]}
                    editMode={editMode}
                    isDragging={isDragging}
                    onOpen={openItem}
                    onDelete={askDelete}
                  />
                </div>
              </div>
            );
          })}
        </ResponsiveReactGridLayout>
      )}

      {editingItem && <ItemEditor key={editingItem.id} item={editingItem} closing={editorClosing} onClose={() => setEditingId(null)} />}

      {deletingItem && (
        <DeleteConfirmModal
          item={deletingItem}
          closing={deleteClosing}
          onCancel={() => setDeletingId(null)}
          onConfirm={() => {
            deleteItem(deletingItem.id).catch(() => {}); // failure shown by SaveStatus
            setDeletingId(null);
          }}
        />
      )}
    </div>
  );
}

export function DeleteConfirmModal({ item, onCancel, onConfirm, closing = false }) {
  const label = findPrimitive(item.primitiveId)?.name ?? 'Item';
  return (
    <div
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 z-50 flex items-center justify-center modal-backdrop ${closing ? 'is-closing' : ''} bg-black/40 backdrop-blur-sm`}
      onClick={onCancel}
    >
      <div
        className="apple-glass rounded-sheet p-6 max-w-sm w-full mx-4 shadow-2xl flex flex-col gap-4 modal-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-ink">Delete {label}?</h3>
        <p className="text-sm text-ink/75 dark:text-ink/60">
          This item will be permanently removed from your board.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-full text-sm font-medium bg-ink/5 dark:bg-ink/10 hover:bg-ink/10 dark:hover:bg-ink/20 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-full text-sm font-medium bg-danger text-white hover:bg-danger-strong transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
