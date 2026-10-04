import React, { useEffect, useRef, useState } from 'react';
import { Check, Pencil, SquareCheck } from 'lucide-react';
import type { ListItem, ListWidgetData } from '../types/widgets';
import WidgetShell, { ShellIconButton, Watermark } from './WidgetShell';
import { ON_PANEL, SHELL, widgetScale } from './widgetKit';

export interface ListWidgetProps {
  data?: Partial<ListWidgetData>;
  initialData?: ListWidgetData;
  onToggleItem?: (id: string) => void;
  onEdit?: () => void;
  className?: string;
}

export type RecommendationListWidgetProps = ListWidgetProps;

const DEFAULT_ITEMS: ListItem[] = [
  { id: '1', title: 'Argo', isChecked: true },
  { id: '2', title: 'Peaky Blinder', isChecked: false },
  { id: '3', title: '28 Days Later', isChecked: false },
  { id: '4', title: 'Brothers', isChecked: false },
];

// List on the solid-shell card (stormhacks-27, node 120:1121 "Group 54"), laid out 1x1 at 357px.
// All sizes scale with the widget's width (container query units).
const DESIGN_WIDTH = 357;
const { u, space, radius, type } = widgetScale(DESIGN_WIDTH);

// Vertical scroll thumb inside the well.
const THUMB_LENGTH = 48;
const THUMB_WIDTH = 5;
const TRACK_INSET = 14;

export default function ListWidget({
  data,
  initialData,
  onToggleItem,
  onEdit,
  className = '',
}: ListWidgetProps) {
  const [items, setItems] = useState<ListItem[]>(() => (
    data?.items ?? initialData?.items ?? DEFAULT_ITEMS
  ));
  const [scrollProgress, setScrollProgress] = useState(0);
  const [trackLength, setTrackLength] = useState(0);
  const [overflowing, setOverflowing] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const title = data?.title ?? initialData?.title ?? 'List';
  const date = data?.date ?? initialData?.date ?? '02/20/2027';

  useEffect(() => {
    if (data?.items) {
      setItems(data.items);
    }
  }, [data?.items]);

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

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isChecked: !item.isChecked } : item
      )
    );
    onToggleItem?.(id);
  };

  // Edit button only when a handler is wired (board uses the card's edit-mode button).
  const footer = onEdit && (
    <ShellIconButton designWidth={DESIGN_WIDTH} label="Edit list" onClick={onEdit}>
      <Pencil style={{ width: u(20), height: u(20) }} strokeWidth={2} />
    </ShellIconButton>
  );

  return (
    <div ref={rootRef} className="w-full h-full min-h-[280px]">
      <WidgetShell
        designWidth={DESIGN_WIDTH}
        accent="green"
        className={className}
        watermark={<Watermark designWidth={DESIGN_WIDTH} icon={SquareCheck} />}
        footer={footer}
      >
        <div
          className="absolute flex flex-col"
          style={{ left: u(SHELL.padX), right: u(SHELL.padX), top: u(SHELL.padY), bottom: u(SHELL.padX) }}
        >
          {/* Header */}
          <h2
            className={`font-bold ${ON_PANEL.primary} whitespace-nowrap overflow-hidden text-ellipsis shrink-0`}
            style={type('display')}
          >
            {title}
          </h2>

          {/* List well */}
          <div
            className={`relative flex-1 min-h-0 overflow-hidden ${ON_PANEL.well}`}
            style={{ borderRadius: radius('panel'), marginTop: space(3), boxShadow: `inset 0 ${u(3)} ${u(3)} 0 rgb(var(--shadow) / 0.25)` }}
          >
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="absolute inset-0 overflow-y-auto flex flex-col [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{ padding: `${space(3)} ${space(6)} ${space(3)} ${space(3)}`, gap: space(2) }}
            >
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="checkbox"
                  aria-checked={item.isChecked}
                  onClick={() => toggleItem(item.id)}
                  className="flex items-center shrink-0 text-left group cursor-pointer transition-transform active:scale-[0.98]"
                  style={{ gap: space(3) }}
                >
                  {/* Checkbox */}
                  <span
                    className={`relative shrink-0 flex items-center justify-center border-solid border-white ${
                      item.isChecked ? 'bg-white' : ''
                    }`}
                    style={{ width: u(22), height: u(22), borderWidth: u(2), borderRadius: u(6) }}
                  >
                    {item.isChecked && (
                      <Check className="text-accent-green-solid" style={{ width: u(15), height: u(15) }} strokeWidth={3} />
                    )}
                  </span>

                  {/* Item Title */}
                  <span
                    className={`${ON_PANEL.primary} whitespace-nowrap overflow-hidden text-ellipsis`}
                    style={type('title')}
                  >
                    {item.title}
                  </span>
                </button>
              ))}
            </div>

            {/* Scroll Thumb: only when the list overflows */}
            {overflowing && (
              <div
                aria-hidden
                className="absolute pointer-events-none rounded-full bg-white/60"
                style={{
                  right: u(8),
                  width: u(THUMB_WIDTH),
                  height: u(THUMB_LENGTH),
                  top: `calc(${u(TRACK_INSET)} + ${scrollProgress * trackLength}px)`,
                }}
              />
            )}
          </div>

          <span
            className={`${ON_PANEL.faint} whitespace-nowrap shrink-0`}
            style={{ ...type('caption'), marginTop: space(2) }}
          >
            {date}
          </span>
        </div>
      </WidgetShell>
    </div>
  );
}

export { ListWidget as RecommendationListWidget };
