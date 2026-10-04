import React from 'react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
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

// Prism tokens only: no inline styles, so colours come from the .code-highlight rules in index.css
// (theme tokens, like everything else). Light build: only the grammars registered here are bundled.
const LANGUAGES = { bash, css, go, java, javascript, json, jsx, python, rust, sql, tsx, typescript };
Object.entries(LANGUAGES).forEach(([name, grammar]) => SyntaxHighlighter.registerLanguage(name, grammar));

const LANGUAGE_ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
};

/** Free-text language label (e.g. "TS", "python") → registered grammar, or 'text' (no highlighting). */
export function grammarFor(language: string): string {
  const key = language.trim().toLowerCase();
  return LANGUAGE_ALIASES[key] ?? (key in LANGUAGES ? key : 'text');
}

// Drop-in for the plain <code> inside a <pre>: the caller's <pre> keeps owning layout and font.
export default function HighlightedCode({ code, language }: { code: string; language: string }) {
  return (
    <SyntaxHighlighter
      language={grammarFor(language)}
      useInlineStyles={false}
      PreTag="span"
      CodeTag="code"
      wrapLongLines
      // Inherit the caller's <pre> wrapping (pre-wrap + break-words); the library defaults to no wrap.
      codeTagProps={{ className: 'code-highlight', style: { fontFamily: 'inherit', whiteSpace: 'inherit', overflowWrap: 'inherit' } }}
    >
      {code}
    </SyntaxHighlighter>
  );
}
