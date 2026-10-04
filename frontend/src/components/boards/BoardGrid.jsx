import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { verticalCompactor } from 'react-grid-layout';
import ReactGridLayout, { WidthProvider } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { findPrimitive, itemMatchesQuery } from '../../model';
import { useActions, useApp } from '../../store';
import ItemCard from '../items/ItemCard';
import { DEFAULT_SIZE, FIXED_SIZES, nextSize } from '../items/sizes';
import ItemEditor from '../ItemEditor';

const EMPTY = {};

// Container-width breakpoints (Tailwind scale). WidthProvider measures the grid itself.
const BREAKPOINTS = { lg: 1024, md: 768, sm: 640, xs: 480, xxs: 0 };
const COLS = { lg: 3, md: 2, sm: 2, xs: 1, xxs: 1 };
const GAP = 24;

/**
 * Per-breakpoint size of a card whose desktop size is w x h.
 * Multi-column: clamp width to the column count (3x1 -> 2x1 on tablet).
 * Single column: full width, rows are half-width (see rowHeightFor), so the card keeps its
 * designed aspect ratio (1x1 -> square, 2x1 -> 2:1, 1x2 -> 1:2). The Figma widgets scale off
 * their width, so a preserved aspect ratio means nothing clips.
 */
function sizeForCols(w, h, cols) {
  if (cols > 1) return { w: Math.min(w, cols), h };
  return { w: 1, h: Math.max(1, Math.round((2 * h) / w)) };
}

function colsForWidth(width) {
  const bp = Object.keys(BREAKPOINTS).find((key) => width >= BREAKPOINTS[key]) ?? 'xxs';
  return COLS[bp];
}

/*
 * The grid engine runs on a fixed lattice of UNITS square columns (lcm of 3/2/1) and only the
 * logical column count changes per breakpoint. react-grid-layout syncs its layout prop in an
 * effect, so changing `cols` + `layout` together paints one frame of the old layout on the new
 * column geometry — cards animate toward a wrong slot, then snap back (resize stutter).
 * With `cols` constant, width/rowHeight update in the same render and the stale frame is just
 * the old arrangement scaled a few percent.
 * Logical -> units: 3 cols = 2 units/cell, 2 cols = 3 units/cell, 1 col = 6 wide x 3 tall
 * (half-width rows, see sizeForCols).
 */
const UNITS = 6;

function unitScale(cols) {
  const sx = UNITS / cols;
  return { sx, sy: cols === 1 ? sx / 2 : sx };
}

function toUnits(l, cols) {
  const { sx, sy } = unitScale(cols);
  return { ...l, x: l.x * sx, y: l.y * sy, w: l.w * sx, h: l.h * sy };
}

function unitRowHeight(width) {
  return Math.max(1, (width - GAP * (UNITS - 1)) / UNITS);
}

// WidthProvider injects the measured width; breakpoint, row height and layout all derive from
// it in this one render, so geometry and positions never disagree mid-resize.
function FluidGridBase({ width, layoutFor, colsRef, editMode, ...rest }) {
  const cols = colsForWidth(width);
  const layout = useMemo(() => layoutFor(cols), [layoutFor, cols]);
  // Before RGL's effects re-run the compactor against the new layout.
  useLayoutEffect(() => {
    colsRef.current = cols;
  }, [colsRef, cols]);
  return (
    <ReactGridLayout
      {...rest}
      width={width}
      cols={UNITS}
      rowHeight={unitRowHeight(width)}
      layout={layout}
      // Single column = touch layout: no dragging, so scrolling never picks up a card.
      isDraggable={editMode && cols > 1}
    />
  );
}

const FluidGrid = WidthProvider(FluidGridBase);

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
export default function BoardGrid({ query, editMode }) {
  if (typeof ResizeObserver !== 'undefined' && !ResizeObserver.prototype.unobserve) {
    ResizeObserver.prototype.unobserve = () => {};
  }

  const board = useApp((s) => s.currentBoard);
  const { deleteItem, reorderItems, setView } = useActions();
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [settlingId, setSettlingId] = useState(null);
  const settleTimerRef = useRef(null);

  // Logical column count of the rendered breakpoint (set by FluidGrid) for the compactor.
  const colsRef = useRef(3);

  useEffect(() => () => clearTimeout(settleTimerRef.current), []);

  const sizes = board.view.sizes ?? EMPTY;
  const items = board.items.filter((item) => itemMatchesQuery(item, query));
  const editingItem = board.items.find((i) => i.id === editingId);
  const deletingItem = board.items.find((i) => i.id === deletingId);

  // Maintain refs for the real-time compactor so react-grid-layout's internal
  // onDrag loop immediately displaces underlying widgets smoothly before drop.
  const activeDragRef = useRef(null);
  const baseOrderRef = useRef([]);
  const itemsOrderRef = useRef([]);
  const itemSizesRef = useRef(new Map());

  const itemSpecs = useMemo(() => {
    const specs = [];
    const sizeMap = new Map();
    items.forEach((item) => {
      const sizeStr = sizes[item.id] || FIXED_SIZES[item.primitiveId] || DEFAULT_SIZE;
      const [wStr, hStr] = sizeStr.split('x');
      const w = parseInt(wStr, 10) || 1;
      const h = parseInt(hStr, 10) || 1;
      specs.push({ i: item.id, x: 0, y: 0, w, h });
      sizeMap.set(item.id, { w, h });
    });
    itemSizesRef.current = sizeMap;
    itemsOrderRef.current = items.map((it) => it.id);
    return specs;
  }, [items, sizes]);

  // Hook our iOS 2D dense flow logic into verticalCompactor so compactType="vertical"
  // performs both vertical and horizontal real-time auto-displacement during drag.
  useEffect(() => {
    const prevCompact = verticalCompactor.compact;
    // RGL hands us unit coordinates; pack in logical columns, then scale back to units.
    verticalCompactor.compact = (layout) => {
      if (!layout || layout.length === 0) return [];
      const gridCols = colsRef.current;
      const { sx, sy } = unitScale(gridCols);
      const dragState = activeDragRef.current;
      const orderIds = dragState ? baseOrderRef.current : itemsOrderRef.current;
      const orderMap = new Map(orderIds.map((id, idx) => [id, idx]));

      const normalized = layout.map((l) => {
        const spec = itemSizesRef.current.get(l.i);
        const size = spec ? sizeForCols(spec.w, spec.h, gridCols) : { w: 1, h: 1 };
        return { ...l, x: Math.round(l.x / sx), y: Math.round(l.y / sy), ...size };
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
            x: dragState.rawX != null ? Math.round(dragState.rawX / sx) : draggedItem.x,
            y: dragState.rawY != null ? Math.round(dragState.rawY / sy) : draggedItem.y,
          };
        }
      }

      const packed = packDenseLayout(ordered, gridCols, pinned, dragState?.dirX ?? null);
      const packedMap = new Map(packed.map((p) => [p.i, toUnits(p, gridCols)]));
      return layout.map((l) => packedMap.get(l.i) ?? { ...l, moved: false });
    };
    return () => {
      verticalCompactor.compact = prevCompact;
    };
  }, []);

  // Packed layout for a logical column count, with cards resized for it, in grid units.
  const layoutFor = useCallback(
    (n) =>
      packDenseLayout(
        itemSpecs.map((s) => ({ ...s, ...sizeForCols(s.w, s.h, n) })),
        n,
        null,
        null,
      ).map((l) => toUnits(l, n)),
    [itemSpecs],
  );

  const mountOrderRef = useRef(new Map());
  const stableItems = useMemo(() => {
    const map = mountOrderRef.current;
    items.forEach((it) => {
      if (!map.has(it.id)) {
        map.set(it.id, map.size);
      }
    });
    return [...items].sort((a, b) => (map.get(a.id) ?? 0) - (map.get(b.id) ?? 0));
  }, [items]);

  return (
    <div className="w-full max-w-7xl mx-auto pt-32 pb-10 px-4 sm:px-8 overflow-visible">
      {board.items.length === 0 && (
        <p className="text-center text-ink/40 pt-24 text-sm">
          Nothing here yet — hit + to add something.
        </p>
      )}
      {board.items.length > 0 && items.length === 0 && (
        <p className="text-center text-ink/40 pt-24 text-sm">No matches for “{query}”.</p>
      )}

      {items.length > 0 && (
        <FluidGrid
          className="layout overflow-visible transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
          measureBeforeMount={false}
          layoutFor={layoutFor}
          colsRef={colsRef}
          editMode={editMode}
          margin={[GAP, GAP]}
          containerPadding={[0, 0]}
          isResizable={false}
          draggableCancel=".card-action-btn"
          compactType="vertical"
          preventCollision={false}
          allowOverlap={false}
          useCSSTransforms={true}
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
                reorderItems(fromIdx, toIdx);
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
            const isDragging = editMode && dragId === item.id;
            const isSettling = settlingId === item.id;

            return (
              <div
                key={item.id}
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
                    onOpen={() => setEditingId(item.id)}
                    onDelete={() => setDeletingId(item.id)}
                    onCycleSize={() =>
                      setView({ sizes: { ...sizes, [item.id]: nextSize(sizes[item.id] ?? DEFAULT_SIZE) } })
                    }
                  />
                </div>
              </div>
            );
          })}
        </FluidGrid>
      )}

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

function DeleteConfirmModal({ item, onCancel, onConfirm }) {
  const label = findPrimitive(item.primitiveId)?.name ?? 'Item';
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="apple-glass rounded-sheet p-6 max-w-sm w-full mx-4 shadow-2xl flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-ink">Delete {label}?</h3>
        <p className="text-sm text-ink/60">
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
