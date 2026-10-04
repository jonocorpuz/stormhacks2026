import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { TicketWidgetData } from '../types/widgets';
import divider from '../assets/ticket-widget/divider.svg';
import ticketmasterLogo from '../assets/ticket-widget/ticketmaster-logo.png';
import { ticketHref } from './ticketHref';
import { GLASS_CONTROL, GLASS_CONTROL_HOVER, accentGradient, widgetScale } from './widgetKit';

export interface TicketWidgetProps {
  data?: Partial<TicketWidgetData>;
  className?: string;
}

const DEFAULT_DATA: TicketWidgetData = {
  vendor: 'Ticketmaster',
  title: 'Bruno Mars - The Romantic Tour',
  eventDate: 'Oct 14, 2026',
  location: 'BC Place',
  entryInfo: 'LEVEL 4* ANY GATE',
  section: '416',
  row: 'B',
  seat: '110',
  url: '',
};

// Figma ticket (stormhacks-27, "MacBook Pro 14" - 8", node 65:498 "Frame 7"),
// designed at 732x355. All sizes scale with the widget's width (container query units)
// so it keeps the design's proportions in a 2x1 bento cell.
const DESIGN_WIDTH = 732;
const { u, space, radius, type, glassShadow, insetShadow, cardInset } = widgetScale(DESIGN_WIDTH);
// Content inset from the card's left/right edges.
const EDGE = space(7);

// Figma draws the card flipped horizontally, which mirrors its 156.86deg gradient to 203.14deg.
const CARD_GRADIENT = accentGradient('blue', 203.14);
const PILL_GRADIENT = accentGradient('blue', 170.01);

const BLUE = 'text-accent-blue-deep';
const GREY = 'text-ink-muted';
// Dark mode (Figma "Frame 8", 78:18): labels turn light grey + bold instead of blue.
const LABEL = `${BLUE} font-medium dark:text-ink-subtle dark:font-bold`;

export default function TicketWidget({ data, className = '' }: TicketWidgetProps) {
  const pick = <K extends keyof TicketWidgetData>(key: K) => data?.[key] || DEFAULT_DATA[key];
  const vendor = pick('vendor');
  const url = ticketHref(data?.url, vendor);
  const seating = [
    ['SECTION', pick('section')],
    ['ROW', pick('row')],
    ['SEAT', pick('seat')],
  ] as const;
  const details = [
    ['LOCATION', pick('location')],
    ['ENTRY INFO', pick('entryInfo')],
  ] as const;

  // Weight lives in classes (font-medium) so dark mode can switch labels to bold.
  const labelStyle = type('label');

  return (
    <div className={`w-full h-full [container-type:inline-size] ${className}`}>
      <div
        className="relative w-full h-full overflow-hidden border-solid border-accent-blue-edge select-none"
        style={{ backgroundImage: CARD_GRADIENT, borderWidth: u(0.916), borderRadius: radius('card') }}
      >
        {/* Vendor Badge */}
        <div
          className={`absolute flex items-center justify-center ${GLASS_CONTROL} overflow-hidden`}
          style={{ left: EDGE, top: cardInset, width: u(144), height: u(47), borderRadius: radius('control'), boxShadow: glassShadow }}
        >
          {/ticketmaster/i.test(vendor) ? (
            // Logo crop matches the design's "image 1" layer.
            <div className="relative overflow-hidden" style={{ width: u(109), height: u(17.06) }} role="img" aria-label="Ticketmaster">
              <img
                src={ticketmasterLogo}
                alt=""
                className="absolute left-0 max-w-none w-full pointer-events-none"
                style={{ height: '359.4%', top: '-132.61%' }}
              />
            </div>
          ) : (
            <span
              className={`font-bold italic ${BLUE} whitespace-nowrap overflow-hidden text-ellipsis`}
              style={{ ...type('body'), maxWidth: u(120) }}
            >
              {vendor}
            </span>
          )}
        </div>

        {/* Event */}
        <div
          className="absolute flex items-baseline justify-between"
          style={{ left: EDGE, right: EDGE, top: u(84), gap: space(6), ...type('title') }}
        >
          <h2 className={`font-bold ${BLUE} whitespace-nowrap overflow-hidden text-ellipsis`}>{pick('title')}</h2>
          <span className={`font-bold ${BLUE} whitespace-nowrap shrink-0`}>{pick('eventDate')}</span>
        </div>

        <img
          src={divider}
          alt=""
          width={732}
          height={1}
          className="absolute left-0 block max-w-none dark:hidden"
          style={{ top: u(132.5), width: u(732), height: u(1) }}
        />

        {/* Details */}
        <dl
          className="absolute grid"
          style={{ left: EDGE, right: EDGE, top: u(158), gridTemplateColumns: `${u(120)} 1fr`, rowGap: space(3) }}
        >
          {details.map(([label, value]) => (
            <React.Fragment key={label}>
              <dt className={LABEL} style={labelStyle}>{label}</dt>
              <dd className={`${GREY} font-medium whitespace-nowrap overflow-hidden text-ellipsis`} style={labelStyle}>{value}</dd>
            </React.Fragment>
          ))}
        </dl>

        {/* Seating */}
        <div className="absolute flex" style={{ left: EDGE, top: u(227), gap: space(4) }}>
          {seating.map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-center border border-accent-blue-edge overflow-hidden dark:border-transparent dark:!bg-none dark:!shadow-none"
              style={{
                width: u(215),
                height: u(43),
                borderRadius: radius('control'),
                gap: space(8),
                backgroundImage: PILL_GRADIENT,
                boxShadow: insetShadow,
              }}
            >
              <span className={LABEL} style={labelStyle}>{label}</span>
              <span className={`${GREY} font-medium whitespace-nowrap overflow-hidden text-ellipsis`} style={{ ...labelStyle, maxWidth: u(90) }}>
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* View Ticket */}
        <a
          href={url || undefined}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            // Cards open the item editor on click; this link shouldn't.
            e.stopPropagation();
            if (!url) e.preventDefault();
          }}
          aria-disabled={!url}
          className={`absolute flex items-center justify-between ${GLASS_CONTROL} text-control-ink transition-all duration-200 ${
            url ? GLASS_CONTROL_HOVER : 'opacity-60 dark:opacity-80 cursor-default'
          }`}
          style={{
            right: EDGE,
            bottom: cardInset,
            width: u(144),
            height: u(47),
            borderRadius: radius('control'),
            paddingLeft: space(3),
            paddingRight: space(3),
            boxShadow: glassShadow,
          }}
        >
          <span className="whitespace-nowrap" style={type('body')}>
            View Ticket
          </span>
          <ArrowUpRight style={{ width: u(20), height: u(20) }} strokeWidth={1.8} />
        </a>
      </div>
    </div>
  );
}

export { TicketWidget };
