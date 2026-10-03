import React, { useState } from 'react';
import { PRIMITIVES, getPrimitive, validateFields } from '../model';
import { useActions } from '../store';
import PrimitiveForm from './forms/PrimitiveForm';

// "+ New" dropdown. Primitive pills + form come straight from model PRIMITIVES.
export default function CreateItemMenu({ isOpen, onClose }) {
  const { createItem } = useActions();
  const [primitiveId, setPrimitiveId] = useState(PRIMITIVES[0].id);
  const [values, setValues] = useState({});

  if (!isOpen) return null;

  const primitive = getPrimitive(primitiveId);
  // Shown as flags only; creation is never blocked. Orphans can't happen from this form.
  const issues = validateFields(values, primitive);

  const handleCreate = async () => {
    await createItem(primitiveId, values);
    setValues({});
    onClose();
  };

  return (
    <div className="absolute top-full mt-4 left-0 w-80 p-5 apple-glass rounded-3xl origin-top animate-slide-down-fade z-50 flex flex-col space-y-5">
      <h3 className="text-black dark:text-white font-bold text-sm px-1">New</h3>

      <div className="flex flex-wrap gap-2">
        {PRIMITIVES.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setPrimitiveId(p.id);
              setValues({});
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              primitiveId === p.id
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-black/5 text-black/70 hover:bg-black/10 hover:text-black dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20 dark:hover:text-white'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      <PrimitiveForm primitive={primitive} values={values} onChange={setValues} issues={issues} />

      <button
        onClick={handleCreate}
        className="w-full py-2.5 bg-blue-500/90 backdrop-blur-md border border-blue-400/50 text-white rounded-full hover:bg-blue-600/90 text-sm font-semibold transition-colors shadow-lg mt-2"
      >
        Create {primitive.name}
      </button>
    </div>
  );
}
