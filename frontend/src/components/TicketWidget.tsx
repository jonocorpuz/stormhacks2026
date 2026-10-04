import React from 'react';
import type { TicketWidgetData } from '../types/widgets';
import ticketmasterLogo from '../assets/ticket-widget/ticketmaster-logo.png';
import ticketShape from '../assets/ticket-widget/ticket-watermark.svg';
import { ticketHref } from './ticketHref';
import WidgetShell, { ShellPill, Watermark } from './WidgetShell';
import { ON_PANEL, SHELL, widgetScale } from './widgetKit';

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

// Ticket on the solid-panel shell (Figma node 120:1121), 2x1 at 732 wide.
// All sizes scale with the widget's width (container query units).
const DESIGN_WIDTH = 732;
const { u, space, radius, type } = widgetScale(DESIGN_WIDTH);

// Wordmark crop from the design's "image 1" layer (109 x 17.06), shrunk to fit the pill.
const LOGO_WIDTH = 92;
const LOGO_HEIGHT = LOGO_WIDTH * (17.06 / 109);

// Figma ticket icon (node 123:66 "Subtract"): notches are real cut-outs.
const TICKET_WATERMARK = { src: ticketShape, width: 71, height: 40 };

const LABEL = `${ON_PANEL.secondary} font-bold`;
const VALUE = `${ON_PANEL.primary} whitespace-nowrap overflow-hidden text-ellipsis`;

export default function TicketWidget({ data, className = '' }: TicketWidgetProps) {
  // Sample data only for previews (no data). Real items show their own values, even empty ones.
  const pick = <K extends keyof TicketWidgetData>(key: K) => (data ? (data[key] ?? '') : DEFAULT_DATA[key]);
  const vendor = pick('vendor');
  const url = ticketHref(data?.url, vendor);
  const isTicketmaster = /ticketmaster/i.test(vendor);
  const seating = [
    ['SECTION', pick('section')],
    ['ROW', pick('row')],
    ['SEAT', pick('seat')],
  ] as const;
  const details = [
    ['LOCATION', pick('location')],
    ['ENTRY INFO', pick('entryInfo')],
  ] as const;

  const detailStyle = type('detail');

  const footer = isTicketmaster ? (
    <ShellPill
      designWidth={DESIGN_WIDTH}
      href={url}
      label="View ticket on Ticketmaster"
      logo={
        // White capsule: the wordmark is too wide for a round badge.
        <span
          className="relative shrink-0 flex items-center justify-center rounded-full bg-white"
          style={{ height: u(SHELL.logo), paddingLeft: space(3), paddingRight: space(3) }}
        >
          <span className="relative block overflow-hidden" style={{ width: u(LOGO_WIDTH), height: u(LOGO_HEIGHT) }} role="img" aria-label="Ticketmaster">
            <img
              src={ticketmasterLogo}
              alt=""
              className="absolute left-0 max-w-none w-full pointer-events-none"
              style={{ height: '359.4%', top: '-132.61%' }}
            />
          </span>
        </span>
      }
    />
  ) : (
    <ShellPill designWidth={DESIGN_WIDTH} href={url} label="View ticket" text="View ticket" />
  );

  return (
    <WidgetShell
      designWidth={DESIGN_WIDTH}
      accent="yellow"
      className={className}
      watermark={<Watermark designWidth={DESIGN_WIDTH} shape={TICKET_WATERMARK} right={20} top={15} />}
      footer={footer}
    >
      <div
        className="absolute flex flex-col"
        style={{ left: u(SHELL.padX + 6), right: u(SHELL.padX + 6), top: u(SHELL.padY), bottom: u(SHELL.padX + 4) }}
      >
        {/* Vendor */}
        <span className={`${ON_PANEL.faint} font-bold whitespace-nowrap overflow-hidden text-ellipsis`} style={type('caption')}>
          {vendor}
        </span>

        {/* Event */}
        <div className="flex items-baseline justify-between" style={{ gap: space(6), marginTop: space(1) }}>
          <h2 className={`font-bold ${VALUE}`} style={type('display')}>{pick('title')}</h2>
          <span className={`${ON_PANEL.primary} whitespace-nowrap shrink-0`} style={type('lead')}>{pick('eventDate')}</span>
        </div>

        {/* Details */}
        <dl
          className="grid"
          style={{ marginTop: space(3), gridTemplateColumns: `${u(110)} 1fr`, rowGap: space(1), ...detailStyle }}
        >
          {details.map(([label, value]) => (
            <React.Fragment key={label}>
              <dt className={LABEL}>{label}</dt>
              <dd className={VALUE}>{value}</dd>
            </React.Fragment>
          ))}
        </dl>

        {/* Seating */}
        <div className="flex mt-auto" style={{ gap: space(3) }}>
          {seating.map(([label, value]) => (
            <div
              key={label}
              className={`flex flex-1 min-w-0 items-center justify-center ${ON_PANEL.well}`}
              style={{
                height: u(42),
                borderRadius: radius('control'),
                gap: space(4),
                boxShadow: `inset 0 ${u(3)} ${u(3)} 0 rgb(var(--shadow) / 0.25)`,
                ...detailStyle,
              }}
            >
              <span className={LABEL}>{label}</span>
              <span className={`${VALUE} font-bold`} style={{ ...type('body'), maxWidth: u(90) }}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </WidgetShell>
  );
}

export { TicketWidget };
