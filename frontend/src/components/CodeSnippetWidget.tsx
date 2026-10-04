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
const u = (px: number) => `calc(${px} * 100cqw / ${DESIGN_WIDTH})`;

const CARD_GRADIENT =
  'linear-gradient(138.27deg, rgba(31, 203, 52, 0.1) 11.72%, rgba(31, 203, 52, 0.02) 50.62%, rgba(31, 203, 52, 0.1) 89.51%)';
const CODE_FRAME_GRADIENT =
  'linear-gradient(144.53deg, rgba(31, 38, 32, 0.1) 11.72%, rgba(0, 0, 0, 0.1) 50.62%, rgba(31, 38, 32, 0.1) 89.51%)';
const CODE_FILL_GRADIENT =
  'linear-gradient(144.53deg, rgba(22, 25, 22, 0.83) 11.72%, rgba(0, 0, 0, 0.83) 50.62%, rgba(22, 25, 22, 0.83) 89.51%)';
const TITLE_FONT = "'Alte Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const BODY_FONT = "Helvetica, 'Helvetica Neue', Arial, sans-serif";
const DATE_FONT = "'SF Pro', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, sans-serif";
const CODE_FONT = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

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
        className="relative w-full h-full flex flex-col overflow-hidden border-solid border-[#8EE799] dark:border-[#8EE799]/30 dark:!shadow-none"
        style={{
          backgroundImage: CARD_GRADIENT,
          borderWidth: u(0.86),
          borderRadius: u(25.789),
          boxShadow: `${u(3.439)} ${u(3.439)} ${u(20.975)} 0 rgba(144, 144, 144, 0.25)`,
          backdropFilter: `blur(${u(1.719)})`,
          paddingTop: u(59.05),
          paddingBottom: u(18.4),
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{ paddingLeft: u(28.65), paddingRight: u(38), gap: u(16) }}
        >
          <h2
            className="font-bold text-[#4B8735] whitespace-nowrap overflow-hidden text-ellipsis"
            style={{ fontFamily: TITLE_FONT, fontSize: u(27.509), lineHeight: u(34) }}
          >
            {title}
          </h2>
          <span
            className="text-[#C2BCBC] dark:text-white whitespace-nowrap shrink-0"
            style={{ fontFamily: BODY_FONT, fontSize: u(17.193), lineHeight: u(20) }}
          >
            {language}
          </span>
        </div>

        {/* Code Block */}
        <div
          className="relative flex-1 min-h-0 border-solid border-[#8EE799] dark:border-[#8EE799]/30"
          style={{
            marginTop: u(13.3),
            marginLeft: u(22),
            marginRight: u(23),
            borderWidth: u(0.86),
            borderRadius: u(25.789),
            backgroundImage: CODE_FRAME_GRADIENT,
            boxShadow: `inset ${u(3.439)} ${u(3.439)} ${u(20.975)} 0 rgba(0, 0, 0, 0.11)`,
          }}
        >
          <div
            className="absolute inset-0 overflow-auto [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.25)_transparent]"
            style={{
              borderRadius: u(17.193),
              backgroundImage: CODE_FILL_GRADIENT,
              boxShadow: `inset ${u(3.439)} ${u(3.439)} ${u(20.975)} 0 rgba(0, 0, 0, 0.11)`,
            }}
          >
            <SyntaxHighlighter
              language={highlightLanguage}
              style={oneDark}
              wrapLongLines
              customStyle={{
                margin: 0,
                padding: `${u(28.95)} ${u(23.72)}`,
                background: 'transparent',
                fontFamily: CODE_FONT,
                fontSize: u(17.193),
                fontWeight: 700,
                lineHeight: 'normal',
                color: '#FFFFFF',
                textShadow: 'none',
              }}
              codeTagProps={{
                style: { fontFamily: CODE_FONT, fontSize: 'inherit', fontWeight: 'inherit', textShadow: 'none' },
              }}
            >
              {code}
            </SyntaxHighlighter>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{ marginTop: u(13), paddingLeft: u(29), paddingRight: u(18.4) }}
        >
          <span
            className="text-[#C2BCBC] dark:text-white whitespace-nowrap"
            style={{ fontFamily: DATE_FONT, fontSize: u(17.193), lineHeight: u(21) }}
          >
            {date}
          </span>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? 'Code copied' : 'Copy code'}
            className="flex items-center justify-between shrink-0 bg-[rgba(220,220,220,0.2)] text-[#646464] dark:text-white cursor-pointer transition-all duration-200 hover:bg-[rgba(220,220,220,0.35)] active:scale-95"
            style={{
              width: u(155.596),
              height: u(47.281),
              borderRadius: u(16.12),
              paddingLeft: u(15.47),
              paddingRight: u(16.7),
              boxShadow: `${u(1.612)} ${u(0.806)} ${u(12.735)} 0 rgba(0, 0, 0, 0.07), inset ${u(-0.806)} 0 ${u(42.639)} ${u(11.175)} rgba(255, 255, 255, 0.52)`,
            }}
          >
            <span
              className="whitespace-nowrap"
              style={{ fontFamily: BODY_FONT, fontSize: u(17.193), lineHeight: u(20) }}
              aria-live="polite"
            >
              {copied ? 'Copied!' : 'Copy Code'}
            </span>
            {copied ? (
              <Check className="text-[#4B8735]" style={{ width: u(22), height: u(21) }} strokeWidth={2.4} />
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
