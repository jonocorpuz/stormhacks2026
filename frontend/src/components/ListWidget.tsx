import React, { useEffect, useRef, useState } from 'react';
import GrainOverlay from './GrainOverlay';
import { Check, Pencil } from 'lucide-react';
import type { ListItem, ListWidgetData } from '../types/widgets';
import scrollThumb from '../assets/list-widget/scroll-thumb.svg';

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

// Figma "Recommendation List" (stormhacks-27, node 47:198), designed at 434px wide.
// All sizes scale with the widget's width (container query units) so it keeps the
// design's proportions while fitting the square grid cell.
const DESIGN_WIDTH = 434;
const u = (px: number) => `calc(${px} * 100cqw / ${DESIGN_WIDTH})`;

const CARD_GRADIENT =
  'linear-gradient(138.23deg, rgba(255, 64, 0, 0.1) 11.72%, rgba(254, 89, 34, 0.02) 50.62%, rgba(254, 89, 34, 0.1) 89.51%)';
const LIST_GRADIENT =
  'linear-gradient(151.66deg, rgba(255, 64, 0, 0.1) 11.72%, rgba(254, 89, 34, 0.02) 50.62%, rgba(254, 89, 34, 0.1) 89.51%)';
const TITLE_FONT = "'Alte Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const BODY_FONT = "Helvetica, 'Helvetica Neue', Arial, sans-serif";

// Scroll thumb asset is 84x8 horizontal; rotated to vertical. Track inset matches the 32px top offset in the design.
const THUMB_LENGTH = 84;
const TRACK_INSET = 32;

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
        className="relative w-full h-full border border-[#FFD9CC] dark:border-[#FFD9CC]/30 flex flex-col select-none overflow-hidden"
        style={{
          backgroundImage: CARD_GRADIENT,
          borderRadius: u(30),
          padding: `${u(37)} ${u(18)} ${u(20)}`,
        }}
      >
        <GrainOverlay />
        {/* Header */}
        <h2
          className="font-bold text-[#DA7777] whitespace-nowrap overflow-hidden text-ellipsis shrink-0"
          style={{ fontFamily: TITLE_FONT, fontSize: u(32), lineHeight: u(39) }}
        >
          {title}
        </h2>

        {/* Inset List Container */}
        <div
          className="relative flex-1 min-h-0 border border-[#FFD9CC] dark:border-[#FFD9CC]/30 overflow-hidden"
          style={{ backgroundImage: LIST_GRADIENT, borderRadius: u(20), marginTop: u(23) }}
        >
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="absolute inset-0 overflow-y-auto flex flex-col [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ padding: `${u(17)} ${u(40)} ${u(17)} ${u(31)}`, gap: u(18) }}
          >
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                role="checkbox"
                aria-checked={item.isChecked}
                onClick={() => toggleItem(item.id)}
                className="flex items-center shrink-0 text-left group cursor-pointer transition-transform active:scale-[0.98]"
                style={{ gap: u(16) }}
              >
                {/* Circular Toggle */}
                <span className="relative shrink-0" style={{ width: u(39), height: u(39) }}>
                  <div
                    className="absolute inset-0 rounded-full bg-[#DCDCDC]/20 dark:bg-white/10"
                    style={{
                      boxShadow: `${u(1.07)} ${u(0.53)} ${u(4.23)} 0 rgba(0, 0, 0, 0.07), inset ${u(-0.53)} 0 ${u(14.16)} ${u(7.42)} rgba(255, 255, 255, 0.52)`
                    }}
                  />
                  {item.isChecked && (
                    <Check
                      className="absolute inset-0 m-auto text-[#DA7777]"
                      style={{ width: u(20), height: u(20) }}
                      strokeWidth={2.6}
                    />
                  )}
                </span>

                {/* Item Title */}
                <span
                  className="text-[#646464] dark:text-white group-hover:text-[#4A4A4A] dark:group-hover:text-gray-200 transition-colors"
                  style={{ fontFamily: BODY_FONT, fontSize: u(20), lineHeight: u(23) }}
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
              right: u(11),
              width: u(8),
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
              style={{ width: u(84), height: u(8) }}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{ marginTop: u(23), paddingLeft: u(15) }}
        >
          <span
            className="text-[#C2BCBC] dark:text-white"
            style={{ fontFamily: BODY_FONT, fontSize: u(20), lineHeight: u(23) }}
          >
            {date}
          </span>

          {/* Edit Button */}
          <button
            onClick={onEdit}
            type="button"
            aria-label="Edit list"
            className="relative bg-[rgba(220,220,220,0.2)] shadow-[1.875px_0.938px_14.814px_0px_rgba(0,0,0,0.07),inset_-0.938px_0px_49.6px_13px_rgba(255,255,255,0.52)] flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-[rgba(220,220,220,0.35)] active:scale-95"
            style={{ width: u(62), height: u(55), borderRadius: u(18.752) }}
          >
            <Pencil className="text-[#8E8E8E] dark:text-[#3F3F3F]" style={{ width: u(22), height: u(22) }} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </div>
  );
}

export { ListWidget as RecommendationListWidget };
