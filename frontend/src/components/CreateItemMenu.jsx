import React, { useLayoutEffect, useRef, useState } from 'react';
import { PRIMITIVES, getPrimitive, validateFields } from '../model';
import { useActions } from '../store';
import PrimitiveForm from './forms/PrimitiveForm';
import { useExiting } from './useExiting';

// Gap kept between the menu's bottom edge and the viewport.
const VIEWPORT_MARGIN = 16;

// "+ New" dropdown. Primitive pills + form come straight from model PRIMITIVES.
// photoPicker (mobile, where there's no drag-and-drop): photo library / camera upload above the form.
export default function CreateItemMenu({ isOpen, onClose, photoPicker = false }) {
  const { createItem, ingestCaptures } = useActions();
  const fileRef = useRef(null);
  const [primitiveId, setPrimitiveId] = useState(PRIMITIVES[0].id);
  const [values, setValues] = useState({});
  const menuRef = useRef(null);
  const [maxHeight, setMaxHeight] = useState();
  const [shown, closing] = useExiting(isOpen || null);

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

  if (!shown) return null;

  const primitive = getPrimitive(primitiveId);
  // Shown as flags only; creation is never blocked. Orphans can't happen from this form.
  const issues = validateFields(values, primitive);

  const handleCreate = async () => {
    // Save failure is shown by SaveStatus; the change stays in state and persists on the next save.
    await createItem(primitiveId, values).catch(() => {});
    setValues({});
    onClose();
  };

  // Same path as a desktop drop: extraction runs in the background, progress in ExtractionStatus.
  const handlePhotos = async (e) => {
    const files = [...e.target.files];
    e.target.value = ''; // picking the same photo again still fires change
    if (!files.length) return;
    onClose();
    ingestCaptures(await filesToCaptures(files));
  };

  return (
    <div
      ref={menuRef}
      className={`absolute top-full mt-4 left-0 w-80 p-5 apple-glass rounded-sheet origin-top menu-pop ${closing ? 'is-closing' : ''} z-50 flex flex-col space-y-5 overflow-y-auto overscroll-contain`}
      style={{ maxHeight }}
    >
      <h3 className="text-ink font-bold text-sm px-1">New</h3>

      {photoPicker && (
        <>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary/90 backdrop-blur-md border border-primary/50 text-white rounded-full hover:bg-primary-strong/90 text-sm font-semibold transition-colors shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21" /></svg>
            Add from Photos
          </button>
          {/* image/* opens the iOS/Android photo sheet (library, camera, files); iOS hands HEIC over as JPEG. */}
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handlePhotos} />
          <div className="flex items-center gap-3 text-xs text-ink/50 px-1">
            <span className="flex-1 border-t border-ink/10" />
            or enter manually
            <span className="flex-1 border-t border-ink/10" />
          </div>
        </>
      )}

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
                : 'bg-ink/5 text-ink/85 dark:text-ink/70 hover:bg-ink/10 hover:text-ink dark:bg-ink/10 dark:hover:bg-ink/20'
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
