import { describe, expect, it } from 'vitest';

// Colors come from design tokens (index.css → tailwind.config.js / widgetKit.ts), never literals.
const sources = import.meta.glob(['./**/*.{js,jsx,ts,tsx}', '../App.jsx', '!./**/*.test.*'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const HARDCODED_COLOR = /#[0-9a-f]{3,8}\b|rgba?\(\s*\d/i;

describe('design tokens', () => {
  it('scans the components', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(10);
  });

  it.each(Object.entries(sources))('%s has no hardcoded colors', (_path, source) => {
    const hits = source.split('\n').filter((line) => HARDCODED_COLOR.test(line));
    expect(hits).toEqual([]);
  });
});
