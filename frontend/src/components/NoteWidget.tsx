import React from 'react';
import GrainOverlay from './GrainOverlay';
import { Pencil } from 'lucide-react';
import type { NoteWidgetData } from '../types/widgets';

export interface NoteWidgetProps {
  data?: Partial<NoteWidgetData>;
  onEdit?: () => void;
  className?: string;
}

const DEFAULT_TITLE = 'General Notes';

// Figma "General Notes" (stormhacks-27, "MacBook Pro 14" - 8", node 55:496 "Group 27"),
// designed at 357px square. All sizes scale with the widget's width (container query units)
// so it keeps the design's proportions in any 1x1 bento cell.
const DESIGN_WIDTH = 357;
const u = (px: number) => `calc(${px} * 100cqw / ${DESIGN_WIDTH})`;

const CARD_GRADIENT =
  'linear-gradient(138.62deg, rgba(255, 64, 0, 0.1) 11.72%, rgba(254, 89, 34, 0.02) 50.62%, rgba(254, 89, 34, 0.1) 89.51%)';
const TITLE_FONT = "'Alte Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const SF_FONT = "'SF Pro', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, sans-serif";

export default function NoteWidget({ data, onEdit, className = '' }: NoteWidgetProps) {
  const title = data?.title || DEFAULT_TITLE;
  const body = data?.body ?? '';
  const date = data?.date ?? '';

  return (
    <div className={`w-full h-full [container-type:inline-size] ${className}`}>
      <div
        className="relative w-full h-full flex flex-col overflow-hidden border-solid border-[#FFD9CC] dark:border-[#FFD9CC]/30 select-none"
        style={{
          backgroundImage: CARD_GRADIENT,
          borderWidth: u(0.834),
          borderRadius: u(25.009),
          paddingTop: u(38),
          paddingLeft: u(18),
          paddingRight: u(18),
          paddingBottom: u(16.41),
        }}
      >
        <GrainOverlay />
        {/* Header */}
        <h2
          className="font-bold text-[#DA7777] whitespace-nowrap overflow-hidden text-ellipsis shrink-0"
          style={{ fontFamily: TITLE_FONT, fontSize: u(20), lineHeight: u(24) }}
        >
          {title}
        </h2>

        {/* Body */}
        <p
          className="flex-1 min-h-0 overflow-hidden text-[#646464] dark:text-white whitespace-pre-wrap break-words"
          style={{
            fontFamily: SF_FONT,
            fontSize: u(16.104),
            lineHeight: u(19.2),
            marginTop: u(19),
            width: u(288),
            maxWidth: '100%',
            maskImage: 'linear-gradient(to bottom, black calc(100% - 1.5em), transparent)',
          }}
        >
          {body}
        </p>

        {/* Footer */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{ marginTop: u(12), paddingLeft: u(12.37), marginRight: u(-2.96) }}
        >
          <span
            className="text-[#C2BCBC] dark:text-white whitespace-nowrap"
            style={{ fontFamily: SF_FONT, fontSize: u(16.104), lineHeight: u(19) }}
          >
            {date}
          </span>

          {/* Edit Button: no stopPropagation, so the card's own click opens the editor too. */}
          <button
            type="button"
            onClick={onEdit}
            aria-label="Edit note"
            className="flex items-center justify-center shrink-0 bg-[rgba(220,220,220,0.2)] cursor-pointer transition-all duration-200 hover:bg-[rgba(220,220,220,0.35)] active:scale-95"
            style={{
              width: u(49.923),
              height: u(44.287),
              borderRadius: u(15.099),
              boxShadow: `${u(1.51)} ${u(0.755)} ${u(11.928)} 0 rgba(0, 0, 0, 0.07), inset ${u(-0.755)} 0 ${u(39.939)} ${u(10.468)} rgba(255, 255, 255, 0.52)`,
            }}
          >
            <Pencil className="text-[#8E8E8E] dark:text-[#3F3F3F]" style={{ width: u(18), height: u(18) }} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </div>
  );
}

export { NoteWidget };
