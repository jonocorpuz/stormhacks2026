import React, { useEffect, useState } from 'react';
import { findPrimitive, getItemIssues } from '../../model';
import GenericCard from './GenericCard';
import { CARD_COMPONENTS } from './registry';
import { DEFAULT_SIZE, FIXED_SIZES, SIZE_CLASSES } from './sizes';

// How long the wiggle keeps running after edit mode ends, so it can ease out (matches --wiggle-amp transition).
const WIGGLE_SETTLE_MS = 350;

const ISSUE_TEXT = {
  missing_required: 'missing required',
  invalid_value: 'invalid value',
  orphaned_field: 'unknown field',
};

// Glass card shell for any item. Picks the primitive's card (or GenericCard),
// flags validation issues, and shows edit-mode controls. Pure: all changes go up via props.
export default function ItemCard({
  item,
  size = DEFAULT_SIZE,
  editMode,
  isDragging,
  onOpen,
  onDelete,
  onCycleSize,
  dragProps,
}) {
  // Saved boards can hold items whose primitive this build doesn't know (e.g. created on
  // another branch). Show a placeholder instead of throwing, which would blank the whole app.
  const known = findPrimitive(item.primitiveId);
  const primitive = known ?? { id: item.primitiveId, name: item.primitiveId, fields: [] };
  const Card = known ? (CARD_COMPONENTS[primitive.id] ?? GenericCard) : UnsupportedCard;
  const issues = known ? getItemIssues(item) : [];

  const isFullBleed = ['recommendation_list', 'code_snippet', 'map_location', 'note', 'product', 'receipt', 'ticket'].includes(primitive.id);
  const fixedSize = FIXED_SIZES[primitive.id];
  const effectiveSize = fixedSize ?? size;

  // Leaving edit mode: keep wiggling briefly while --wiggle-amp eases to 0, instead of snapping still.
  const [prevEditMode, setPrevEditMode] = useState(editMode);
  const [settling, setSettling] = useState(false);
  if (prevEditMode !== editMode) {
    setPrevEditMode(editMode);
    setSettling(!editMode);
  }
  useEffect(() => {
    if (!settling) return;
    const t = setTimeout(() => setSettling(false), WIGGLE_SETTLE_MS);
    return () => clearTimeout(t);
  }, [settling]);
  const wiggling = (editMode || settling) && !isDragging;

  // Two animations (wiggle, bob): comma lists, varied per card so they don't move in lockstep.
  const wiggleStyle = wiggling ? {
    animationDelay: `${(item.createdAt % 100) * -0.01}s, ${(item.createdAt % 160) * -0.01}s`,
    animationDuration: `${0.4 + (item.createdAt % 5) * 0.03}s, ${1.4 + (item.createdAt % 7) * 0.1}s`
  } : undefined;

  return (
    <div
      {...dragProps}
      onClick={known && !editMode ? onOpen : undefined}
      style={wiggleStyle}
      className={`w-full h-full relative buoyant ${editMode ? '[&_button:not(.card-action-btn)]:pointer-events-none [&_a]:pointer-events-none' : 'hover:scale-[1.012] hover:-translate-y-1 hover:-rotate-[0.5deg]'} cursor-pointer ${
        isFullBleed
          ? 'flex'
          : 'apple-glass rounded-[2rem] p-6 overflow-hidden shadow-2xl'
      } ${
        editMode
          ? isDragging
            ? 'cursor-grabbing scale-[1.02] shadow-2xl shadow-black/50 rounded-[2rem]'
            : 'ios-wiggle wiggle-on cursor-grab'
          : wiggling
            ? 'ios-wiggle'
            : ''
      }`}
    >
      <Card item={item} primitive={primitive} />

      {issues.length > 0 && (
        <span
          title={issues.map((i) => `${i.fieldKey}: ${ISSUE_TEXT[i.kind]}`).join('\n')}
          className="absolute bottom-4 right-4 w-2.5 h-2.5 rounded-full bg-amber-400 shadow"
        />
      )}

      {editMode && (
        <div className="absolute top-3 right-3 z-20 flex gap-1.5">
          {!fixedSize && (
            <CardButton label="Resize" onClick={onCycleSize}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4M20 16v4h-4M4 4l6 6m10 10l-6-6" />
            </CardButton>
          )}
          <CardButton label="Delete" onClick={onDelete} danger>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </CardButton>
        </div>
      )}
    </div>
  );
}

function UnsupportedCard({ primitive }) {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-1 text-center text-black/50 dark:text-white/50">
      <span className="text-sm font-semibold">Unsupported item</span>
      <span className="text-xs">
        &ldquo;{primitive.id}&rdquo; isn&rsquo;t available in this version. Delete it from edit mode.
      </span>
    </div>
  );
}

function CardButton({ label, onClick, danger, children }) {
  return (
    <button
      aria-label={label}
      title={label}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`card-action-btn !pointer-events-auto w-7 h-7 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/15 backdrop-blur-md transition-colors ${
        danger
          ? 'text-red-500 hover:bg-red-500/20'
          : 'text-black/60 dark:text-white/80 hover:bg-black/10 dark:hover:bg-white/25'
      }`}
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        {children}
      </svg>
    </button>
  );
}
