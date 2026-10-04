import React, { useEffect, useRef, useState } from 'react';
import type { CodeSnippetData, WidgetDisplayProps } from '../types/widgets';
import WidgetShell, { ShellIconButton, SolidPanel, Watermark } from './WidgetShell';
import { FONT, ON_PANEL, SHELL, widgetScale } from './widgetKit';

export interface CodeSnippetWidgetProps extends WidgetDisplayProps {
  data?: Partial<CodeSnippetData>;
  className?: string;
}

const DEFAULT_DATA: CodeSnippetData = {
  title: 'Project Code Snippet',
  language: 'java',
  code: 'const userTags = data?.user?.profile?.tags ?? [];\nreturn userTags.map((tag) => <TagBadge key={tag.id} label={tag.name} />);',
  date: '02/20/2027',
};

// Figma "Project Code Snippet" (stormhacks-27, nodes 55:397 / 55:398 / 55:452) on the solid-panel
// shell (node 120:1121). Designed at 730px wide (2x2); sizes scale with the widget's width.
const DESIGN_WIDTH = 730;
const { u, space, type } = widgetScale(DESIGN_WIDTH);

// Compact (mobile Rolodex) variant: 1x1 square at the 1x1 design width.
const COMPACT_WIDTH = 357;
const compact = widgetScale(COMPACT_WIDTH);
// Code runs off the bottom instead of scrolling.
const CODE_FADE = 'linear-gradient(to bottom, black 50%, transparent 100%)';

const COPIED_RESET_MS = 1600;

export default function CodeSnippetWidget({ data, className = '', isCompact = false }: CodeSnippetWidgetProps) {
  // Sample data only for previews (no data). Real items show their own values, even empty ones.
  const src = data ?? DEFAULT_DATA;
  const title = src.title ?? '';
  const language = src.language ?? '';
  const code = src.code ?? '';
  const date = src.date ?? '';

  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), COPIED_RESET_MS);
    } catch {
      setCopied(false);
    }
  };

  if (isCompact) {
    // Title, language and a faded peek at the code. No copy button or date.
    return (
      <WidgetShell designWidth={COMPACT_WIDTH} className={`aspect-square ${className}`}>
        <div className="absolute inset-0 flex flex-col" style={{ gap: compact.space(3) }}>
          <div
            className="flex items-baseline justify-between shrink-0"
            style={{ gap: compact.space(3), paddingLeft: compact.u(SHELL.padX), paddingRight: compact.u(SHELL.padX), paddingTop: compact.u(SHELL.padY / 2) }}
          >
            <h2 className="font-bold text-white min-w-0 whitespace-nowrap overflow-hidden text-ellipsis" style={compact.type('display')}>
              {title}
            </h2>
            <span className="text-white whitespace-nowrap shrink-0" style={compact.type('body')}>
              {language}
            </span>
          </div>

          <SolidPanel designWidth={COMPACT_WIDTH} accent="grey" className="flex-1 min-h-0">
            <Watermark designWidth={COMPACT_WIDTH} glyph="{i++}" size={200} />
            <pre
              className={`absolute inset-0 m-0 overflow-hidden whitespace-pre-wrap break-words ${ON_PANEL.primary}`}
              style={{
                padding: compact.space(4),
                fontFamily: FONT.mono,
                fontSize: compact.type('body').fontSize,
                fontWeight: 700,
                lineHeight: 'normal',
                maskImage: CODE_FADE,
                WebkitMaskImage: CODE_FADE,
              }}
            >
              <code style={{ fontFamily: 'inherit' }}>{code}</code>
            </pre>
          </SolidPanel>
        </div>
      </WidgetShell>
    );
  }

  const footer = (
    <ShellIconButton
      designWidth={DESIGN_WIDTH}
      label={copied ? 'Code copied' : 'Copy code'}
      text={copied ? 'Copied' : 'Copy Code'}
      onClick={handleCopy}
    />
  );

  return (
    <WidgetShell
      designWidth={DESIGN_WIDTH}
      className={className}
      footer={footer}
    >
      {/* Only the code is inset; header and date sit on the shell surface. */}
      <div className="absolute inset-0 flex flex-col" style={{ gap: space(3) }}>
        {/* Header */}
        <div
          className="flex items-baseline justify-between shrink-0"
          style={{ gap: space(4), paddingLeft: u(SHELL.padX), paddingRight: u(SHELL.padX), paddingTop: u(SHELL.padY / 2) }}
        >
          <h2
            className="font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis"
            style={type('display')}
          >
            {title}
          </h2>
          <span className="text-white whitespace-nowrap shrink-0" style={type('body')}>
            {language}
          </span>
        </div>

        {/* Code Block: grey inset panel, plain white mono. */}
        <SolidPanel designWidth={DESIGN_WIDTH} accent="grey" className="flex-1 min-h-0">
          <Watermark designWidth={DESIGN_WIDTH} glyph="{i++}" size={200} />
          <pre
            className={`absolute inset-0 m-0 overflow-auto whitespace-pre-wrap break-words ${ON_PANEL.primary} [scrollbar-width:thin] [scrollbar-color:rgb(var(--glow)/0.3)_transparent]`}
            style={{
              padding: space(6),
              fontFamily: FONT.mono,
              fontSize: type('body').fontSize,
              fontWeight: 700,
              lineHeight: 'normal',
            }}
          >
            <code style={{ fontFamily: 'inherit' }}>{code}</code>
          </pre>
        </SolidPanel>

        <span className="text-white whitespace-nowrap shrink-0" style={{ ...type('caption'), paddingLeft: u(SHELL.padX) }}>
          {date}
        </span>
      </div>
    </WidgetShell>
  );
}

export { CodeSnippetWidget };
