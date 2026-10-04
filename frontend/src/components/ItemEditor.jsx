import React, { useState } from 'react';
import { findPrimitive, validateFields } from '../model';
import { useActions } from '../store';
import PrimitiveForm from './forms/PrimitiveForm';

// Modal for editing one item. Saves once on "Save" (not per keystroke).
export default function ItemEditor({ item, onClose }) {
  const { updateItem } = useActions();
  // Unknown/custom primitive (stale data, removed type): show a notice. Deleting is the card's × (edit mode).
  const primitive = findPrimitive(item.primitiveId);
  const [values, setValues] = useState(item.fields);
  const issues = primitive ? validateFields(values, primitive) : [];

  const handleSave = async () => {
    // Save failure is shown by SaveStatus; the change stays in state and persists on the next save.
    await updateItem(item.id, values).catch(() => {});
    onClose();
  };

  return (
    // p-4 + max-h-full: a form taller than the screen (or the phone simulator) scrolls inside the card.
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 modal-backdrop bg-black/20 dark:bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[28rem] max-w-[calc(100vw-2rem)] max-h-full overflow-y-auto overscroll-contain p-6 apple-glass rounded-sheet modal-pop flex flex-col space-y-5"
      >
        <h3 className="text-ink font-bold text-sm px-1">Edit {primitive?.name ?? 'Item'}</h3>

        {primitive ? (
          <PrimitiveForm primitive={primitive} values={values} onChange={setValues} issues={issues} />
        ) : (
          <p className="text-sm text-ink/85 dark:text-ink/70 px-1">
            Unknown item type “{item.primitiveId}”. It can’t be edited here; delete it with the card’s × in edit mode.
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-full text-sm font-semibold bg-ink/5 text-ink/85 hover:bg-ink/10 dark:bg-ink/10 dark:text-ink/80 dark:hover:bg-ink/20 transition-colors"
          >
            Cancel
          </button>
          {primitive && <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-primary/90 backdrop-blur-md border border-primary/50 text-white rounded-full hover:bg-primary-strong/90 text-sm font-semibold transition-colors shadow-lg"
          >
            Save
          </button>}
        </div>
      </div>
    </div>
  );
}
