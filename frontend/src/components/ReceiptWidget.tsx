import React, { useEffect, useRef, useState } from 'react';
import { Check, Share } from 'lucide-react';
import { receiptTotals } from '../model';
import type { ReceiptWidgetData, WidgetDisplayProps } from '../types/widgets';
import WidgetShell, { ShellIconButton, Watermark } from './WidgetShell';
import { ON_PANEL, SHELL, widgetScale } from './widgetKit';

export interface ReceiptWidgetProps extends WidgetDisplayProps {
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

// Receipt on the solid-panel shell (Figma node 120:1121), 1x2 at 355 wide.
// All sizes scale with the widget's width (container query units).
const DESIGN_WIDTH = 355;
const { u, space, radius, type } = widgetScale(DESIGN_WIDTH);

// Compact (mobile Rolodex) variant: 1x1 square at the 1x1 design width.
const COMPACT_WIDTH = 357;
const compact = widgetScale(COMPACT_WIDTH);

// Scroll thumb: vertical pill, in design px.
const THUMB_LENGTH = 67.638;
const THUMB_WIDTH = 6.44171;
const TRACK_INSET = 25.77;

const COPIED_RESET_MS = 1600;

const DIVIDER = 'border-t border-white/30 shrink-0';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const formatMoney = (n: number) => money.format(n);

export default function ReceiptWidget({ data, className = '', isCompact = false }: ReceiptWidgetProps) {
  // Sample data only for previews (no data). Real items show their own values, even empty ones.
  const source = data ?? DEFAULT_DATA;
  const title = source.title ?? '';
  // Skip malformed entries (validation is soft; bad values are flagged, not dropped from storage).
  const items = (Array.isArray(source.items) ? source.items : []).filter(
    (item) => item && typeof item.name === 'string',
  );
  const taxRate = typeof source.taxRate === 'number' ? source.taxRate : 0;
  const { tax, total } = receiptTotals(items, taxRate);
  const date = source.date ?? '';

  const scrollRef = useRef<HTMLOListElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [trackLength, setTrackLength] = useState(0);
  const [overflowing, setOverflowing] = useState(false);
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
      setOverflowing(el.scrollHeight > el.clientHeight + 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    observer.observe(el);
    return () => observer.disconnect();
  }, [items.length]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setScrollProgress(max > 0 ? el.scrollTop / max : 0);
  };

  // ShellIconButton stops propagation, so sharing doesn't open the item editor.
  const handleShare = async () => {
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
  const smallStyle = type('detail');

  const footer = (
    <ShellIconButton
      designWidth={DESIGN_WIDTH}
      label={copied ? 'Receipt copied' : 'Share receipt'}
      onClick={handleShare}
    >
      {copied ? (
        <Check style={{ width: u(22), height: u(22) }} strokeWidth={2.4} />
      ) : (
        <Share style={{ width: u(21), height: u(21) }} strokeWidth={1.8} />
      )}
    </ShellIconButton>
  );

  if (isCompact) {
    // One-line title, line items (scroll + fade when they overflow), total. Tax row and empty date hidden.
    // Uses rootRef/scrollRef so the measuring effect above detects overflow here too.
    return (
      <div ref={rootRef} className={`w-full h-full aspect-square ${className}`}>
        <WidgetShell
          designWidth={COMPACT_WIDTH}
          accent="blue"
          watermark={<Watermark designWidth={COMPACT_WIDTH} glyph="%" />}
          footer={
            <ShellIconButton designWidth={COMPACT_WIDTH} label={copied ? 'Receipt copied' : 'Share receipt'} onClick={handleShare}>
              {copied ? (
                <Check style={{ width: compact.u(22), height: compact.u(22) }} strokeWidth={2.4} />
              ) : (
                <Share style={{ width: compact.u(21), height: compact.u(21) }} strokeWidth={1.8} />
              )}
            </ShellIconButton>
          }
        >
          <div
            className="absolute flex flex-col"
            style={{ left: compact.u(SHELL.padX), right: compact.u(SHELL.padX), top: compact.u(SHELL.padY), bottom: compact.u(SHELL.padX), gap: compact.space(3) }}
          >
            <div className="shrink-0">
              <h2 className={`font-bold ${ON_PANEL.primary} line-clamp-1`} style={compact.type('display')}>
                {title}
              </h2>
              {date && (
                <span className={`block ${ON_PANEL.faint} whitespace-nowrap`} style={compact.type('caption')}>
                  {date}
                </span>
              )}
            </div>

            {/* Receipt Well */}
            <div
              className={`flex-1 min-h-0 flex flex-col overflow-hidden ${ON_PANEL.well}`}
              style={{
                borderRadius: compact.radius('panel'),
                boxShadow: `inset 0 ${compact.u(3)} ${compact.u(3)} 0 rgb(var(--shadow) / 0.25)`,
              }}
            >
              <ol
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 min-h-0 overflow-y-auto flex flex-col [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                style={{
                  padding: `${compact.space(3)} ${compact.space(4)}`,
                  gap: compact.space(2),
                  maskImage:
                    overflowing && scrollProgress < 0.99
                      ? `linear-gradient(to bottom, black calc(100% - ${compact.space(6)}), transparent)`
                      : undefined,
                }}
              >
                {items.map((line, i) => (
                  <li key={line.id ?? i} className={`flex items-center shrink-0 ${ON_PANEL.primary}`} style={{ gap: compact.space(3) }}>
                    <span className="flex-1 min-w-0 whitespace-nowrap overflow-hidden text-ellipsis" style={compact.type('body')}>
                      {line.name}
                    </span>
                    <span className="shrink-0 whitespace-nowrap" style={compact.type('body')}>
                      {typeof line.price === 'number' ? formatMoney(line.price) : ''}
                    </span>
                  </li>
                ))}
              </ol>

              {/* Total */}
              <div className={DIVIDER} />
              <div
                className={`flex items-center justify-between shrink-0 ${ON_PANEL.primary}`}
                style={{ height: compact.u(46), paddingLeft: compact.space(4), paddingRight: compact.space(4) }}
              >
                <span className={`font-bold ${ON_PANEL.secondary}`} style={compact.type('detail')}>TOTAL</span>
                <span className="font-bold whitespace-nowrap" style={compact.type('title')}>{formatMoney(total)}</span>
              </div>
            </div>
          </div>
        </WidgetShell>
      </div>
    );
  }

  return (
    <div ref={rootRef} className={`w-full h-full ${className}`}>
      <WidgetShell
        designWidth={DESIGN_WIDTH}
        accent="blue"
        watermark={<Watermark designWidth={DESIGN_WIDTH} glyph="%" />}
        footer={footer}
      >
        <div
          className="absolute flex flex-col"
          style={{ left: u(SHELL.padX), right: u(SHELL.padX), top: u(SHELL.padY), bottom: u(SHELL.padX), gap: space(4) }}
        >
          <h2 className={`font-bold ${ON_PANEL.primary} line-clamp-2 shrink-0`} style={type('display')}>
            {title}
          </h2>

          {/* Receipt Well */}
          <div
            className={`relative flex-1 min-h-0 flex flex-col overflow-hidden ${ON_PANEL.well}`}
            style={{
              borderRadius: radius('panel'),
              boxShadow: `inset 0 ${u(3)} ${u(3)} 0 rgb(var(--shadow) / 0.25)`,
            }}
          >
            {/* Line items */}
            <div className="relative flex-1 min-h-0">
              <ol
                ref={scrollRef}
                onScroll={handleScroll}
                className="absolute inset-0 overflow-y-auto flex flex-col [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                // Row pitch snapped to whole px so every number circle lands on the same subpixel offset (else some blur).
                style={{ padding: `${space(3)} ${space(6)} ${space(3)} ${space(3)}`, gap: `round(${space(3)}, 1px)` }}
              >
                {items.map((line, i) => (
                  <li key={line.id ?? i} className={`flex items-center shrink-0 ${ON_PANEL.primary}`} style={{ gap: space(3) }}>
                    <span
                      className="relative shrink-0 flex items-center justify-center rounded-full bg-white/20"
                      style={{ width: `round(${u(28)}, 1px)`, height: `round(${u(28)}, 1px)` }}
                    >
                      <span className="relative" style={type('label', 'mono')}>
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

              {/* Scroll Thumb: only when the list overflows */}
              {overflowing && (
                <div
                  aria-hidden
                  className="absolute pointer-events-none rounded-full bg-white/60"
                  style={{
                    right: u(7),
                    width: u(THUMB_WIDTH),
                    height: u(THUMB_LENGTH),
                    top: `calc(${u(TRACK_INSET)} + ${scrollProgress * trackLength}px)`,
                  }}
                />
              )}
            </div>

            {/* Taxes */}
            {taxRate > 0 && (
              <>
                <div className={DIVIDER} />
                <div
                  className={`grid shrink-0 ${ON_PANEL.secondary}`}
                  style={{
                    gridTemplateColumns: `${u(150)} 1fr auto`,
                    padding: `${space(3)} ${space(6)} ${space(3)} ${space(4)}`,
                  }}
                >
                  <span className="font-bold" style={smallStyle}>TAX</span>
                  <span style={smallStyle}>{taxRate}%</span>
                  <span className="text-right" style={smallStyle}>{formatMoney(tax)}</span>
                </div>
              </>
            )}

            {/* Total */}
            <div className={DIVIDER} />
            <div
              className={`flex items-center justify-between shrink-0 ${ON_PANEL.primary}`}
              style={{ height: u(46), paddingLeft: space(4), paddingRight: space(6) }}
            >
              <span className={`font-bold ${ON_PANEL.secondary}`} style={smallStyle}>TOTAL</span>
              <span className="font-bold" style={type('title')}>{formatMoney(total)}</span>
            </div>
          </div>

          <span className={`${ON_PANEL.faint} whitespace-nowrap shrink-0`} style={type('caption')}>
            {date}
          </span>
        </div>
      </WidgetShell>
    </div>
  );
}

export { ReceiptWidget };
