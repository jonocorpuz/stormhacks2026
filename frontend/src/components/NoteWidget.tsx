import React from 'react';
import { Pencil } from 'lucide-react';
import type { NoteWidgetData } from '../types/widgets';
import { GLASS_CONTROL, GLASS_CONTROL_HOVER, accentGradient, widgetScale } from './widgetKit';

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
const { u, space, radius, type, glassShadow, cardInset } = widgetScale(DESIGN_WIDTH);

const CARD_GRADIENT = accentGradient('coral', 138.62);

export default function NoteWidget({ data, onEdit, className = '' }: NoteWidgetProps) {
  const title = data?.title || DEFAULT_TITLE;
  const body = data?.body ?? '';
  const date = data?.date ?? '';

  return (
    <div className={`w-full h-full [container-type:inline-size] ${className}`}>
      <div
        className="relative w-full h-full flex flex-col overflow-hidden border-solid border-accent-coral-edge select-none"
        style={{
          backgroundImage: CARD_GRADIENT,
          borderWidth: u(0.834),
          borderRadius: radius('card'),
          paddingTop: cardInset,
          paddingLeft: space(4),
          paddingRight: space(4),
          paddingBottom: cardInset,
        }}
      >
        {/* Header */}
        <h2
          className="font-bold text-accent-coral whitespace-nowrap overflow-hidden text-ellipsis shrink-0"
          style={type('title')}
        >
          {title}
        </h2>

        {/* Body */}
        <p
          className="flex-1 min-h-0 overflow-hidden text-ink-muted whitespace-pre-wrap break-words"
          style={{
            ...type('body'),
            marginTop: space(5),
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
          style={{ marginTop: space(3), paddingLeft: space(3), marginRight: u(-2.96) }}
        >
          <span
            className="text-ink-subtle whitespace-nowrap"
            style={type('body')}
          >
            {date}
          </span>

          {/* Edit Button: no stopPropagation, so the card's own click opens the editor too. */}
          <button
            type="button"
            onClick={onEdit}
            aria-label="Edit note"
            className={`flex items-center justify-center shrink-0 ${GLASS_CONTROL} ${GLASS_CONTROL_HOVER} transition-all duration-200`}
            style={{
              width: u(49.923),
              height: u(44.287),
              borderRadius: radius('control'),
              boxShadow: glassShadow,
            }}
          >
            <Pencil className="text-control-ink" style={{ width: u(18), height: u(18) }} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </div>
  );
}

export { NoteWidget };
