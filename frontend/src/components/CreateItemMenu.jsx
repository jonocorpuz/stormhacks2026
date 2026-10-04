import React, { useLayoutEffect, useRef, useState } from 'react';
import { PRIMITIVES, getPrimitive, validateFields } from '../model';
import { useActions } from '../store';
import PrimitiveForm from './forms/PrimitiveForm';

// Gap kept between the menu's bottom edge and the viewport.
const VIEWPORT_MARGIN = 16;

// "+ New" dropdown. Primitive pills + form come straight from model PRIMITIVES.
export default function CreateItemMenu({ isOpen, onClose }) {
  const { createItem } = useActions();
  const [primitiveId, setPrimitiveId] = useState(PRIMITIVES[0].id);
  const [values, setValues] = useState({});
  const menuRef = useRef(null);
  const [maxHeight, setMaxHeight] = useState();

  // Cap height to the space below the menu's top so tall forms scroll instead of overflowing.
  useLayoutEffect(() => {
    if (!isOpen) return;
    const fit = () => {
      // Layout position (offsetTop), not the rect: the open animation shifts the rect mid-transform.
      const menu = menuRef.current;
      if (!menu?.offsetParent) return;
      const top = menu.offsetParent.getBoundingClientRect().top + menu.offsetTop;
      setMaxHeight(window.innerHeight - top - VIEWPORT_MARGIN);
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [isOpen]);

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
    <div
      ref={menuRef}
      className="absolute top-full mt-4 left-0 w-80 p-5 apple-glass rounded-sheet origin-top animate-slide-down-fade z-50 flex flex-col space-y-5 overflow-y-auto overscroll-contain"
      style={{ maxHeight }}
    >
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
