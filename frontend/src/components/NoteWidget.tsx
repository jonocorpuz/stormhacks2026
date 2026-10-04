import React from 'react';
import { Pencil } from 'lucide-react';
import type { NoteWidgetData } from '../types/widgets';
import WidgetShell, { ShellIconButton, Watermark } from './WidgetShell';
import { ON_PANEL, SHELL, widgetScale } from './widgetKit';

export interface NoteWidgetProps {
  data?: Partial<NoteWidgetData>;
  onEdit?: () => void;
  className?: string;
}

const DEFAULT_TITLE = 'General Notes';

// Note on the solid-shell card (stormhacks-27, node 120:1121 "Group 54"), laid out 1x1 at 357px.
// All sizes scale with the widget's width (container query units).
const DESIGN_WIDTH = 357;
const { u, space, type } = widgetScale(DESIGN_WIDTH);

export default function NoteWidget({ data, onEdit, className = '' }: NoteWidgetProps) {
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
      accent="coral"
      className={className}
      watermark={<Watermark designWidth={DESIGN_WIDTH} icon={Pencil} />}
      footer={footer}
    >
      <div
        className="absolute flex flex-col"
        style={{ left: u(SHELL.padX), right: u(SHELL.padX), top: u(SHELL.padY), bottom: u(SHELL.padX) }}
      >
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

        <span className={`${ON_PANEL.faint} whitespace-nowrap shrink-0`} style={{ ...type('caption'), marginTop: space(2) }}>
          {date}
        </span>
      </div>
    </WidgetShell>
  );
}

export { NoteWidget };
