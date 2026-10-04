import React, { useEffect, useState } from 'react';
import { findPrimitive, getItemIssues } from '../../model';
import GenericCard from './GenericCard';
import { CARD_COMPONENTS } from './registry';
import { DEFAULT_SIZE, FIXED_SIZES, SIZE_CLASSES } from './sizes';
import GrainOverlay from '../GrainOverlay';
import GlassButton from '../GlassButton';

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

  const isFullBleed = ['recommendation_list', 'code_snippet', 'map_location', 'note', 'product', 'receipt', 'ticket', 'music_track'].includes(primitive.id);
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
      style={wiggleStyle}
      className={`w-full h-full relative buoyant ${editMode ? '[&_button:not(.card-action-btn)]:pointer-events-none [&_a]:pointer-events-none' : 'hover:scale-[1.012] hover:-translate-y-1 hover:-rotate-[0.5deg]'} ${
        isFullBleed
          ? 'flex'
          : 'apple-glass rounded-card p-6 overflow-hidden shadow-2xl'
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
      {!isFullBleed && <GrainOverlay />}
      <Card item={item} primitive={primitive} />

      {issues.length > 0 && (
        <span
          title={issues.map((i) => `${i.fieldKey}: ${ISSUE_TEXT[i.kind]}`).join('\n')}
          className="absolute bottom-4 right-4 w-2.5 h-2.5 rounded-full bg-warning shadow"
        />
      )}

      {editMode && (
        <div className="absolute top-3 right-3 z-20 flex gap-1.5">
          <GlassButton 
            className="card-action-btn !pointer-events-auto"
            aria-label="Edit" 
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              if (onOpen) onOpen();
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </GlassButton>
          <GlassButton 
            className="card-action-btn !pointer-events-auto !text-red-500 hover:!bg-red-500/20 dark:!text-red-400 dark:hover:!bg-red-500/20"
            aria-label="Delete" 
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              if (onDelete) onDelete();
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </GlassButton>
        </div>
      )}
    </div>
  );
}

function UnsupportedCard({ primitive }) {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-1 text-center text-ink/50">
      <span className="text-sm font-semibold">Unsupported item</span>
      <span className="text-xs">
        &ldquo;{primitive.id}&rdquo; isn&rsquo;t available in this version. Delete it from edit mode.
      </span>
    </div>
  );
}
