// Design tokens for the Figma-ported widgets. Each widget is drawn at a fixed design width and
// scales with its container (cqw), so sizes here are design px, converted by `widgetScale`.
// Colors come from the CSS variables in index.css. Shell follows the theme; accent panels don't.

// Alte Haas everywhere; mono only for code and figures.
export const FONT = {
  sans: "'Alte Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
} as const;

// [font-size, line-height]
export const TYPE = {
  caption: [12, 14],
  detail: [13, 16],
  label: [14, 17],
  body: [16, 19],
  title: [20, 24],
  lead: [24, 28],
  display: [34, 38],
} as const;

export const RADIUS = {
  control: 16,
  panel: 20,
  card: 28,
} as const;

// Spacing is a 4px grid: space(4) = 16 design px, like Tailwind's p-4.
const SPACE_UNIT = 4;
export type SpaceStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 12 | 14 | 16;

export type Accent = 'blue' | 'green' | 'coral' | 'pink';
export type Font = keyof typeof FONT;
export type TypeSize = keyof typeof TYPE;

// Widget shell (WidgetShell.tsx), in 1x1 design px: Figma's 773x486 card scaled by ~0.73.
export const SHELL = {
  radius: 25,
  // Figma's bottom-right corner is tighter than the rest.
  cornerRadius: 7,
  shadowX: 8,
  shadowY: 12,
  inset: 14,
  panelRadius: 20,
  // Panel → footer gap, also the gap between footer controls.
  footerGap: 10,
  footerBottom: 16,
  control: 50,
  pillMinWidth: 88,
  logo: 32,
  // Panel content padding.
  padX: 18,
  padY: 24,
} as const;

// Solid accent panels. Literal class names so Tailwind picks them up.
export const SOLID_PANEL: Record<Accent, string> = {
  blue: 'bg-accent-blue-solid',
  green: 'bg-accent-green-solid',
  coral: 'bg-accent-coral-solid',
  pink: 'bg-accent-pink-solid',
};

// Text on solid panels: white in both themes (panels don't follow the theme).
export const ON_PANEL = {
  primary: 'text-white',
  secondary: 'text-white/75',
  faint: 'text-white/55',
  // Nested well (list area, receipt items, code block).
  well: 'bg-black/20',
} as const;

export function widgetScale(designWidth: number) {
  const u = (px: number) => `calc(${px} * 100cqw / ${designWidth})`;
  return {
    // Raw geometry (positions, fixed element sizes). Use space/radius/type for everything else.
    u,
    space: (step: SpaceStep) => u(step * SPACE_UNIT),
    radius: (r: keyof typeof RADIUS) => u(RADIUS[r]),
    type: (size: TypeSize, font: Font = 'sans') => ({
      fontFamily: FONT[font],
      fontSize: u(TYPE[size][0]),
      lineHeight: u(TYPE[size][1]),
    }),
    insetShadow: `inset ${u(4)} ${u(4)} ${u(24)} 0 rgb(var(--haze) / 0.11)`,
  };
}
