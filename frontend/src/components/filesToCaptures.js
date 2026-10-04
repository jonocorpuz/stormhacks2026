import { createCapture } from '../model';

// File → base64 (no data-URL prefix).
const readBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

// Dropped or picked files → image captures. Unsupported types are flagged by the store, not here.
export const filesToCaptures = (files) =>
  Promise.all([...files].map(async (f) => createCapture('image', f.type, await readBase64(f), f.name)));
