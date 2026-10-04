import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { MapWidgetData } from '../types/widgets';

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
const u = (px: number) => `calc(${px} * 100cqw / ${DESIGN_WIDTH})`;

const PANEL_GRADIENT =
  'linear-gradient(157.97deg, rgba(34, 148, 254, 0.1) 11.72%, rgba(225, 235, 244, 0.1) 50.62%, rgba(34, 148, 254, 0.1) 89.51%)';
const TITLE_FONT = "'Alte Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const BODY_FONT = "Helvetica, 'Helvetica Neue', Arial, sans-serif";
const SF_FONT = "'SF Pro', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, sans-serif";

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
        className="relative w-full h-full overflow-hidden border border-[#8AC6FF] bg-[#F2EFE9] select-none"
        style={{ borderRadius: u(23) }}
      >
        {/* Map */}
        <iframe
          title={`Map of ${title}`}
          src={embedUrl}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          tabIndex={-1}
          aria-hidden
          className="absolute border-0 pointer-events-none"
          style={{ width: u(MAP_SIZE), height: u(MAP_SIZE), left: u(MAP_LEFT), top: u(MAP_TOP) }}
        />

        {/* Open Maps Button */}
        <a
          href={openUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="absolute flex items-center justify-between bg-[rgba(220,220,220,0.2)] text-[#646464] transition-all duration-200 hover:bg-[rgba(220,220,220,0.35)] active:scale-95"
          style={{
            left: u(25),
            top: u(28),
            width: u(173),
            height: u(50),
            borderRadius: u(17.179),
            paddingLeft: u(23.82),
            paddingRight: u(23),
            backdropFilter: `blur(${u(6)})`,
            boxShadow: `${u(1.718)} ${u(0.859)} ${u(13.572)} 0 rgba(0, 0, 0, 0.07), inset ${u(-0.859)} 0 ${u(45.441)} ${u(11.91)} rgba(255, 255, 255, 0.52)`,
          }}
        >
          <span
            className="whitespace-nowrap"
            style={{ fontFamily: BODY_FONT, fontSize: u(18.323), lineHeight: u(21) }}
          >
            Open Maps
          </span>
          <ArrowUpRight style={{ width: u(20), height: u(20) }} strokeWidth={1.8} />
        </a>

        {/* Location Panel */}
        <div
          className="absolute border-solid border-[#8AC6FF] bg-[rgba(255,255,255,0.83)]"
          style={{
            left: u(21),
            top: u(187),
            width: u(315.226),
            height: u(144.747),
            borderWidth: u(0.804),
            borderRadius: u(14.475),
            backdropFilter: `blur(${u(4)})`,
          }}
        >
          <div
            className="absolute inset-0 flex flex-col"
            style={{
              backgroundImage: PANEL_GRADIENT,
              borderRadius: u(14.475),
              paddingLeft: u(23.32),
              paddingTop: u(19.9),
              gap: u(10),
            }}
          >
            <h2
              className="font-bold text-[#2294FE] whitespace-nowrap overflow-hidden text-ellipsis"
              style={{ fontFamily: TITLE_FONT, fontSize: u(20), lineHeight: u(24), width: u(236.419) }}
            >
              {title}
            </h2>
            <p
              className="text-[#2294FE] line-clamp-2"
              style={{ fontFamily: SF_FONT, fontSize: u(16.083), lineHeight: u(19), width: u(236.419) }}
            >
              {address}
            </p>
            <span
              className="text-[#A2A2A2] whitespace-nowrap"
              style={{ fontFamily: SF_FONT, fontSize: u(12.866), lineHeight: u(15) }}
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
