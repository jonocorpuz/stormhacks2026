// Design tokens for the Figma-ported widgets. Each widget is drawn at a fixed design width and
// scales with its container (cqw), so sizes here are design px, converted by `widgetScale`.
// Colors come from the CSS variables in index.css, so everything follows the theme.

// Alte Haas everywhere; mono only for code and figures.
export const FONT = {
  sans: "'Alte Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
} as const;

// [font-size, line-height]
export const TYPE = {
  caption: [12, 14],
  label: [14, 17],
  body: [16, 19],
  title: [20, 24],
} as const;

export const RADIUS = {
  control: 16,
  panel: 20,
  card: 28,
} as const;

// Spacing is a 4px grid: space(4) = 16 design px, like Tailwind's p-4.
const SPACE_UNIT = 4;
const CARD_INSET = 28;
export type SpaceStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 12 | 14 | 16;

export type Accent = 'blue' | 'green' | 'coral' | 'pink';
export type Font = keyof typeof FONT;
export type TypeSize = keyof typeof TYPE;

// Accent wash for cards and panels: 10% → 2% → 10%.
export const accentGradient = (accent: Accent, angle: number) => {
  const tint = (alpha: number) => `rgb(var(--${accent}-tint) / ${alpha})`;
  return `linear-gradient(${angle}deg, ${tint(0.1)} 11.72%, ${tint(0.02)} 50.62%, ${tint(0.1)} 89.51%)`;
};

// Frosted control (copy / share / edit buttons). Pair with `glassShadow` from widgetScale.
export const GLASS_CONTROL = 'bg-control/20';
export const GLASS_CONTROL_HOVER = 'cursor-pointer hover:bg-control/35 active:scale-95';

export function widgetScale(designWidth: number) {
  const u = (px: number) => `calc(${px} * 100cqw / ${designWidth})`;
  return {
    // Raw geometry (positions, fixed element sizes). Use space/radius/type for everything else.
    u,
    space: (step: SpaceStep) => u(step * SPACE_UNIT),
    radius: (r: keyof typeof RADIUS) => u(RADIUS[r]),
    // Top/bottom padding of every widget card.
    cardInset: u(CARD_INSET),
    type: (size: TypeSize, font: Font = 'sans') => ({
      fontFamily: FONT[font],
      fontSize: u(TYPE[size][0]),
      lineHeight: u(TYPE[size][1]),
    }),
    glassShadow: `${u(1.6)} ${u(0.8)} ${u(12.8)} 0 rgb(var(--shadow) / 0.07), inset ${u(-0.8)} 0 ${u(42.6)} ${u(11.2)} rgb(var(--glow) / 0.52)`,
    insetShadow: `inset ${u(4)} ${u(4)} ${u(24)} 0 rgb(var(--haze) / 0.11)`,
  };
}
