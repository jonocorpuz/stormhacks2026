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
    <div className="absolute top-full mt-4 left-0 w-80 p-5 apple-glass rounded-sheet origin-top animate-slide-down-fade z-50 flex flex-col space-y-5">
      <h3 className="text-ink font-bold text-sm px-1">New</h3>

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
                ? 'bg-primary text-white shadow-md'
                : 'bg-ink/5 text-ink/70 hover:bg-ink/10 hover:text-ink dark:bg-ink/10 dark:hover:bg-ink/20'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      <PrimitiveForm primitive={primitive} values={values} onChange={setValues} issues={issues} />

      <button
        onClick={handleCreate}
        className="w-full py-2.5 bg-primary/90 backdrop-blur-md border border-primary/50 text-white rounded-full hover:bg-primary-strong/90 text-sm font-semibold transition-colors shadow-lg mt-2"
      >
        Create {primitive.name}
      </button>
    </div>
  );
}
