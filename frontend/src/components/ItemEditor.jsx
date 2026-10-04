import React, { useState } from 'react';
import { getPrimitive, validateFields } from '../model';
import { useActions } from '../store';
import PrimitiveForm from './forms/PrimitiveForm';

// Modal for editing one item. Saves once on "Save" (not per keystroke).
export default function ItemEditor({ item, onClose }) {
  const { updateItem } = useActions();
  const primitive = getPrimitive(item.primitiveId);
  const [values, setValues] = useState(item.fields);
  const issues = validateFields(values, primitive);

  const handleSave = async () => {
    await updateItem(item.id, values);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 dark:bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[28rem] max-w-[calc(100vw-2rem)] p-6 apple-glass rounded-sheet animate-slide-down-fade flex flex-col space-y-5"
      >
        <h3 className="text-ink font-bold text-sm px-1">Edit {primitive.name}</h3>

        <PrimitiveForm primitive={primitive} values={values} onChange={setValues} issues={issues} />

        <div className="flex gap-2 pt-1">
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-full text-sm font-semibold bg-ink/5 text-ink/70 hover:bg-ink/10 dark:bg-ink/10 dark:text-ink/80 dark:hover:bg-ink/20 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-primary/90 backdrop-blur-md border border-primary/50 text-white rounded-full hover:bg-primary-strong/90 text-sm font-semibold transition-colors shadow-lg"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
