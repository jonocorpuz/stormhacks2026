import React, { useEffect, useRef, useState } from 'react';
import { Check, Share } from 'lucide-react';
import type { ReceiptWidgetData } from '../types/widgets';
import itemCircle from '../assets/receipt-widget/item-circle.svg';
import scrollThumb from '../assets/receipt-widget/scroll-thumb.svg';
import divider from '../assets/receipt-widget/divider.svg';

export interface ReceiptWidgetProps {
  data?: Partial<ReceiptWidgetData>;
  className?: string;
}

const DEFAULT_DATA: ReceiptWidgetData = {
  title: 'Mcdonald’s Receipt',
  items: 'Hamburger $5.00\nSm Coca Cola $10.00\nL Fries $5.00\nL Poutine $5.00\nM Sprite $5.00\nL Fries $20.00',
  taxes: 'GST\nPST',
  total: '$307.00',
  date: '02/20/2027',
};

// Figma receipt (stormhacks-27, "MacBook Pro 14" - 8", node 76:663 "Frame 10"),
// designed at 355x734. All sizes scale with the widget's width (container query units)
// so it keeps the design's proportions in a 1x2 bento cell.
const DESIGN_WIDTH = 355;
const u = (px: number) => `calc(${px} * 100cqw / ${DESIGN_WIDTH})`;

const CARD_GRADIENT =
  'linear-gradient(118.76deg, rgba(34, 148, 254, 0.1) 11.72%, rgba(225, 235, 244, 0.1) 50.62%, rgba(34, 148, 254, 0.1) 89.51%)';
const PANEL_GRADIENT =
  'linear-gradient(122.32deg, rgba(34, 148, 254, 0.1) 11.72%, rgba(225, 235, 244, 0.1) 50.62%, rgba(34, 148, 254, 0.1) 89.51%)';
const TITLE_FONT = "'Alte Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const BODY_FONT = "Helvetica, 'Helvetica Neue', Arial, sans-serif";
const SF_FONT = "'SF Pro', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, sans-serif";
const MONO_FONT = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

// Scroll thumb asset is 67.638 x 6.44 horizontal; rotated to vertical.
const THUMB_LENGTH = 67.638;
const THUMB_WIDTH = 6.44171;
const TRACK_INSET = 25.77;

const COPIED_RESET_MS = 1600;

interface Line {
  name: string;
  amount: string;
}

// "Hamburger $5.00", "Hamburger - 5.00", "GST: $1.50" -> { name, amount }. No trailing amount -> name only.
const AMOUNT_AT_END = /^(.*?)\s*[-–—:]?\s*([$€£¥]?\s?-?\d[\d,]*(?:\.\d{1,2})?)\s*$/;
function parseLines(text: string): Line[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(AMOUNT_AT_END);
      return match && match[1] ? { name: match[1], amount: match[2] } : { name: line, amount: '' };
    });
}

export default function ReceiptWidget({ data, className = '' }: ReceiptWidgetProps) {
  // Fall back to the design sample only when the whole receipt is empty, so a real receipt
  // without taxes doesn't inherit the sample GST/PST rows.
  const isEmpty = !data?.title && !data?.items && !data?.taxes && !data?.total;
  const source = isEmpty ? DEFAULT_DATA : { ...DEFAULT_DATA, items: '', taxes: '', total: '', ...data };
  const title = source.title || DEFAULT_DATA.title;
  const items = parseLines(source.items ?? '');
  const taxes = parseLines(source.taxes ?? '');
  const total = source.total ?? '';
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
      ...items.map((l) => [l.name, l.amount].filter(Boolean).join(' ')),
      ...taxes.filter((l) => l.amount).map((l) => `${l.name} ${l.amount}`),
      total && `Total ${total}`,
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

  const textStyle = { fontFamily: SF_FONT, fontSize: u(16.104), lineHeight: u(19) };
  const smallStyle = { fontFamily: SF_FONT, fontSize: u(12), lineHeight: u(14) };
  const dividerImg = (
    <img src={divider} alt="" width={321} height={1} className="block max-w-none shrink-0" style={{ width: u(321), height: u(1), marginLeft: u(-0.5) }} />
  );

  return (
    <div ref={rootRef} className={`w-full h-full [container-type:inline-size] ${className}`}>
      <div
        className="relative w-full h-full flex flex-col overflow-hidden border border-[#8AC6FF] select-none"
        style={{
          backgroundImage: CARD_GRADIENT,
          borderRadius: u(30),
          paddingTop: u(29),
          paddingLeft: u(18),
          paddingRight: u(17),
          paddingBottom: u(20.71),
        }}
      >
        {/* Header */}
        <h2
          className="font-bold text-[#2294FE] whitespace-nowrap overflow-hidden text-ellipsis shrink-0"
          style={{ fontFamily: TITLE_FONT, fontSize: u(20), lineHeight: u(24) }}
        >
          {title}
        </h2>

        {/* Receipt Panel */}
        <div
          className="relative flex-1 min-h-0 flex flex-col overflow-hidden border border-[#8AC6FF]"
          style={{
            marginTop: u(21),
            borderRadius: u(16),
            backgroundImage: PANEL_GRADIENT,
            boxShadow: `inset ${u(4)} ${u(4)} ${u(24.4)} 0 rgba(144, 144, 144, 0.11)`,
          }}
        >
          {/* Line items */}
          <div className="relative flex-1 min-h-0">
            <ol
              ref={scrollRef}
              onScroll={handleScroll}
              className="absolute inset-0 overflow-y-auto flex flex-col [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{ padding: `${u(13.69)} ${u(31)} ${u(13.69)} ${u(24.96)}`, gap: u(14.49) }}
            >
              {items.map((line, i) => (
                <li key={i} className="flex items-center shrink-0 text-[#646464]" style={{ gap: u(12.89) }}>
                  <span className="relative shrink-0 flex items-center justify-center" style={{ width: u(31.403), height: u(31.403) }}>
                    <img
                      src={itemCircle}
                      alt=""
                      width={48.3199}
                      height={48.3199}
                      className="absolute block max-w-none pointer-events-none"
                      style={{ left: u(-7.39), top: u(-7.92), width: u(48.3199), height: u(48.3199) }}
                    />
                    <span className="relative" style={{ fontFamily: MONO_FONT, fontSize: u(16.104), lineHeight: u(21) }}>
                      {i + 1}
                    </span>
                  </span>
                  <span className="flex-1 min-w-0 whitespace-nowrap overflow-hidden text-ellipsis" style={textStyle}>
                    {line.name}
                  </span>
                  <span className="shrink-0 whitespace-nowrap" style={textStyle}>
                    {line.amount}
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
          {taxes.length > 0 && (
            <>
              {dividerImg}
              <div
                className="grid shrink-0 text-[#646464]"
                style={{
                  gridTemplateColumns: `${u(159)} 1fr auto`,
                  rowGap: u(15),
                  padding: `${u(18)} ${u(32)} ${u(23)} ${u(25)}`,
                }}
              >
                {taxes.map((line, i) => (
                  <React.Fragment key={i}>
                    <span style={smallStyle}>{i === 0 ? 'TAX' : ''}</span>
                    <span style={smallStyle}>{line.name}</span>
                    <span className="text-right" style={smallStyle}>{line.amount}</span>
                  </React.Fragment>
                ))}
              </div>
            </>
          )}

          {/* Total */}
          {dividerImg}
          <div
            className="flex items-center justify-between shrink-0 text-[#646464]"
            style={{ height: u(49), paddingLeft: u(25), paddingRight: u(32) }}
          >
            <span style={smallStyle}>TOTAL</span>
            <span style={textStyle}>{total}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between shrink-0" style={{ marginTop: u(21) }}>
          <span className="text-[#C2BCBC] whitespace-nowrap" style={{ fontFamily: BODY_FONT, fontSize: u(16.104), lineHeight: u(19) }}>
            {date}
          </span>

          <button
            type="button"
            onClick={handleShare}
            aria-label={copied ? 'Receipt copied' : 'Share receipt'}
            className="flex items-center justify-center shrink-0 bg-[rgba(220,220,220,0.2)] text-[#8E8E8E] cursor-pointer transition-all duration-200 hover:bg-[rgba(220,220,220,0.35)] active:scale-95"
            style={{
              width: u(49.923),
              height: u(44.287),
              borderRadius: u(15.099),
              boxShadow: `${u(1.51)} ${u(0.755)} ${u(11.928)} 0 rgba(0, 0, 0, 0.07), inset ${u(-0.755)} 0 ${u(39.939)} ${u(10.468)} rgba(255, 255, 255, 0.52)`,
            }}
          >
            {copied ? (
              <Check className="text-[#2294FE]" style={{ width: u(20), height: u(20) }} strokeWidth={2.4} />
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
