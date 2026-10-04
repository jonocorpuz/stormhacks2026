import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, Link } from 'lucide-react';
import type { ProductWidgetData } from '../types/widgets';
import linkCircle from '../assets/product-widget/link-circle.svg';
import { GLASS_CONTROL, GLASS_CONTROL_HOVER, accentGradient, widgetScale } from './widgetKit';

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

// Figma product card (stormhacks-27, "MacBook Pro 14" - 8", node 55:429 "Frame 2"),
// designed at 732x355. All sizes scale with the widget's width (container query units)
// so it keeps the design's proportions in a 2x1 bento cell.
const DESIGN_WIDTH = 732;
const { u, space, radius, type, glassShadow, cardInset } = widgetScale(DESIGN_WIDTH);

// Figma draws the card flipped horizontally, which mirrors its 156.86deg gradient to 203.14deg.
const CARD_GRADIENT = accentGradient('pink', 203.14);

const COPIED_RESET_MS = 1600;

export default function ProductWidget({ data, className = '' }: ProductWidgetProps) {
  const pick = <K extends keyof ProductWidgetData>(key: K) => data?.[key] || DEFAULT_DATA[key];
  const title = pick('title');
  const description = pick('description');
  const date = pick('date');
  const url = data?.url ?? '';
  const imageUrl = data?.imageUrl ?? '';
  const details = [
    ['Price', pick('price')],
    ['Brand', pick('brand')],
    ['Model', pick('model')],
  ] as const;

  const [copied, setCopied] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(resetTimer.current), []);

  // Cards open the item editor on click; these buttons shouldn't.
  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const showImage = imageUrl && !imageFailed;

  return (
    <div className={`w-full h-full [container-type:inline-size] ${className}`}>
      <div
        className="relative w-full h-full overflow-hidden border-solid border-accent-pink-edge select-none"
        style={{ backgroundImage: CARD_GRADIENT, borderWidth: u(0.916), borderRadius: radius('card') }}
      >
        {/* Details */}
        <div
          className="absolute flex flex-col items-start"
          style={{ left: space(6), top: cardInset, width: u(333), gap: space(4) }}
        >
          <h2
            className="font-bold text-accent-pink whitespace-nowrap overflow-hidden text-ellipsis max-w-full"
            style={type('title')}
          >
            {title}
          </h2>
          <p
            className="text-accent-pink line-clamp-2"
            style={{ ...type('body'), width: u(267.514) }}
          >
            {description}
          </p>

          <dl
            className="grid text-ink-muted"
            style={{
              ...type('body'),
              gridTemplateColumns: `${u(89.14)} 1fr`,
              rowGap: space(3),
              width: '100%',
            }}
          >
            {details.map(([label, value]) => (
              <React.Fragment key={label}>
                <dt className="font-bold dark:text-ink-subtle">{label}</dt>
                <dd className="whitespace-nowrap overflow-hidden text-ellipsis">{value}</dd>
              </React.Fragment>
            ))}
          </dl>

          {/* Actions */}
          <div className="flex items-center" style={{ gap: space(4) }}>
            <button
              type="button"
              onClick={handleCopyLink}
              disabled={!url}
              aria-label={copied ? 'Link copied' : 'Copy product link'}
              className="relative shrink-0 flex items-center justify-center text-control-ink cursor-pointer transition-transform active:scale-95 disabled:cursor-default disabled:opacity-60"
              style={{ width: u(50.388), height: u(50.388) }}
            >
              <img
                src={linkCircle}
                alt=""
                width={77.5314}
                height={77.5313}
                className="absolute block max-w-none pointer-events-none"
                style={{ left: u(-11.85), top: u(-12.71), width: u(77.5314), height: u(77.5313) }}
              />
              {copied ? (
                <Check className="relative text-accent-pink" style={{ width: u(22), height: u(22) }} strokeWidth={2.4} />
              ) : (
                <Link className="relative" style={{ width: u(22), height: u(22) }} strokeWidth={1.8} />
              )}
            </button>

            <a
              href={url || undefined}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                if (!url) e.preventDefault();
              }}
              aria-disabled={!url}
              className={`flex items-center justify-between shrink-0 ${GLASS_CONTROL} text-control-ink transition-all duration-200 ${
                url ? GLASS_CONTROL_HOVER : 'opacity-60 dark:opacity-80 cursor-default'
              }`}
              style={{
                width: u(242.778),
                height: u(50.388),
                borderRadius: radius('control'),
                paddingLeft: space(6),
                paddingRight: space(5),
                boxShadow: glassShadow,
              }}
            >
              <span className="whitespace-nowrap" style={type('body')}>
                View Product Listing
              </span>
              <ArrowUpRight style={{ width: u(20), height: u(20) }} strokeWidth={1.8} />
            </a>
          </div>

          <span
            className="text-ink-subtle whitespace-nowrap"
            style={type('body')}
          >
            {date}
          </span>
        </div>

        {/* Image */}
        <div
          className="absolute overflow-hidden bg-sunken flex items-center justify-center"
          style={{ left: u(377), top: cardInset, right: u(21), bottom: cardInset, borderRadius: radius('control') }}
        >
          {showImage ? (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <span className="text-ink-subtle" style={type('body')}>
              IMAGE
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export { ProductWidget };
