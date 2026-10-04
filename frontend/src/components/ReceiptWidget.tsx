import React, { useEffect, useRef, useState } from 'react';
import { Check, Share } from 'lucide-react';
import { receiptTotals } from '../model';
import type { ReceiptWidgetData } from '../types/widgets';
import { GLASS_CONTROL, GLASS_CONTROL_HOVER, accentGradient, widgetScale } from './widgetKit';

import scrollThumb from '../assets/receipt-widget/scroll-thumb.svg';
import divider from '../assets/receipt-widget/divider.svg';

export interface ReceiptWidgetProps {
  data?: Partial<ReceiptWidgetData>;
  className?: string;
}

const DEFAULT_DATA: ReceiptWidgetData = {
  title: 'Mcdonald’s Receipt',
  items: [
    { id: 'sample-1', name: 'Hamburger', price: 5 },
    { id: 'sample-2', name: 'Sm Coca Cola', price: 10 },
    { id: 'sample-3', name: 'L Fries', price: 5 },
    { id: 'sample-4', name: 'L Poutine', price: 5 },
    { id: 'sample-5', name: 'M Sprite', price: 5 },
    { id: 'sample-6', name: 'L Fries', price: 20 },
  ],
  taxRate: 12,
  date: '02/20/2027',
};

// Figma receipt (stormhacks-27, "MacBook Pro 14" - 8", node 76:663 "Frame 10"),
// designed at 355x734. All sizes scale with the widget's width (container query units)
// so it keeps the design's proportions in a 1x2 bento cell.
const DESIGN_WIDTH = 355;
const { u, space, radius, type, glassShadow, insetShadow, cardInset } = widgetScale(DESIGN_WIDTH);

const CARD_GRADIENT = accentGradient('blue', 118.76);
const PANEL_GRADIENT = accentGradient('blue', 122.32);

// Scroll thumb asset is 67.638 x 6.44 horizontal; rotated to vertical.
const THUMB_LENGTH = 67.638;
const THUMB_WIDTH = 6.44171;
const TRACK_INSET = 25.77;

const COPIED_RESET_MS = 1600;

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const formatMoney = (n: number) => money.format(n);

export default function ReceiptWidget({ data, className = '' }: ReceiptWidgetProps) {
  // Fall back to the design sample only when the whole receipt is empty, so a real receipt
  // without a tax rate doesn't inherit the sample's 12%.
  const isEmpty = !data?.title && !data?.items?.length && data?.taxRate === undefined;
  const source = isEmpty ? DEFAULT_DATA : data;
  const title = source?.title || DEFAULT_DATA.title;
  // Skip malformed entries (validation is soft; bad values are flagged, not dropped from storage).
  const items = (Array.isArray(source?.items) ? source.items : []).filter(
    (item) => item && typeof item.name === 'string',
  );
  const taxRate = typeof source?.taxRate === 'number' ? source.taxRate : 0;
  const { tax, total } = receiptTotals(items, taxRate);
  const date = data?.date || DEFAULT_DATA.date;

  const scrollRef = useRef<HTMLOListElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [trackLength, setTrackLength] = useState(0);
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(resetTimer.current), []);

  useEffect(() => {
    const root = rootRef.current;
    const el = scrollRef.current;
    if (!root || !el) return;
    const measure = () => {
      const scale = root.clientWidth / DESIGN_WIDTH;
      setTrackLength(Math.max(0, el.clientHeight - (TRACK_INSET * 2 + THUMB_LENGTH) * scale));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setScrollProgress(max > 0 ? el.scrollTop / max : 0);
  };

  // Cards open the item editor on click; sharing shouldn't.
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = [
      title,
      ...items.map((item) => `${item.name} ${typeof item.price === 'number' ? formatMoney(item.price) : ''}`.trim()),
      taxRate > 0 && `Tax (${taxRate}%) ${formatMoney(tax)}`,
      `Total ${formatMoney(total)}`,
      date,
    ]
      .filter(Boolean)
      .join('\n');
    try {
      if (navigator.share) {
        await navigator.share({ title, text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
      clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), COPIED_RESET_MS);
    } catch {
      // Share sheet dismissed or clipboard blocked: nothing to do.
    }
  };

  const textStyle = type('body');
  const smallStyle = type('caption');
  const dividerImg = (
    <img src={divider} alt="" width={321} height={1} className="block max-w-none shrink-0" style={{ width: u(321), height: u(1), marginLeft: u(-0.5) }} />
  );

  return (
    <div ref={rootRef} className={`w-full h-full [container-type:inline-size] ${className}`}>
      <div
        className="relative w-full h-full flex flex-col overflow-hidden border border-accent-blue-edge select-none"
        style={{
          backgroundImage: CARD_GRADIENT,
          borderRadius: radius('card'),
          paddingTop: cardInset,
          paddingLeft: space(4),
          paddingRight: space(4),
          paddingBottom: cardInset,
        }}
      >
        {/* Header */}
        <h2
          className="font-bold text-accent-blue whitespace-nowrap overflow-hidden text-ellipsis shrink-0"
          style={type('title')}
        >
          {title}
        </h2>

        {/* Receipt Panel */}
        <div
          className="relative flex-1 min-h-0 flex flex-col overflow-hidden border border-accent-blue-edge"
          style={{
            marginTop: space(5),
            borderRadius: radius('panel'),
            backgroundImage: PANEL_GRADIENT,
            boxShadow: insetShadow,
          }}
        >
          {/* Line items */}
          <div className="relative flex-1 min-h-0">
            <ol
              ref={scrollRef}
              onScroll={handleScroll}
              className="absolute inset-0 overflow-y-auto flex flex-col [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{ padding: `${space(3)} ${space(8)} ${space(3)} ${space(6)}`, gap: space(4) }}
            >
              {items.map((line, i) => (
                <li key={line.id ?? i} className="flex items-center shrink-0 text-ink-muted" style={{ gap: space(3) }}>
                  <span className="relative shrink-0 flex items-center justify-center" style={{ width: u(31.403), height: u(31.403) }}>
                    <div
                      className="absolute inset-0 rounded-full bg-control/20 dark:bg-ink/10"
                      style={{
                        boxShadow: `${u(1.07)} ${u(0.53)} ${u(4.23)} 0 rgb(var(--shadow) / 0.07), inset ${u(-0.53)} 0 ${u(14.16)} ${u(7.42)} rgb(var(--glow) / 0.52)`
                      }}
                    />
                    <span className="relative" style={type('body', 'mono')}>
                      {i + 1}
                    </span>
                  </span>
                  <span className="flex-1 min-w-0 whitespace-nowrap overflow-hidden text-ellipsis" style={textStyle}>
                    {line.name}
                  </span>
                  <span className="shrink-0 whitespace-nowrap" style={textStyle}>
                    {typeof line.price === 'number' ? formatMoney(line.price) : ''}
                  </span>
                </li>
              ))}
            </ol>

            {/* Scroll Thumb */}
            <div
              aria-hidden
              className="absolute pointer-events-none"
              style={{
                right: u(9.19),
                width: u(THUMB_WIDTH),
                height: u(THUMB_LENGTH),
                top: `calc(${u(TRACK_INSET)} + ${scrollProgress * trackLength}px)`,
              }}
            >
              <img
                src={scrollThumb}
                alt=""
                width={THUMB_LENGTH}
                height={THUMB_WIDTH}
                className="absolute block max-w-none left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90"
                style={{ width: u(THUMB_LENGTH), height: u(THUMB_WIDTH) }}
              />
            </div>
          </div>

          {/* Taxes */}
          {taxRate > 0 && (
            <>
              {dividerImg}
              <div
                className="grid shrink-0 text-ink-muted"
                style={{
                  gridTemplateColumns: `${u(159)} 1fr auto`,
                  rowGap: space(4),
                  padding: `${space(4)} ${space(8)} ${space(6)} ${space(6)}`,
                }}
              >
                <span style={smallStyle}>TAX</span>
                <span style={smallStyle}>{taxRate}%</span>
                <span className="text-right" style={smallStyle}>{formatMoney(tax)}</span>
              </div>
            </>
          )}

          {/* Total */}
          {dividerImg}
          <div
            className="flex items-center justify-between shrink-0 text-ink-muted"
            style={{ height: u(49), paddingLeft: space(6), paddingRight: space(8) }}
          >
            <span style={smallStyle}>TOTAL</span>
            <span style={textStyle}>{formatMoney(total)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between shrink-0" style={{ marginTop: space(5) }}>
          <span className="text-ink-subtle whitespace-nowrap" style={type('body')}>
            {date}
          </span>

          <button
            type="button"
            onClick={handleShare}
            aria-label={copied ? 'Receipt copied' : 'Share receipt'}
            className={`flex items-center justify-center shrink-0 ${GLASS_CONTROL} ${GLASS_CONTROL_HOVER} text-control-ink transition-all duration-200`}
            style={{
              width: u(49.923),
              height: u(44.287),
              borderRadius: radius('control'),
              boxShadow: glassShadow,
            }}
          >
            {copied ? (
              <Check className="text-accent-blue" style={{ width: u(20), height: u(20) }} strokeWidth={2.4} />
            ) : (
              <Share style={{ width: u(20), height: u(20) }} strokeWidth={2} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export { ReceiptWidget };
