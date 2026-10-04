import React, { useState } from 'react';
import { findPrimitive, validateFields } from '../model';
import { useActions } from '../store';
import PrimitiveForm from './forms/PrimitiveForm';

// Modal for editing one item. Saves once on "Save" (not per keystroke).
export default function ItemEditor({ item, onClose }) {
  const { updateItem, deleteItem } = useActions();
  // Unknown/custom primitive (stale data, removed type): show a notice, still allow delete.
  const primitive = findPrimitive(item.primitiveId);
  const [values, setValues] = useState(item.fields);
  const issues = primitive ? validateFields(values, primitive) : [];

  const handleSave = async () => {
    await updateItem(item.id, values);
    onClose();
  };

  const handleDelete = async () => {
    await deleteItem(item.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 dark:bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[28rem] max-w-[calc(100vw-2rem)] p-6 apple-glass rounded-sheet animate-slide-down-fade flex flex-col space-y-5"
      >
        <h3 className="text-ink font-bold text-sm px-1">Edit {primitive?.name ?? 'Item'}</h3>

        {primitive ? (
          <PrimitiveForm primitive={primitive} values={values} onChange={setValues} issues={issues} />
        ) : (
          <p className="text-sm text-ink/70 px-1">
            Unknown item type “{item.primitiveId}”. It can’t be edited here, but you can delete it.
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleDelete}
            className="px-4 py-2.5 rounded-full text-sm font-semibold text-danger hover:bg-danger/10 transition-colors"
          >
            Delete
          </button>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-full text-sm font-semibold bg-ink/5 text-ink/70 hover:bg-ink/10 dark:bg-ink/10 dark:text-ink/80 dark:hover:bg-ink/20 transition-colors"
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
