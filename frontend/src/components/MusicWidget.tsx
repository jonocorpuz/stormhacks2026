import React from 'react';
import { FastForward, Pause, Play, Rewind } from 'lucide-react';
import type { MusicWidgetData } from '../types/widgets';
import { spotifyUri } from '../model';
import { useMusicPlayback } from './useMusicPlayback';
import WidgetShell, { ShellPill } from './WidgetShell';
import { ON_PANEL, SHELL, widgetScale } from './widgetKit';

export interface MusicWidgetProps {
  data?: Partial<MusicWidgetData>;
  className?: string;
}

const DEFAULT_DATA: MusicWidgetData = {
  title: 'Brazil',
  artist: 'Declan McKenna',
  url: '',
  date: '02/20/2027',
};

// Record player on the solid-shell card (stormhacks-27, node 120:1121 "Group 54"), laid out
// 1x1 at 357px. Flat record from Figma node 120:1083.
// All sizes scale with the widget's width (container query units).
const DESIGN_WIDTH = 357;
const { u, space, type } = widgetScale(DESIGN_WIDTH);

// Figma: r128 disc centred 111px in from the right, 66px down; label r42 with a 28px ring.
const RECORD = { size: 256, right: -17, top: -62, label: 84, ring: 28 } as const;
const SEEK_SECONDS = 10;

export default function MusicWidget({ data, className = '' }: MusicWidgetProps) {
  const title = data?.title || DEFAULT_DATA.title;
  const artist = data?.artist || DEFAULT_DATA.artist;
  const date = data?.date || DEFAULT_DATA.date;
  const url = data?.url ?? '';
  // The song's own Spotify link, else a Spotify search for it.
  const spotifyUrl = spotifyUri(url)
    ? url
    : `https://open.spotify.com/search/${encodeURIComponent([title, artist].filter(Boolean).join(' '))}`;

  const { status, isPlaying, position, duration, toggle, seekBy, embedRef } = useMusicPlayback({ title, artist, url });
  const progress = duration > 0 ? Math.min(1, position / duration) : 0;
  const canPlay = status === 'ready';
  const playLabel =
    status === 'loading' ? 'Loading song' : status === 'unavailable' ? 'Song unavailable' : isPlaying ? 'Pause' : 'Play';

  // Buttons sit on the card, which opens the editor on click.
  const control = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };
  const CONTROL = `flex items-center justify-center ${ON_PANEL.primary} cursor-pointer transition-all duration-200 enabled:active:scale-95 disabled:cursor-default disabled:opacity-50`;
  const skipStyle = { width: u(22), height: u(22) };

  return (
    <WidgetShell
      designWidth={DESIGN_WIDTH}
      accent="red"
      className={className}
      footer={<ShellPill designWidth={DESIGN_WIDTH} href={spotifyUrl} label="Open in Spotify" text="Open in Spotify" />}
    >
      {/* Flat record (Figma node 120:1169): panel-tinted disc + label ring, cropped top-right. */}
      <div
        aria-hidden
        className="absolute pointer-events-none rounded-full bg-black/[0.11] flex items-center justify-center"
        style={{ right: u(RECORD.right), top: u(RECORD.top), width: u(RECORD.size), height: u(RECORD.size) }}
      >
        <div
          className="rounded-full border-solid border-black/[0.22] bg-accent-red-solid"
          style={{ width: u(RECORD.label), height: u(RECORD.label), borderWidth: u(RECORD.ring) }}
        />
      </div>

      {/* Spotify embed for Spotify links: kept in the DOM to play audio, never shown. */}
      <div
        ref={embedRef}
        aria-hidden
        className="absolute left-0 top-0 overflow-hidden opacity-0 pointer-events-none"
        style={{ width: 1, height: 1 }}
      />

      {/* Song, progress, controls, date */}
      <div
        className="absolute flex flex-col"
        style={{ left: u(SHELL.padX), right: u(SHELL.padX), bottom: u(SHELL.padX), gap: space(2) }}
      >
        <div className="min-w-0">
          <h2
            className={`font-bold ${ON_PANEL.primary} whitespace-nowrap overflow-hidden text-ellipsis`}
            style={type('display')}
          >
            {title}
          </h2>
          <p
            className={`${ON_PANEL.secondary} whitespace-nowrap overflow-hidden text-ellipsis`}
            style={type('body')}
          >
            {artist}
          </p>
        </div>

        <div
          role="progressbar"
          aria-label="Song progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          className="relative w-full rounded-full bg-white/30 overflow-hidden"
          style={{ height: u(5), marginTop: space(1) }}
        >
          <div className="absolute left-0 top-0 h-full rounded-full bg-white" style={{ width: `${progress * 100}%` }} />
        </div>

        {/* Controls, centred under the track */}
        <div className="flex items-center justify-center" style={{ gap: space(5) }}>
          <button
            type="button"
            onClick={control(() => seekBy(-SEEK_SECONDS))}
            disabled={!canPlay}
            aria-label={`Back ${SEEK_SECONDS} seconds`}
            className={`${CONTROL} enabled:hover:scale-110`}
            style={{ width: u(40), height: u(40) }}
          >
            <Rewind fill="currentColor" style={skipStyle} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={control(toggle)}
            disabled={!canPlay}
            aria-label={playLabel}
            title={status === 'unavailable' ? 'No playable version of this song found' : undefined}
            aria-pressed={isPlaying}
            className={`${CONTROL} enabled:hover:scale-105 rounded-full bg-white !text-accent-red-solid`}
            style={{ width: u(SHELL.control), height: u(SHELL.control) }}
          >
            {isPlaying ? (
              <Pause fill="currentColor" style={{ width: u(22), height: u(22) }} strokeWidth={1.5} />
            ) : (
              <Play fill="currentColor" style={{ width: u(22), height: u(22), marginLeft: u(2) }} strokeWidth={1.5} />
            )}
          </button>
          <button
            type="button"
            onClick={control(() => seekBy(SEEK_SECONDS))}
            disabled={!canPlay}
            aria-label={`Forward ${SEEK_SECONDS} seconds`}
            className={`${CONTROL} enabled:hover:scale-110`}
            style={{ width: u(40), height: u(40) }}
          >
            <FastForward fill="currentColor" style={skipStyle} strokeWidth={1.5} />
          </button>
        </div>

        <span className={`${ON_PANEL.faint} whitespace-nowrap`} style={type('caption')}>
          {date}
        </span>
      </div>
    </WidgetShell>
  );
}

export { MusicWidget };
