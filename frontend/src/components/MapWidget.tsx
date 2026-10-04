import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { MapWidgetData } from '../types/widgets';
import { GLASS_CONTROL, GLASS_CONTROL_HOVER, accentGradient, widgetScale } from './widgetKit';

export interface MapWidgetProps {
  data?: Partial<MapWidgetData>;
  className?: string;
}

const DEFAULT_DATA: MapWidgetData = {
  title: 'Nintendo Store',
  address: '10 Rockefeller Plaza, New York, NY 10020, United States',
  date: '03 / 10 / 26',
};

// Figma maps widget (stormhacks-27, "MacBook Pro 14" - 8", node 55:487 "Frame 6"),
// designed at 357px square. All sizes scale with the widget's width (container query units)
// so it keeps the design's proportions in any 1x1 bento cell.
const DESIGN_WIDTH = 357;
const { u, space, radius, type, glassShadow, cardInset } = widgetScale(DESIGN_WIDTH);

const PANEL_GRADIENT = accentGradient('blue', 157.97);

// The live map is rendered larger than the card and offset so Google's embed chrome
// (place box, zoom controls, attribution) is cropped away and the pin lands where the design has it.
const MAP_SIZE = 600;
const MAP_LEFT = -128;
const MAP_TOP = -160;
const MAP_ZOOM = 17;

export default function MapWidget({ data, className = '' }: MapWidgetProps) {
  const title = data?.title || DEFAULT_DATA.title;
  const address = data?.address || DEFAULT_DATA.address;
  const date = data?.date || DEFAULT_DATA.date;

  const query = encodeURIComponent([title, address].filter(Boolean).join(', '));
  const embedUrl = `https://maps.google.com/maps?q=${query}&z=${MAP_ZOOM}&output=embed`;
  const openUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

  return (
    <div className={`w-full h-full [container-type:inline-size] ${className}`}>
      <div
        className="relative w-full h-full overflow-hidden border border-accent-blue-edge bg-map-paper select-none"
        style={{ borderRadius: radius('card') }}
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

        {/* Open Maps Button */}
        <a
          href={openUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={`absolute flex items-center justify-between ${GLASS_CONTROL} ${GLASS_CONTROL_HOVER} text-control-ink transition-all duration-200`}
          style={{
            left: cardInset,
            top: cardInset,
            width: u(173),
            height: u(50),
            borderRadius: radius('control'),
            paddingLeft: space(6),
            paddingRight: space(6),
            backdropFilter: `blur(${u(6)})`,
            boxShadow: glassShadow,
          }}
        >
          <span
            className="whitespace-nowrap"
            style={type('body')}
          >
            Open Maps
          </span>
          <ArrowUpRight style={{ width: u(20), height: u(20) }} strokeWidth={1.8} />
        </a>

        {/* Location Panel */}
        <div
          className="absolute border-solid border-accent-blue-edge bg-surface/[0.83]"
          style={{
            left: u(21),
            bottom: cardInset,
            width: u(315.226),
            height: u(144.747),
            borderWidth: u(0.804),
            borderRadius: radius('control'),
            backdropFilter: `blur(${u(4)})`,
          }}
        >
          <div
            className="absolute inset-0 flex flex-col"
            style={{
              backgroundImage: PANEL_GRADIENT,
              borderRadius: radius('control'),
              paddingLeft: space(6),
              paddingTop: space(5),
              gap: space(2),
            }}
          >
            <h2
              className="font-bold text-accent-blue whitespace-nowrap overflow-hidden text-ellipsis"
              style={{ ...type('title'), width: u(236.419) }}
            >
              {title}
            </h2>
            <p
              className="text-accent-blue line-clamp-2"
              style={{ ...type('body'), width: u(236.419) }}
            >
              {address}
            </p>
            <span
              className="text-ink-subtle whitespace-nowrap"
              style={type('body')}
            >
              {date}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export { MapWidget };
