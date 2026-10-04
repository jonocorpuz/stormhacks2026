import React from 'react';
import pin from '../assets/map-widget/pin.svg';
import type { MapWidgetData } from '../types/widgets';
import WidgetShell, { ShellPill, Watermark } from './WidgetShell';
import { ON_PANEL, widgetScale } from './widgetKit';

export interface MapWidgetProps {
  data?: Partial<MapWidgetData>;
  className?: string;
}

const DEFAULT_DATA: MapWidgetData = {
  title: 'Nintendo Store',
  address: '10 Rockefeller Plaza, New York, NY 10020, United States',
  date: '03 / 10 / 26',
};

// Figma maps widget (stormhacks-27, node 55:487 "Frame 6") on the solid-panel shell (node 120:1121):
// the map is the panel, with a solid blue info card over it. Designed at 357px square; sizes
// scale with the widget's width (container query units).
const DESIGN_WIDTH = 357;
const { u, space, radius, type } = widgetScale(DESIGN_WIDTH);

// The live map is rendered larger than the panel and offset so Google's embed chrome
// (place box, zoom controls, attribution) is cropped away and the pin sits above the info card.
const MAP_SIZE = 600;
const MAP_LEFT = -136;
const MAP_TOP = -200;
const MAP_ZOOM = 17;

// Figma pin icon (node 144:123 "Frame 62"); its centre dot is painted, so the mask cuts it.
const PIN_WATERMARK = { src: pin, width: 50, height: 71.9812, hole: { cx: 24.5, cy: 24.5, r: 13.5 } };

export default function MapWidget({ data, className = '' }: MapWidgetProps) {
  // Sample data only for previews (no data). Real items show their own values, even empty ones.
  const src = data ?? DEFAULT_DATA;
  const title = src.title ?? '';
  const address = src.address ?? '';
  const date = src.date ?? '';

  const query = encodeURIComponent([title, address].filter(Boolean).join(', '));
  const embedUrl = `https://maps.google.com/maps?q=${query}&z=${MAP_ZOOM}&output=embed`;
  const openUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

  return (
    <WidgetShell
      designWidth={DESIGN_WIDTH}
      accent="blue"
      className={className}
      panelClassName="!bg-map-paper"
      footer={<ShellPill designWidth={DESIGN_WIDTH} href={openUrl} label="Open in Maps" text="Open in Maps" />}
    >
      {/* Map */}
      <iframe
        title={`Map of ${title}`}
        src={embedUrl}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        tabIndex={-1}
        aria-hidden
        className="absolute border-0 pointer-events-none dark:invert-[90%] dark:hue-rotate-180"
        style={{ width: u(MAP_SIZE), height: u(MAP_SIZE), left: u(MAP_LEFT), top: u(MAP_TOP) }}
      />

      {/* Location Card */}
      <div
        className="absolute overflow-hidden bg-accent-blue-solid flex flex-col"
        style={{
          left: space(3),
          right: space(3),
          bottom: space(3),
          borderRadius: radius('control'),
          padding: `${space(4)} ${space(5)}`,
          gap: space(1),
        }}
      >
        <Watermark designWidth={DESIGN_WIDTH} shape={PIN_WATERMARK} size={120} />
        <h2
          className={`relative font-bold ${ON_PANEL.primary} whitespace-nowrap overflow-hidden text-ellipsis`}
          style={type('title')}
        >
          {title}
        </h2>
        <p className={`relative ${ON_PANEL.secondary} line-clamp-2`} style={type('label')}>
          {address}
        </p>
        <span className={`relative ${ON_PANEL.faint} whitespace-nowrap`} style={type('caption')}>
          {date}
        </span>
      </div>
    </WidgetShell>
  );
}

export { MapWidget };
