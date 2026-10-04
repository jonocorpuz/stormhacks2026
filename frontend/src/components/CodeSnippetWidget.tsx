import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import oneDark from 'react-syntax-highlighter/dist/esm/styles/prism/one-dark';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import go from 'react-syntax-highlighter/dist/esm/languages/prism/go';
import java from 'react-syntax-highlighter/dist/esm/languages/prism/java';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import rust from 'react-syntax-highlighter/dist/esm/languages/prism/rust';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import type { CodeSnippetData } from '../types/widgets';
import { FONT, GLASS_CONTROL, GLASS_CONTROL_HOVER, accentGradient, widgetScale } from './widgetKit';

const LANGUAGES = { bash, css, go, java, javascript, json, jsx, python, rust, sql, tsx, typescript };
Object.entries(LANGUAGES).forEach(([name, grammar]) => SyntaxHighlighter.registerLanguage(name, grammar));

const LANGUAGE_ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  sh: 'bash',
  shell: 'bash',
};

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

// Figma "Project Code Snippet" (stormhacks-27, "MacBook Pro 14" - 8", nodes 55:397 / 55:398 / 55:452),
// designed at 730px wide. All sizes scale with the widget's width (container query units)
// so it keeps the design's proportions in any bento cell.
const DESIGN_WIDTH = 730;
const { u, space, radius, type, glassShadow, cardInset } = widgetScale(DESIGN_WIDTH);

const CARD_GRADIENT = accentGradient('green', 138.27);
// Code panel: near-black wash, faint frame + dense fill.
const codeGradient = (alpha: number) =>
  `linear-gradient(144.53deg, rgb(var(--code-bg) / ${alpha}) 11.72%, rgb(var(--shadow) / ${alpha}) 50.62%, rgb(var(--code-bg) / ${alpha}) 89.51%)`;
const CODE_FRAME_GRADIENT = codeGradient(0.1);
const CODE_FILL_GRADIENT = codeGradient(0.83);
const CODE_INSET_SHADOW = `inset ${u(3.4)} ${u(3.4)} ${u(21)} 0 rgb(var(--shadow) / 0.11)`;

const COPIED_RESET_MS = 1600;

export default function CodeSnippetWidget({ data, className = '' }: CodeSnippetWidgetProps) {
  const title = data?.title ?? DEFAULT_DATA.title;
  const language = data?.language ?? DEFAULT_DATA.language;
  const code = data?.code ?? DEFAULT_DATA.code;
  const date = data?.date ?? DEFAULT_DATA.date;

  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const langKey = language.trim().toLowerCase();
  const highlightLanguage = LANGUAGE_ALIASES[langKey] ?? (langKey in LANGUAGES ? langKey : 'text');

  const handleCopy = async (e: React.MouseEvent) => {
    // Cards open the item editor on click; copying shouldn't.
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), COPIED_RESET_MS);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={`w-full h-full [container-type:inline-size] ${className}`}>
      <div
        className="relative w-full h-full flex flex-col overflow-hidden border-solid border-accent-green-edge dark:!shadow-none"
        style={{
          backgroundImage: CARD_GRADIENT,
          borderWidth: u(0.86),
          borderRadius: radius('card'),
          boxShadow: `${u(3.4)} ${u(3.4)} ${u(21)} 0 rgb(var(--haze) / 0.25)`,
          backdropFilter: `blur(${u(1.719)})`,
          paddingTop: cardInset,
          paddingBottom: cardInset,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{ paddingLeft: space(7), paddingRight: space(10), gap: space(4) }}
        >
          <h2
            className="font-bold text-accent-green whitespace-nowrap overflow-hidden text-ellipsis"
            style={type('title')}
          >
            {title}
          </h2>
          <span
            className="text-ink-subtle whitespace-nowrap shrink-0"
            style={type('body')}
          >
            {language}
          </span>
        </div>

        {/* Code Block */}
        <div
          className="relative flex-1 min-h-0 border-solid border-accent-green-edge"
          style={{
            marginTop: space(3),
            marginLeft: space(6),
            marginRight: space(6),
            borderWidth: u(0.86),
            borderRadius: radius('card'),
            backgroundImage: CODE_FRAME_GRADIENT,
            boxShadow: CODE_INSET_SHADOW,
          }}
        >
          <div
            className="absolute inset-0 overflow-auto [scrollbar-width:thin] [scrollbar-color:rgb(var(--code-ink)/0.25)_transparent]"
            style={{
              borderRadius: radius('control'),
              backgroundImage: CODE_FILL_GRADIENT,
              boxShadow: CODE_INSET_SHADOW,
            }}
          >
            <SyntaxHighlighter
              language={highlightLanguage}
              style={oneDark}
              wrapLongLines
              customStyle={{
                margin: 0,
                padding: `${space(7)} ${space(6)}`,
                background: 'transparent',
                fontFamily: FONT.mono,
                fontSize: type('body').fontSize,
                fontWeight: 700,
                lineHeight: 'normal',
                color: 'rgb(var(--code-ink))',
                textShadow: 'none',
              }}
              codeTagProps={{
                style: { fontFamily: FONT.mono, fontSize: 'inherit', fontWeight: 'inherit', textShadow: 'none' },
              }}
            >
              {code}
            </SyntaxHighlighter>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{ marginTop: space(3), paddingLeft: space(7), paddingRight: space(5) }}
        >
          <span
            className="text-ink-subtle whitespace-nowrap"
            style={type('body')}
          >
            {date}
          </span>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? 'Code copied' : 'Copy code'}
            className={`flex items-center justify-between shrink-0 ${GLASS_CONTROL} ${GLASS_CONTROL_HOVER} text-control-ink transition-all duration-200`}
            style={{
              width: u(155.596),
              height: u(47.281),
              borderRadius: radius('control'),
              paddingLeft: space(4),
              paddingRight: space(4),
              boxShadow: glassShadow,
            }}
          >
            <span
              className="whitespace-nowrap"
              style={type('body')}
              aria-live="polite"
            >
              {copied ? 'Copied!' : 'Copy Code'}
            </span>
            {copied ? (
              <Check className="text-accent-green" style={{ width: u(22), height: u(21) }} strokeWidth={2.4} />
            ) : (
              <Copy style={{ width: u(22), height: u(21) }} strokeWidth={1.8} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export { CodeSnippetWidget };
