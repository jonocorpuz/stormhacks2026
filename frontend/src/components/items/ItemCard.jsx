import React from 'react';
import { getItemIssues, getPrimitive } from '../../model';
import GenericCard from './GenericCard';
import { CARD_COMPONENTS } from './registry';
import { DEFAULT_SIZE, FIXED_SIZES, SIZE_CLASSES } from './sizes';

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
  onOpen,
  onDelete,
  onCycleSize,
  dragProps,
}) {
  const primitive = getPrimitive(item.primitiveId);
  const Card = CARD_COMPONENTS[primitive.id] ?? GenericCard;
  const issues = getItemIssues(item);

  const isFullBleed = primitive.id === 'recommendation_list' || primitive.id === 'code_snippet';
  const fixedSize = FIXED_SIZES[primitive.id];
  const effectiveSize = fixedSize ?? size;

  return (
    <div
      {...dragProps}
      onClick={onOpen}
      className={`${SIZE_CLASSES[effectiveSize] ?? SIZE_CLASSES[DEFAULT_SIZE]} relative transition-transform hover:scale-[1.02] cursor-pointer ${
        isFullBleed
          ? 'flex'
          : 'apple-glass rounded-[2rem] p-6 overflow-hidden shadow-2xl'
      } ${
        editMode ? 'ring-2 ring-black/10 dark:ring-white/20 cursor-grab' : ''
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
        <div className="absolute top-3 right-3 flex gap-1.5">
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

function CardButton({ label, onClick, danger, children }) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`w-7 h-7 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/15 backdrop-blur-md transition-colors ${
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
