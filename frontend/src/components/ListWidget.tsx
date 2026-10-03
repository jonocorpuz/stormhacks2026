import React, { useState } from 'react';
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

  return (
    <>
      <style>{`
        .custom-pink-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .custom-pink-scroll::-webkit-scrollbar-track {
          background: transparent;
          margin-block: 8px; /* Adds padding to top and bottom of track */
        }
        .custom-pink-scroll::-webkit-scrollbar-thumb {
          background-color: #E29B9B;
          border-radius: 9999px;
        }
        /* Fallback for Firefox */
        .custom-pink-scroll {
          scrollbar-width: thin;
          scrollbar-color: #E29B9B transparent;
        }
      `}</style>
      <div
        className={`relative w-full h-full min-h-[340px] rounded-[2.5rem] p-6 sm:p-7 flex flex-col justify-between select-none shadow-xl border-[1.5px] border-[#F3D5D5] bg-gradient-to-br from-[#FFD6D6] via-[#FFFFFF] to-[#FFD6D6] transition-all duration-300 hover:shadow-2xl ${className}`}
      >
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-2xl sm:text-[26px] font-bold text-[#DE7A7A] tracking-tight leading-snug">
            {title}
          </h2>
        </div>

        {/* Inset List Container */}
        <div className="relative flex-1 min-h-0 rounded-[1.75rem] bg-white/30 backdrop-blur-md border-[1.5px] border-[#F3D5D5] p-4 sm:p-5 flex flex-col shadow-sm">
          {/* Scrollable list items */}
          <div className="flex-1 overflow-y-auto pr-3 space-y-3.5 custom-pink-scroll">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className="flex items-center gap-3.5 group cursor-pointer py-1 transition-transform active:scale-[0.98]"
              >
                {/* Circular Toggle */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 border-[1.5px] ${
                    item.isChecked
                      ? 'bg-[#FFF5F5] border-[#F3D5D5] shadow-sm'
                      : 'bg-white/40 border-[#F3D5D5]/60 group-hover:bg-white/60'
                  }`}
                  aria-label={`Toggle ${item.title}`}
                  role="checkbox"
                  aria-checked={item.isChecked}
                >
                  {item.isChecked && (
                    <Check className="w-5 h-5 text-[#DE7A7A]" strokeWidth={2.6} />
                  )}
                </div>

                {/* Item Title */}
                <span className="text-[17px] font-medium text-[#7A7A7A] tracking-tight group-hover:text-[#555555] transition-colors">
                  {item.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 mt-auto">
          <span className="text-[15px] font-medium text-[#A3A3A3] tracking-tight">
            {date}
          </span>

          {/* Edit Button */}
          <button
            onClick={onEdit}
            type="button"
            aria-label="Edit list"
            className="w-11 h-11 rounded-2xl bg-white/60 hover:bg-white/80 active:scale-95 border-[1.5px] border-[#F3D5D5] backdrop-blur-sm shadow-sm flex items-center justify-center cursor-pointer transition-all duration-200"
          >
            <Pencil className="w-[18px] h-[18px] text-[#A3A3A3]" strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </>
  );
}

export { ListWidget as RecommendationListWidget };
