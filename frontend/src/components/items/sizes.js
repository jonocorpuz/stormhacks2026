// Bento card sizes. Presentation only: stored in board.view.sizes[itemId], never on items.
// Class strings must stay literal so Tailwind picks them up.
export const SIZE_CLASSES = {
  '1x1': 'md:col-span-1 md:row-span-1',
  '2x1': 'md:col-span-2 lg:col-span-2 md:row-span-1',
  '1x2': 'md:col-span-1 md:row-span-2',
  '2x2': 'md:col-span-2 lg:col-span-2 md:row-span-2',
  '3x1': 'md:col-span-2 lg:col-span-3 md:row-span-1',
};

export const DEFAULT_SIZE = '1x1';

// Primitives whose card only works at one size. Overrides board.view.sizes; not resizable.
export const FIXED_SIZES = {
  code_snippet: '2x2',
  map_location: '1x1',
  note: '1x1',
};

const ORDER = Object.keys(SIZE_CLASSES);

export function nextSize(size) {
  return ORDER[(ORDER.indexOf(size) + 1) % ORDER.length];
}
