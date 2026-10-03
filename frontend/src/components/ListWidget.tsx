import React, { useEffect, useRef, useState } from 'react';
import { Check, Pencil } from 'lucide-react';
import { RecommendationItem, RecommendationWidgetData } from '../types/widgets';
import toggleCircle from '../assets/list-widget/toggle-circle.svg';
import scrollThumb from '../assets/list-widget/scroll-thumb.svg';

export interface ListWidgetProps {
  data?: Partial<RecommendationWidgetData>;
  initialData?: RecommendationWidgetData;
  onToggleItem?: (id: string) => void;
  onEdit?: () => void;
  className?: string;
}

export type RecommendationListWidgetProps = ListWidgetProps;

const DEFAULT_ITEMS: RecommendationItem[] = [
  { id: '1', title: 'Argo', isChecked: true },
  { id: '2', title: 'Peaky Blinder', isChecked: false },
  { id: '3', title: '28 Days Later', isChecked: false },
  { id: '4', title: 'Brothers', isChecked: false },
];

// Figma "Recommendation List" (stormhacks-27, node 47:198)
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
  const [items, setItems] = useState<RecommendationItem[]>(() => (
    data?.items ?? initialData?.items ?? DEFAULT_ITEMS
  ));
  const [scrollProgress, setScrollProgress] = useState(0);
  const [trackLength, setTrackLength] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const title = data?.title ?? initialData?.title ?? 'Recommendation List';
  const date = data?.date ?? initialData?.date ?? '02/20/2027';

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => setTrackLength(Math.max(0, el.clientHeight - TRACK_INSET * 2 - THUMB_LENGTH));
    measure();
    const observer = new ResizeObserver(measure);
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
      className={`relative w-full h-full min-h-[340px] rounded-[30px] border border-[#FFD9CC] px-[18px] pt-[37px] pb-5 flex flex-col select-none overflow-hidden ${className}`}
      style={{ backgroundImage: CARD_GRADIENT }}
    >
      {/* Header */}
      <h2
        className="text-[32px] font-bold leading-[39px] text-[#DA7777] whitespace-nowrap overflow-hidden text-ellipsis"
        style={{ fontFamily: TITLE_FONT }}
      >
        {title}
      </h2>

      {/* Inset List Container */}
      <div
        className="relative mt-[23px] flex-1 min-h-0 rounded-[20px] border border-[#FFD9CC] overflow-hidden"
        style={{ backgroundImage: LIST_GRADIENT }}
      >
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="absolute inset-0 overflow-y-auto pl-[31px] pr-10 py-[17px] flex flex-col gap-[18px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="checkbox"
              aria-checked={item.isChecked}
              onClick={() => toggleItem(item.id)}
              className="flex items-center gap-4 shrink-0 text-left group cursor-pointer transition-transform active:scale-[0.98]"
            >
              {/* Circular Toggle */}
              <span className="relative size-[39px] shrink-0">
                <img
                  src={toggleCircle}
                  alt=""
                  width={60.0088}
                  height={60.0088}
                  className="absolute block max-w-none left-[-9.17px] top-[-9.84px] pointer-events-none"
                />
                {item.isChecked && (
                  <Check
                    className="absolute inset-0 m-auto w-5 h-5 text-[#DA7777]"
                    strokeWidth={2.6}
                  />
                )}
              </span>

              {/* Item Title */}
              <span
                className="text-[20px] leading-[23px] text-[#646464] group-hover:text-[#4A4A4A] transition-colors"
                style={{ fontFamily: BODY_FONT }}
              >
                {item.title}
              </span>
            </button>
          ))}
        </div>

        {/* Scroll Thumb */}
        <div
          aria-hidden
          className="absolute right-[11px] w-2 pointer-events-none"
          style={{ top: TRACK_INSET + scrollProgress * trackLength, height: THUMB_LENGTH }}
        >
          <img
            src={scrollThumb}
            alt=""
            width={84}
            height={8}
            className="absolute block max-w-none left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-[23px] pl-[15px]">
        <span
          className="text-[20px] leading-[23px] text-[#C2BCBC]"
          style={{ fontFamily: BODY_FONT }}
        >
          {date}
        </span>

        {/* Edit Button */}
        <button
          onClick={onEdit}
          type="button"
          aria-label="Edit list"
          className="relative w-[62px] h-[55px] rounded-[18.752px] bg-[rgba(220,220,220,0.2)] shadow-[1.875px_0.938px_14.814px_0px_rgba(0,0,0,0.07),inset_-0.938px_0px_49.6px_13px_rgba(255,255,255,0.52)] flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-[rgba(220,220,220,0.35)] active:scale-95"
        >
          <Pencil className="w-[22px] h-[22px] text-[#8E8E8E]" strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}

export { ListWidget as RecommendationListWidget };
