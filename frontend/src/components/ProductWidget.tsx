import React, { useEffect, useRef, useState } from 'react';
import { Check, Link } from 'lucide-react';
import type { ProductWidgetData } from '../types/widgets';
import ebayLogo from '../assets/widget-shell/ebay-logo.png';
import ebayMask from '../assets/widget-shell/ebay-mask.svg';
import WidgetShell, { LogoBadge, ShellIconButton, ShellPill, Watermark } from './WidgetShell';
import { ON_PANEL, SHELL, widgetScale } from './widgetKit';

export interface ProductWidgetProps {
  data?: Partial<ProductWidgetData>;
  className?: string;
}

const DEFAULT_DATA: ProductWidgetData = {
  title: 'Rare SEIKO Type',
  description: '7559-6010 “The Light” Quartz Japanese Date-Day',
  price: '$280.00',
  brand: 'Seiko',
  model: 'Seiko Type II',
  url: '',
  imageUrl: '',
  date: '03 / 10 / 26',
};

// Figma product card (stormhacks-27, node 120:1121 "Group 54"), laid out 1x1 at 357px.
// All sizes scale with the widget's width (container query units).
const DESIGN_WIDTH = 357;
const { u, space, type } = widgetScale(DESIGN_WIDTH);

const COPIED_RESET_MS = 1600;

const isEbay = (url: string) => {
  try {
    return /(^|\.)ebay\./i.test(new URL(url).hostname);
  } catch {
    return false;
  }
};

export default function ProductWidget({ data, className = '' }: ProductWidgetProps) {
  const pick = <K extends keyof ProductWidgetData>(key: K) => data?.[key] || DEFAULT_DATA[key];
  const title = pick('title');
  const description = pick('description');
  const date = pick('date');
  const url = data?.url ?? '';
  const details = [
    ['Brand', pick('brand')],
    ['Price', pick('price')],
    ['Model', pick('model')],
  ] as const;

  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const handleCopyLink = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), COPIED_RESET_MS);
    } catch {
      setCopied(false);
    }
  };

  const footer = (
    <>
      <ShellIconButton
        designWidth={DESIGN_WIDTH}
        label={copied ? 'Link copied' : 'Copy product link'}
        onClick={handleCopyLink}
        disabled={!url}
      >
        {copied ? (
          <Check style={{ width: u(22), height: u(22) }} strokeWidth={2.4} />
        ) : (
          <Link style={{ width: u(22), height: u(22) }} strokeWidth={1.8} />
        )}
      </ShellIconButton>
      {isEbay(url) ? (
        <ShellPill
          designWidth={DESIGN_WIDTH}
          href={url}
          label="View listing on eBay"
          logo={
            <LogoBadge designWidth={DESIGN_WIDTH}>
              {/* Figma masks the logo with the badge circle, offset 1.43/7.14 of 44.26. */}
              <img
                src={ebayLogo}
                alt="eBay"
                className="absolute max-w-none object-cover pointer-events-none"
                style={{
                  left: u(SHELL.logo * (1.428 / 44.255)),
                  top: u(SHELL.logo * (7.138 / 44.255)),
                  width: u(SHELL.logo * (41.921 / 44.255)),
                  height: u(SHELL.logo * (31.021 / 44.255)),
                  maskImage: `url("${ebayMask}")`,
                  maskSize: `${u(SHELL.logo)} ${u(SHELL.logo)}`,
                  maskPosition: `${u(-SHELL.logo * (1.428 / 44.255))} ${u(-SHELL.logo * (7.138 / 44.255))}`,
                  maskRepeat: 'no-repeat',
                }}
              />
            </LogoBadge>
          }
        />
      ) : (
        <ShellPill designWidth={DESIGN_WIDTH} href={url} label="View product listing" text="View listing" />
      )}
    </>
  );

  return (
    <WidgetShell
      designWidth={DESIGN_WIDTH}
      accent="purple"
      className={className}
      watermark={<Watermark designWidth={DESIGN_WIDTH} glyph="$" />}
      footer={footer}
    >
      <div
        className="absolute flex flex-col items-start"
        style={{ left: u(SHELL.padX), right: u(SHELL.padX), top: u(SHELL.padY), bottom: u(SHELL.padX), gap: space(2) }}
      >
        <h2
          className={`font-bold ${ON_PANEL.primary} whitespace-nowrap overflow-hidden text-ellipsis max-w-full`}
          style={type('display')}
        >
          {title}
        </h2>
        <p className={`${ON_PANEL.primary} line-clamp-2`} style={type('lead')}>
          {description}
        </p>

        <dl
          className="flex flex-wrap items-baseline max-w-full"
          style={{ ...type('detail'), columnGap: space(2), rowGap: space(1), marginTop: space(1) }}
        >
          {details.map(([label, value]) => (
            <div key={label} className="flex items-baseline min-w-0" style={{ gap: space(1) }}>
              <dt className={`font-bold ${ON_PANEL.secondary}`}>{label}</dt>
              <dd className={`${ON_PANEL.primary} whitespace-nowrap overflow-hidden text-ellipsis`}>{value}</dd>
            </div>
          ))}
        </dl>

        <span className={`${ON_PANEL.faint} whitespace-nowrap`} style={type('caption')}>
          {date}
        </span>
      </div>
    </WidgetShell>
  );
}

export { ProductWidget };
