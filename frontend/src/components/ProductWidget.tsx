import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, Link } from 'lucide-react';
import type { ProductWidgetData } from '../types/widgets';
import linkCircle from '../assets/product-widget/link-circle.svg';

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
const u = (px: number) => `calc(${px} * 100cqw / ${DESIGN_WIDTH})`;

// Figma draws the card flipped horizontally, which mirrors its 156.86deg gradient to 203.14deg.
const CARD_GRADIENT =
  'linear-gradient(203.14deg, rgba(255, 158, 240, 0.1) 11.72%, rgba(254, 34, 221, 0.02) 50.62%, rgba(255, 158, 240, 0.1) 89.51%)';
const TITLE_FONT = "'Alte Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const BODY_FONT = "Helvetica, 'Helvetica Neue', Arial, sans-serif";
const SF_FONT = "'SF Pro', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, sans-serif";
const GLASS_SHADOW = `${u(1.718)} ${u(0.859)} ${u(13.572)} 0 rgba(0, 0, 0, 0.07), inset ${u(-0.859)} 0 ${u(45.441)} ${u(11.91)} rgba(255, 255, 255, 0.52)`;

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
        className="relative w-full h-full overflow-hidden border-solid border-[#FFD7F9] select-none"
        style={{ backgroundImage: CARD_GRADIENT, borderWidth: u(0.916), borderRadius: u(27.484) }}
      >
        {/* Details */}
        <div
          className="absolute flex flex-col items-start"
          style={{ left: u(24), top: u(37), width: u(333), gap: u(14) }}
        >
          <h2
            className="font-bold text-[#DC8ACF] whitespace-nowrap overflow-hidden text-ellipsis max-w-full"
            style={{ fontFamily: TITLE_FONT, fontSize: u(20), lineHeight: u(24) }}
          >
            {title}
          </h2>
          <p
            className="text-[#DC8ACF] line-clamp-2"
            style={{ fontFamily: SF_FONT, fontSize: u(18.323), lineHeight: u(22), width: u(267.514) }}
          >
            {description}
          </p>

          <dl
            className="grid text-[#646464]"
            style={{
              fontFamily: BODY_FONT,
              fontSize: u(18.323),
              lineHeight: u(21),
              gridTemplateColumns: `${u(89.14)} 1fr`,
              rowGap: u(11),
              width: '100%',
            }}
          >
            {details.map(([label, value]) => (
              <React.Fragment key={label}>
                <dt className="font-bold">{label}</dt>
                <dd className="whitespace-nowrap overflow-hidden text-ellipsis">{value}</dd>
              </React.Fragment>
            ))}
          </dl>

          {/* Actions */}
          <div className="flex items-center" style={{ gap: u(15.61) }}>
            <button
              type="button"
              onClick={handleCopyLink}
              disabled={!url}
              aria-label={copied ? 'Link copied' : 'Copy product link'}
              className="relative shrink-0 flex items-center justify-center text-[#646464] cursor-pointer transition-transform active:scale-95 disabled:cursor-default disabled:opacity-60"
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
                <Check className="relative text-[#DC8ACF]" style={{ width: u(22), height: u(22) }} strokeWidth={2.4} />
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
              className={`flex items-center justify-between shrink-0 bg-[rgba(220,220,220,0.2)] text-[#646464] transition-all duration-200 ${
                url ? 'hover:bg-[rgba(220,220,220,0.35)] active:scale-95' : 'opacity-60 cursor-default'
              }`}
              style={{
                width: u(242.778),
                height: u(50.388),
                borderRadius: u(17.179),
                paddingLeft: u(23.82),
                paddingRight: u(20),
                boxShadow: GLASS_SHADOW,
              }}
            >
              <span className="whitespace-nowrap" style={{ fontFamily: SF_FONT, fontSize: u(18.323), lineHeight: u(22) }}>
                View Product Listing
              </span>
              <ArrowUpRight style={{ width: u(20), height: u(20) }} strokeWidth={1.8} />
            </a>
          </div>

          <span
            className="text-[#A2A2A2] whitespace-nowrap"
            style={{ fontFamily: BODY_FONT, fontSize: u(14.658), lineHeight: u(17) }}
          >
            {date}
          </span>
        </div>

        {/* Image */}
        <div
          className="absolute overflow-hidden bg-[#D9D9D9] flex items-center justify-center"
          style={{ left: u(377), top: u(18), right: u(21), bottom: u(24), borderRadius: u(16.491) }}
        >
          {showImage ? (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <span className="text-[#646464]" style={{ fontFamily: BODY_FONT, fontSize: u(18.323) }}>
              IMAGE
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export { ProductWidget };
