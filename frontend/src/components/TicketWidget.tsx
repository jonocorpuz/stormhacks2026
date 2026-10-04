import React from 'react';
import GrainOverlay from './GrainOverlay';
import { ArrowUpRight } from 'lucide-react';
import type { TicketWidgetData } from '../types/widgets';
import divider from '../assets/ticket-widget/divider.svg';
import ticketmasterLogo from '../assets/ticket-widget/ticketmaster-logo.png';

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
const u = (px: number) => `calc(${px} * 100cqw / ${DESIGN_WIDTH})`;

// Figma draws the card flipped horizontally, which mirrors its 156.86deg gradient to 203.14deg.
const CARD_GRADIENT =
  'linear-gradient(203.14deg, rgba(34, 148, 254, 0.1) 11.72%, rgba(34, 148, 254, 0.02) 50.62%, rgba(34, 148, 254, 0.1) 89.51%)';
const PILL_GRADIENT =
  'linear-gradient(170.01deg, rgba(34, 148, 254, 0.1) 11.72%, rgba(34, 148, 254, 0.02) 50.62%, rgba(34, 148, 254, 0.1) 89.51%)';
const TITLE_FONT = "'Alte Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const BODY_FONT = "Helvetica, 'Helvetica Neue', Arial, sans-serif";
const SF_FONT = "'SF Pro', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, sans-serif";
const GLASS_SHADOW = `${u(1.612)} ${u(0.806)} ${u(12.735)} 0 rgba(0, 0, 0, 0.07), inset ${u(-0.806)} 0 ${u(42.639)} ${u(11.175)} rgba(255, 255, 255, 0.52)`;

const BLUE = 'text-[#006CE3]';
const GREY = 'text-[#646464] dark:text-white';
// Dark mode (Figma "Frame 8", 78:18): labels turn light grey + bold instead of blue.
const LABEL = `${BLUE} font-[510] dark:text-[#BDBDBD] dark:font-bold`;

export default function TicketWidget({ data, className = '' }: TicketWidgetProps) {
  const pick = <K extends keyof TicketWidgetData>(key: K) => data?.[key] || DEFAULT_DATA[key];
  const vendor = pick('vendor');
  const url = data?.url ?? '';
  const seating = [
    ['SECTION', pick('section')],
    ['ROW', pick('row')],
    ['SEAT', pick('seat')],
  ] as const;
  const details = [
    ['LOCATION', pick('location')],
    ['ENTRY INFO', pick('entryInfo')],
  ] as const;

  // Weight lives in classes (font-[510]) so dark mode can switch labels to bold.
  const labelStyle = { fontFamily: SF_FONT, fontSize: u(14), lineHeight: u(17) };

  return (
    <div className={`w-full h-full [container-type:inline-size] ${className}`}>
      <div
        className="relative w-full h-full overflow-hidden border-solid border-[#8AC6FF] dark:border-[#8AC6FF]/30 select-none"
        style={{ backgroundImage: CARD_GRADIENT, borderWidth: u(0.916), borderRadius: u(27.484) }}
      >
        <GrainOverlay />
        {/* Vendor Badge */}
        <div
          className="absolute flex items-center justify-center bg-[rgba(220,220,220,0.2)] overflow-hidden"
          style={{ left: u(29), top: u(20), width: u(144), height: u(47), borderRadius: u(16.12), boxShadow: GLASS_SHADOW }}
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
              style={{ fontFamily: TITLE_FONT, fontSize: u(18), lineHeight: u(22), maxWidth: u(120) }}
            >
              {vendor}
            </span>
          )}
        </div>

        {/* Event */}
        <div
          className="absolute flex items-baseline justify-between"
          style={{ left: u(29), right: u(30), top: u(84), gap: u(24), fontFamily: TITLE_FONT, fontSize: u(20), lineHeight: u(24) }}
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
          style={{ left: u(29), right: u(30), top: u(158), gridTemplateColumns: `${u(120)} 1fr`, rowGap: u(13) }}
        >
          {details.map(([label, value]) => (
            <React.Fragment key={label}>
              <dt className={LABEL} style={labelStyle}>{label}</dt>
              <dd className={`${GREY} font-[510] whitespace-nowrap overflow-hidden text-ellipsis`} style={labelStyle}>{value}</dd>
            </React.Fragment>
          ))}
        </dl>

        {/* Seating */}
        <div className="absolute flex" style={{ left: u(29), top: u(227), gap: u(14) }}>
          {seating.map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-center border border-[#8AC6FF] overflow-hidden dark:border-transparent dark:!bg-none dark:!shadow-none"
              style={{
                width: u(215),
                height: u(43),
                borderRadius: u(16),
                gap: u(31.5),
                backgroundImage: PILL_GRADIENT,
                boxShadow: `inset ${u(4)} ${u(4)} ${u(24.4)} 0 rgba(144, 144, 144, 0.11)`,
              }}
            >
              <span className={LABEL} style={labelStyle}>{label}</span>
              <span className={`${GREY} font-[510] whitespace-nowrap overflow-hidden text-ellipsis`} style={{ ...labelStyle, maxWidth: u(90) }}>
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
          className={`absolute flex items-center justify-between bg-[rgba(220,220,220,0.2)] ${GREY} dark:text-[#3F3F3F] transition-all duration-200 ${
            url ? 'hover:bg-[rgba(220,220,220,0.35)] active:scale-95' : 'opacity-60 dark:opacity-80 cursor-default'
          }`}
          style={{
            right: u(30),
            top: u(287),
            width: u(144),
            height: u(47),
            borderRadius: u(16.12),
            paddingLeft: u(12),
            paddingRight: u(14),
            boxShadow: GLASS_SHADOW,
          }}
        >
          <span className="whitespace-nowrap" style={{ fontFamily: BODY_FONT, fontSize: u(16), lineHeight: u(18) }}>
            View Ticket
          </span>
          <ArrowUpRight style={{ width: u(20), height: u(20) }} strokeWidth={1.8} />
        </a>
      </div>
    </div>
  );
}

export { TicketWidget };
