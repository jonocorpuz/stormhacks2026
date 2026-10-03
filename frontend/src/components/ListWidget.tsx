import React, { useState, useRef, useEffect } from 'react';
import { Check, Pencil } from 'lucide-react';
import { RecommendationItem, RecommendationWidgetData } from '../types/widgets';

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

  const title = data?.title ?? initialData?.title ?? 'Recommendation List';
  const date = data?.date ?? initialData?.date ?? '02/20/2027';

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isChecked: !item.isChecked } : item
      )
    );
    onToggleItem?.(id);
  };

  // Scroll indicator state
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [canScroll, setCanScroll] = useState(false);

  const handleScroll = () => {
    if (!listRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    const maxScroll = scrollHeight - clientHeight;
    if (maxScroll > 0) {
      setScrollProgress(scrollTop / maxScroll);
      setCanScroll(true);
    } else {
      setCanScroll(false);
    }
  };

  useEffect(() => {
    handleScroll();
  }, [items]);

  return (
    <div
      className={`relative w-full h-full min-h-[340px] rounded-[2.5rem] p-6 sm:p-7 flex flex-col justify-between select-none shadow-xl border border-white/60 bg-gradient-to-br from-[#FFE5E5] via-[#FFDEDE] to-[#FFD6D6] transition-all duration-300 hover:shadow-2xl ${className}`}
    >
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl sm:text-[26px] font-bold text-[#D96B6B] tracking-tight leading-snug">
          {title}
        </h2>
      </div>

      {/* Inset List Container */}
      <div className="relative flex-1 min-h-0 rounded-[1.75rem] bg-white/40 backdrop-blur-sm border border-white/50 p-4 sm:p-5 flex flex-col shadow-[inset_0_1px_3px_rgba(255,255,255,0.7)]">
        {/* Scrollable list items */}
        <div
          ref={listRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto pr-5 space-y-3.5 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className="flex items-center gap-3.5 group cursor-pointer py-1 transition-transform active:scale-[0.98]"
            >
              {/* Circular Toggle */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ${
                  item.isChecked
                    ? 'bg-white/90 shadow-sm border border-white'
                    : 'bg-white/20 border border-white/60 group-hover:bg-white/30'
                }`}
                aria-label={`Toggle ${item.title}`}
                role="checkbox"
                aria-checked={item.isChecked}
              >
                {item.isChecked && (
                  <Check className="w-5 h-5 text-[#D96B6B]" strokeWidth={2.6} />
                )}
              </div>

              {/* Item Title */}
              <span className="text-[17px] font-medium text-[#4A4A4A] tracking-tight group-hover:text-black transition-colors">
                {item.title}
              </span>
            </div>
          ))}
        </div>

        {/* Custom Thin Red/Pink Scrollbar Indicator */}
        <div className="absolute right-3.5 top-4 bottom-4 w-[5px] pointer-events-none flex flex-col justify-start">
          <div
            className="w-[5px] rounded-full bg-[#E58888] shadow-sm transition-all duration-150"
            style={{
              height: '52px',
              transform: canScroll
                ? `translateY(${scrollProgress * 90}px)`
                : 'translateY(16px)',
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 mt-auto">
        <span className="text-[15px] font-medium text-[#4A4A4A] tracking-tight">
          {date}
        </span>

        {/* Edit Button */}
        <button
          onClick={onEdit}
          type="button"
          aria-label="Edit list"
          className="w-11 h-11 rounded-2xl bg-white/60 hover:bg-white/80 active:scale-95 border border-white/50 backdrop-blur-sm shadow-sm flex items-center justify-center cursor-pointer transition-all duration-200"
        >
          <Pencil className="w-[18px] h-[18px] text-[#8E8E93]" strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}

export { ListWidget as RecommendationListWidget };

