import React from 'react';
import { Pencil } from 'lucide-react';
import type { NoteWidgetData } from '../types/widgets';
import pencilWatermark from '../assets/note-widget/pencil-watermark.svg';
import WidgetShell, { ShellIconButton } from './WidgetShell';
import { ON_PANEL, SHELL, widgetScale } from './widgetKit';

export interface NoteWidgetProps {
  data?: Partial<NoteWidgetData>;
  onEdit?: () => void;
  // Wired → title and body are typed straight into the card.
  onChange?: (patch: { title?: string; body?: string }) => void;
  className?: string;
}

const DEFAULT_TITLE = 'General Notes';

// Note on the solid-shell card (stormhacks-27, node 120:1121 "Group 54"), laid out 1x1 at 357px.
// All sizes scale with the widget's width (container query units).
const DESIGN_WIDTH = 357;
const { u, space, type } = widgetScale(DESIGN_WIDTH);

// Typing in the card shouldn't open the editor or start a drag.
const stop = (e: React.SyntheticEvent) => e.stopPropagation();
const FIELD = `block w-full bg-transparent border-0 outline-none p-0 m-0 ${ON_PANEL.primary} placeholder:text-white/55`;

export default function NoteWidget({ data, onEdit, onChange, className = '' }: NoteWidgetProps) {
  const title = data?.title || DEFAULT_TITLE;
  const body = data?.body ?? '';
  const date = data?.date ?? '';

  // Edit button only when a handler is wired (board uses the card's edit-mode button).
  const footer = onEdit && (
    <ShellIconButton designWidth={DESIGN_WIDTH} label="Edit note" onClick={onEdit}>
      <Pencil style={{ width: u(20), height: u(20) }} strokeWidth={2} />
    </ShellIconButton>
  );

  return (
    <WidgetShell
      designWidth={DESIGN_WIDTH}
      accent="orange"
      className={className}
      watermark={<PencilWatermark />}
      footer={footer}
      keepFooter
    >
      <div
        className="absolute flex flex-col"
        style={{ left: u(SHELL.padX), right: u(SHELL.padX), top: u(SHELL.padY), bottom: u(SHELL.padX) }}
      >
        {onChange ? (
          <>
            <input
              value={data?.title ?? ''}
              placeholder={DEFAULT_TITLE}
              aria-label="Note title"
              onChange={(e) => onChange({ title: e.target.value })}
              onClick={stop}
              onPointerDown={stop}
              className={`${FIELD} font-bold text-ellipsis shrink-0`}
              style={type('display')}
            />
            <textarea
              value={body}
              placeholder="Start typing…"
              aria-label="Note"
              onChange={(e) => onChange({ body: e.target.value })}
              onClick={stop}
              onPointerDown={stop}
              className={`${FIELD} flex-1 min-h-0 resize-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
              style={{ ...type('title'), marginTop: space(3) }}
            />
          </>
        ) : (
          <>
            <h2
              className={`font-bold ${ON_PANEL.primary} whitespace-nowrap overflow-hidden text-ellipsis shrink-0`}
              style={type('display')}
            >
              {title}
            </h2>

            <p
              className={`flex-1 min-h-0 overflow-hidden ${ON_PANEL.primary} whitespace-pre-wrap break-words`}
              style={{
                ...type('title'),
                marginTop: space(3),
                maskImage: 'linear-gradient(to bottom, black calc(100% - 1.5em), transparent)',
              }}
            >
              {body}
            </p>
          </>
        )}

        <span className={`${ON_PANEL.faint} whitespace-nowrap shrink-0`} style={{ ...type('caption'), marginTop: space(2) }}>
          {date}
        </span>
      </div>
    </WidgetShell>
  );
}

// Figma "Group 68" (node 130:392): tilted pencil, soft-lit into the panel. Panel clips it.
// Placed by its eraser end, near the panel's top-right; the tip points down-left.
const PENCIL_SCALE = 0.7;
const PENCIL = { width: 317.316, height: 75.8863, angle: -69.34 } as const;
const ERASER = { x: 300, y: 24 };
function PencilWatermark() {
  // Image centre → eraser end, after rotation and scale.
  const half = (PENCIL.width / 2) * PENCIL_SCALE;
  const rad = (PENCIL.angle * Math.PI) / 180;
  const cx = ERASER.x - half * Math.cos(rad);
  const cy = ERASER.y - half * Math.sin(rad);
  return (
    <div
      aria-hidden
      className="absolute pointer-events-none flex items-center justify-center"
      style={{ left: u(cx), top: u(cy), width: 0, height: 0 }}
    >
      <img
        src={pencilWatermark}
        alt=""
        width={PENCIL.width}
        height={PENCIL.height}
        className="block max-w-none flex-none mix-blend-soft-light"
        style={{
          width: u(PENCIL.width),
          height: u(PENCIL.height),
          transform: `rotate(${PENCIL.angle}deg) scale(${PENCIL_SCALE})`,
        }}
      />
    </div>
  );
}

export { NoteWidget };
