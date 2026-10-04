import React, { useEffect, useRef, useState } from 'react';
import type { CodeSnippetData } from '../types/widgets';
import WidgetShell, { ShellIconButton, Watermark } from './WidgetShell';
import { FONT, ON_PANEL, SHELL, widgetScale } from './widgetKit';

export interface CodeSnippetWidgetProps {
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
const { u, space, radius, type, insetShadow } = widgetScale(DESIGN_WIDTH);

const COPIED_RESET_MS = 1600;

export default function CodeSnippetWidget({ data, className = '' }: CodeSnippetWidgetProps) {
  const title = data?.title ?? DEFAULT_DATA.title;
  const language = data?.language ?? DEFAULT_DATA.language;
  const code = data?.code ?? DEFAULT_DATA.code;
  const date = data?.date ?? DEFAULT_DATA.date;

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
      accent="grey"
      className={className}
      watermark={<Watermark designWidth={DESIGN_WIDTH} glyph="{i++}" size={200} />}
      footer={footer}
    >
      <div
        className="absolute flex flex-col"
        style={{ left: u(SHELL.padX), right: u(SHELL.padX), top: u(SHELL.padY), bottom: u(SHELL.padX), gap: space(3) }}
      >
        {/* Header */}
        <div className="flex items-baseline justify-between shrink-0" style={{ gap: space(4) }}>
          <h2
            className={`font-bold ${ON_PANEL.primary} whitespace-nowrap overflow-hidden text-ellipsis`}
            style={type('display')}
          >
            {title}
          </h2>
          <span className={`${ON_PANEL.secondary} whitespace-nowrap shrink-0`} style={type('body')}>
            {language}
          </span>
        </div>

        {/* Code Block: plain white mono, no syntax colours on the solid panel. */}
        <div
          className={`relative flex-1 min-h-0 ${ON_PANEL.well}`}
          style={{ borderRadius: radius('control'), boxShadow: insetShadow }}
        >
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
        </div>

        <span className={`${ON_PANEL.faint} whitespace-nowrap shrink-0`} style={type('caption')}>
          {date}
        </span>
      </div>
    </WidgetShell>
  );
}

export { CodeSnippetWidget };
