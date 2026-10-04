import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight } from 'lucide-react';
import logoCircle from '../assets/widget-shell/logo-circle.svg';
import { SHELL, SOLID_PANEL, type Accent, widgetScale } from './widgetKit';

// Figma "Group 54" (stormhacks-27, node 120:1121): themed shell → solid accent panel → footer
// of dark round controls. Shell sizes are in 1x1 design px (357 wide); pass the widget's own
// design width so a 2x1 card keeps the same physical shell.

export interface WidgetShellProps {
  designWidth: number;
  // Solid panel colour. Omit to lay content straight on the shell (place your own SolidPanel inside).
  accent?: Accent;
  // Huge 5% mark in the panel's top-right corner.
  watermark?: React.ReactNode;
  // Footer controls (ShellIconButton / ShellPill). Omit to let the panel fill the shell.
  footer?: React.ReactNode;
  // Panel content. Positioned freely: the panel is `relative` and clips.
  children: React.ReactNode;
  panelClassName?: string;
  panelStyle?: React.CSSProperties;
  className?: string;
}

export default function WidgetShell({
  designWidth,
  accent,
  watermark,
  footer,
  children,
  panelClassName = '',
  panelStyle,
  className = '',
}: WidgetShellProps) {
  const { u } = widgetScale(designWidth);
  return (
    <div className={`w-full h-full [container-type:inline-size] ${className}`}>
      <div
        className="relative w-full h-full flex flex-col bg-shell select-none"
        style={{
          borderRadius: `${u(SHELL.radius)} ${u(SHELL.radius)} ${u(SHELL.cornerRadius)} ${u(SHELL.radius)}`,
          boxShadow: `${u(SHELL.shadowX)} ${u(SHELL.shadowY)} 0 0 rgb(var(--shadow) / 0.25)`,
          padding: u(SHELL.inset),
          paddingBottom: footer ? u(SHELL.footerBottom) : u(SHELL.inset),
          gap: u(SHELL.footerGap),
        }}
      >
        {accent ? (
          <SolidPanel
            designWidth={designWidth}
            accent={accent}
            className={`flex-1 min-h-0 ${panelClassName}`}
            style={panelStyle}
          >
            {watermark}
            {children}
          </SolidPanel>
        ) : (
          <div className={`relative flex-1 min-h-0 text-ink ${panelClassName}`} style={panelStyle}>
            {children}
          </div>
        )}

        {footer && (
          <div className="flex items-center shrink-0" style={{ height: u(SHELL.control), gap: u(SHELL.footerGap) }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// Solid accent panel with Figma's inset shadow drawn above its content.
export function SolidPanel({
  designWidth,
  accent,
  className = '',
  style,
  children,
}: {
  designWidth: number;
  accent: Accent;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const { u } = widgetScale(designWidth);
  return (
    <div
      className={`relative overflow-hidden text-white ${SOLID_PANEL[accent]} ${className}`}
      style={{ borderRadius: u(SHELL.panelRadius), ...style }}
    >
      {children}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none rounded-[inherit]"
        style={{ boxShadow: `inset 0 ${u(3)} ${u(3)} 0 rgb(var(--shadow) / 0.25)` }}
      />
    </div>
  );
}

// ---- Watermark -------------------------------------------------------------------------------

export function Watermark({
  designWidth,
  glyph,
  icon: Icon,
  size = 260,
}: {
  designWidth: number;
  glyph?: string;
  icon?: LucideIcon;
  size?: number;
}) {
  const { u } = widgetScale(designWidth);
  return (
    <div
      aria-hidden
      className="absolute pointer-events-none text-black opacity-[0.05] leading-none whitespace-nowrap font-sans"
      style={{ right: u(-size * 0.12), top: u(-size * 0.14) }}
    >
      {Icon ? (
        <Icon style={{ width: u(size), height: u(size) }} strokeWidth={2} />
      ) : (
        <span className="block" style={{ fontSize: u(size * 1.3), lineHeight: 1 }}>
          {glyph}
        </span>
      )}
    </div>
  );
}

// ---- Footer controls -------------------------------------------------------------------------

const CONTROL_CLASS =
  'relative shrink-0 flex items-center bg-shell-control text-shell-control-ink rounded-full transition-all duration-200';
const CONTROL_ACTIVE = 'cursor-pointer hover:brightness-110 dark:hover:brightness-125 active:scale-95';
const CONTROL_DISABLED = 'opacity-60 cursor-default';

const controlShadow = (u: (px: number) => string) => `${u(1.7)} ${u(0.85)} ${u(6.7)} 0 rgb(var(--shadow) / 0.07)`;

// Round icon button (Figma "Ellipse 11" + SF symbol). Stops propagation: cards open the editor on click.
export function ShellIconButton({
  designWidth,
  label,
  onClick,
  disabled,
  title,
  text,
  children,
}: {
  designWidth: number;
  label: string;
  // Tooltip; defaults to the label.
  title?: string;
  // Visible text after the icon; turns the circle into a pill.
  text?: string;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  const { u, type } = widgetScale(designWidth);
  return (
    <button
      type="button"
      aria-label={label}
      title={title ?? label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      className={`${CONTROL_CLASS} justify-center ${disabled ? CONTROL_DISABLED : CONTROL_ACTIVE}`}
      style={{
        height: u(SHELL.control),
        ...(text
          ? { minWidth: u(SHELL.pillMinWidth), gap: u(10), paddingLeft: u(18), paddingRight: u(18) }
          : { width: u(SHELL.control) }),
        boxShadow: controlShadow(u),
      }}
    >
      {children}
      {text && (
        <span className="whitespace-nowrap" style={type('body')}>
          {text}
        </span>
      )}
    </button>
  );
}

// Pill link (Figma frame 120:1076): optional logo badge + ↗. Falls back to a label when no logo.
export function ShellPill({
  designWidth,
  href,
  label,
  logo,
  text,
  grow,
}: {
  designWidth: number;
  href?: string;
  label: string;
  logo?: React.ReactNode;
  text?: string;
  grow?: boolean;
}) {
  const { u, type } = widgetScale(designWidth);
  return (
    <a
      href={href || undefined}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      aria-disabled={!href}
      onClick={(e) => {
        e.stopPropagation();
        if (!href) e.preventDefault();
      }}
      className={`${CONTROL_CLASS} justify-between min-w-0 ${href ? CONTROL_ACTIVE : CONTROL_DISABLED} ${grow ? 'flex-1' : ''}`}
      style={{
        height: u(SHELL.control),
        minWidth: u(SHELL.pillMinWidth),
        gap: u(10),
        paddingLeft: logo ? u(9) : u(18),
        paddingRight: u(13),
        boxShadow: controlShadow(u),
      }}
    >
      {logo}
      {text && (
        <span className="whitespace-nowrap overflow-hidden text-ellipsis" style={type('body')}>
          {text}
        </span>
      )}
      <ArrowUpRight className="shrink-0" style={{ width: u(22), height: u(22) }} strokeWidth={1.8} />
    </a>
  );
}

// White circular badge holding a brand logo (Figma "Ellipse 41" + masked logo).
export function LogoBadge({
  designWidth,
  children,
}: {
  designWidth: number;
  children: React.ReactNode;
}) {
  const { u } = widgetScale(designWidth);
  const size = u(SHELL.logo);
  return (
    <span className="relative shrink-0 block overflow-hidden rounded-full" style={{ width: size, height: size }}>
      <img
        src={logoCircle}
        alt=""
        width={44.2552}
        height={44.2552}
        className="absolute inset-0 block max-w-none"
        style={{ width: size, height: size }}
      />
      {children}
    </span>
  );
}
