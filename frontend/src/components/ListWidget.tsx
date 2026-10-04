import React, { useEffect, useRef, useState } from 'react';
import GrainOverlay from './GrainOverlay';
import { Check, Pencil } from 'lucide-react';
import type { ListItem, ListWidgetData } from '../types/widgets';
import scrollThumb from '../assets/list-widget/scroll-thumb.svg';
import { GLASS_CONTROL, GLASS_CONTROL_HOVER, accentGradient, widgetScale } from './widgetKit';

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

// Figma "Recommendation List" (stormhacks-27, node 47:198), designed at 434px wide; geometry
// rescaled to 357 (x0.823) to match the other 1x1 widgets so shared type/space tokens render alike.
// All sizes scale with the widget's width (container query units) so it keeps the
// design's proportions while fitting the square grid cell.
const DESIGN_WIDTH = 357;
const { u, space, radius, type, glassShadow, cardInset } = widgetScale(DESIGN_WIDTH);

const CARD_GRADIENT = accentGradient('coral', 138.23);
const LIST_GRADIENT = accentGradient('coral', 151.66);

// Scroll thumb asset is 84x8 horizontal; rotated to vertical. Track inset matches the 32px top offset in the design.
const THUMB_LENGTH = 69;
const THUMB_WIDTH = 6.6;
const TRACK_INSET = 26;

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

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isChecked: !item.isChecked } : item
      )
    );
    onToggleItem?.(id);
  };

  return (
    <div
      ref={rootRef}
      className={`w-full h-full min-h-[280px] [container-type:inline-size] ${className}`}
    >
      <div
        className="relative w-full h-full border border-accent-coral-edge flex flex-col select-none overflow-hidden"
        style={{
          backgroundImage: CARD_GRADIENT,
          borderRadius: radius('card'),
          padding: `${cardInset} ${space(4)}`,
        }}
      >
        <GrainOverlay />
        {/* Header */}
        <h2
          className="font-bold text-accent-coral whitespace-nowrap overflow-hidden text-ellipsis shrink-0"
          style={type('title')}
        >
          {title}
        </h2>

        {/* Inset List Container */}
        <div
          className="relative flex-1 min-h-0 border border-accent-coral-edge overflow-hidden"
          style={{ backgroundImage: LIST_GRADIENT, borderRadius: radius('panel'), marginTop: space(6) }}
        >
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="absolute inset-0 overflow-y-auto flex flex-col [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ padding: `${space(4)} ${space(10)} ${space(4)} ${space(8)}`, gap: space(4) }}
          >
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                role="checkbox"
                aria-checked={item.isChecked}
                onClick={() => toggleItem(item.id)}
                className="flex items-center shrink-0 text-left group cursor-pointer transition-transform active:scale-[0.98]"
                style={{ gap: space(4) }}
              >
                {/* Circular Toggle */}
                <span className="relative shrink-0" style={{ width: u(32), height: u(32) }}>
                  <div
                    className="absolute inset-0 rounded-full bg-[#DCDCDC]/20 dark:bg-white/10"
                    style={{
                      boxShadow: `${u(1.07)} ${u(0.53)} ${u(4.23)} 0 rgba(0, 0, 0, 0.07), inset ${u(-0.53)} 0 ${u(14.16)} ${u(7.42)} rgba(255, 255, 255, 0.52)`
                    }}                  />
                  {item.isChecked && (
                    <Check
                      className="absolute inset-0 m-auto text-accent-coral"
                      style={{ width: u(16), height: u(16) }}
                      strokeWidth={2.6}
                    />
                  )}
                </span>

                {/* Item Title */}
                <span
                  className="text-ink-muted group-hover:text-ink transition-colors"
                  style={type('title')}
                >
                  {item.title}
                </span>
              </button>
            ))}
          </div>

          {/* Scroll Thumb */}
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              right: u(9),
              width: u(THUMB_WIDTH),
              height: u(THUMB_LENGTH),
              top: `calc(${u(TRACK_INSET)} + ${scrollProgress * trackLength}px)`,
            }}
          >
            <img
              src={scrollThumb}
              alt=""
              width={84}
              height={8}
              className="absolute block max-w-none left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90"
              style={{ width: u(THUMB_LENGTH), height: u(THUMB_WIDTH) }}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{ marginTop: space(6), paddingLeft: space(4) }}
        >
          <span
            className="text-ink-subtle"
            style={type('body')}
          >
            {date}
          </span>

          {/* Edit Button */}
          <button
            onClick={onEdit}
            type="button"
            aria-label="Edit list"
            className={`relative ${GLASS_CONTROL} ${GLASS_CONTROL_HOVER} flex items-center justify-center transition-all duration-200`}
            style={{ width: u(49.923), height: u(44.287), borderRadius: radius('control'), boxShadow: glassShadow }}
          >
            <Pencil className="text-control-ink" style={{ width: u(18), height: u(18) }} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </div>
  );
}

export { ListWidget as RecommendationListWidget };
