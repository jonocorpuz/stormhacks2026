import { describe, expect, it } from 'vitest';
import { toListEntries } from './listEntries';

describe('toListEntries', () => {
  it('keeps valid entries as-is', () => {
    const items = [{ id: 'a', title: 'Milk', isChecked: true }];
    expect(toListEntries(items)).toEqual(items);
  });

  it('turns bare strings into entries instead of character-indexed objects', () => {
    expect(toListEntries(['Tacos', 'Ramen'])).toEqual([
      { id: 'entry-0', title: 'Tacos', isChecked: false },
      { id: 'entry-1', title: 'Ramen', isChecked: false },
    ]);
  });

  it('handles JSON strings, plain strings and junk', () => {
    expect(toListEntries('["Tacos"]')).toEqual([{ id: 'entry-0', title: 'Tacos', isChecked: false }]);
    expect(toListEntries('"Tacos"')).toEqual([]); // JSON of a non-array
    expect(toListEntries('Tacos\nRamen').map((e) => e.title)).toEqual(['Tacos', 'Ramen']);
    expect(toListEntries({ 0: 'T', 1: 'a' })).toEqual([]);
    expect(toListEntries(undefined)).toEqual([]);
    expect(toListEntries([null, 3, { name: 'Gyoza' }]).map((e) => e.title)).toEqual(['3', 'Gyoza']);
  });

  it('gives the same ids on every call so toggles match', () => {
    expect(toListEntries(['x'])[0].id).toBe(toListEntries(['x'])[0].id);
  });
});
