import React, { useEffect, useState } from 'react';
import { ArrowUpRight, FastForward, Pause, Play, Rewind } from 'lucide-react';
import type { MusicWidgetData } from '../types/widgets';
import vinyl from '../assets/music-widget/vinyl.svg';
import playButton from '../assets/music-widget/play-button.svg';
import track from '../assets/music-widget/track.svg';
import progressLine from '../assets/music-widget/progress.svg';
import spotifyLogo from '../assets/music-widget/spotify-logo.png';

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

// Figma record player (stormhacks-27, "MacBook Pro 14" - 8", node 65:636 "Group 28"),
// designed at 357x357. All sizes scale with the widget's width (container query units)
// so it keeps the design's proportions in a 1x1 bento cell.
const DESIGN_WIDTH = 357;
const u = (px: number) => `calc(${px} * 100cqw / ${DESIGN_WIDTH})`;

const CARD_GRADIENT =
  'linear-gradient(138.62deg, rgba(255, 64, 0, 0.1) 11.72%, rgba(254, 89, 34, 0.02) 50.62%, rgba(254, 89, 34, 0.1) 89.51%)';
const TITLE_FONT = "'Alte Haas Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const SF_FONT = "'SF Pro', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, sans-serif";
const GLASS_SHADOW = `${u(1.612)} ${u(0.806)} ${u(12.735)} 0 rgba(0, 0, 0, 0.07), inset ${u(-0.806)} 0 ${u(42.639)} 0 rgba(255, 255, 255, 0.52)`;

// Track bar spans 282 design px. The design shows 129 of it played.
const TRACK_LENGTH = 282;
const INITIAL_PROGRESS = 129 / TRACK_LENGTH;
// There's no audio, so playback is simulated over a typical song length.
const SONG_SECONDS = 210;
const SEEK_SECONDS = 10;
const TICK_MS = 250;

const PINK = 'text-[#DA7777]';

export default function MusicWidget({ data, className = '' }: MusicWidgetProps) {
  const title = data?.title || DEFAULT_DATA.title;
  const artist = data?.artist || DEFAULT_DATA.artist;
  const date = data?.date || DEFAULT_DATA.date;
  const url = data?.url ?? '';

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(INITIAL_PROGRESS);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setProgress((p) => {
        const next = p + TICK_MS / 1000 / SONG_SECONDS;
        if (next >= 1) {
          setIsPlaying(false);
          return 1;
        }
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [isPlaying]);

  // Cards open the item editor on click; the controls shouldn't.
  const control = (action: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    action();
  };
  const seek = (seconds: number) => setProgress((p) => Math.min(1, Math.max(0, p + seconds / SONG_SECONDS)));
  const togglePlay = () => {
    if (!isPlaying && progress >= 1) setProgress(0);
    setIsPlaying((playing) => !playing);
  };

  // Progress line keeps its rounded caps, so never draw it shorter than its stroke.
  const playedLength = Math.max(5, progress * TRACK_LENGTH);
  const skipStyle = { width: u(30), height: u(30) };

  return (
    <div className={`w-full h-full [container-type:inline-size] ${className}`}>
      <div
        className="relative w-full h-full overflow-hidden border-solid border-[#FFD9CC] dark:border-[#FFD9CC]/30 select-none"
        style={{ backgroundImage: CARD_GRADIENT, borderWidth: u(0.834), borderRadius: u(25.009) }}
      >
        {/* Vinyl, centred on the card's top edge so only its lower half shows */}
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{ left: u(178 - 141.14), top: u(-141.14), width: u(282.28), height: u(282.28) }}
        >
          <img
            src={vinyl}
            alt=""
            width={282.28}
            height={282.28}
            className="block max-w-none rotate-[40.04deg] animate-[spin_6s_linear_infinite]"
            style={{
              width: u(282.28),
              height: u(282.28),
              animationPlayState: isPlaying ? 'running' : 'paused',
            }}
          />
        </div>

        {/* Song */}
        <div className="absolute" style={{ left: u(38), right: u(38), top: u(149) }}>
          <h2
            className={`font-bold ${PINK} whitespace-nowrap overflow-hidden text-ellipsis`}
            style={{ fontFamily: TITLE_FONT, fontSize: u(20), lineHeight: u(24) }}
          >
            {title}
          </h2>
          <p
            className="font-[510] text-[#646464] dark:text-white whitespace-nowrap overflow-hidden text-ellipsis"
            style={{ fontFamily: SF_FONT, fontSize: u(14), lineHeight: u(17), marginTop: u(6) }}
          >
            {artist}
          </p>
        </div>

        {/* Progress */}
        <div
          role="progressbar"
          aria-label="Song progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          className="absolute"
          style={{ left: u(37), top: u(213), width: u(TRACK_LENGTH), height: u(5) }}
        >
          <img src={track} alt="" width={282} height={5} className="absolute left-0 top-0 block max-w-none" style={{ width: u(282), height: u(5) }} />
          <div className="absolute top-0 overflow-hidden" style={{ left: u(1), width: u(playedLength), height: u(5) }}>
            {/* Stretch the played line; preserveAspectRatio="none" keeps its stroke height. */}
            <img src={progressLine} alt="" width={129} height={5} className="absolute left-0 top-0 block max-w-none" style={{ width: u(playedLength), height: u(5) }} />
          </div>
        </div>

        {/* Controls */}
        <button
          type="button"
          onClick={control(() => seek(-SEEK_SECONDS))}
          aria-label={`Back ${SEEK_SECONDS} seconds`}
          className={`absolute flex items-center justify-center ${PINK} cursor-pointer transition-transform duration-200 hover:scale-110 active:scale-95`}
          style={{ left: u(91), top: u(236), width: u(44), height: u(40) }}
        >
          <Rewind fill="currentColor" style={skipStyle} strokeWidth={1.5} />
        </button>

        <button
          type="button"
          onClick={control(togglePlay)}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          aria-pressed={isPlaying}
          className={`absolute flex items-center justify-center ${PINK} cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95`}
          style={{ left: u(152), top: u(228), width: u(55), height: u(55) }}
        >
          <img
            src={playButton}
            alt=""
            width={84.6278}
            height={84.6278}
            className="absolute block max-w-none pointer-events-none"
            style={{ left: u(-12.94), top: u(-13.88), width: u(84.6278), height: u(84.6278) }}
          />
          {isPlaying ? (
            <Pause className="relative" fill="currentColor" style={{ width: u(26), height: u(26) }} strokeWidth={1.5} />
          ) : (
            <Play className="relative" fill="currentColor" style={{ width: u(24), height: u(24), marginLeft: u(3) }} strokeWidth={1.5} />
          )}
        </button>

        <button
          type="button"
          onClick={control(() => seek(SEEK_SECONDS))}
          aria-label={`Forward ${SEEK_SECONDS} seconds`}
          className={`absolute flex items-center justify-center ${PINK} cursor-pointer transition-transform duration-200 hover:scale-110 active:scale-95`}
          style={{ left: u(224), top: u(236), width: u(44), height: u(40) }}
        >
          <FastForward fill="currentColor" style={skipStyle} strokeWidth={1.5} />
        </button>

        {/* Footer */}
        <span
          className="absolute text-[#C2BCBC] dark:text-white whitespace-nowrap"
          style={{ left: u(25), top: u(305), fontFamily: SF_FONT, fontSize: u(16.104), lineHeight: u(19) }}
        >
          {date}
        </span>

        <a
          href={url || undefined}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            // Cards open the item editor on click; this link shouldn't.
            e.stopPropagation();
            if (!url) e.preventDefault();
          }}
          aria-label="Listen on Spotify"
          aria-disabled={!url}
          className={`absolute flex items-center justify-between bg-[rgba(220,220,220,0.2)] text-[#646464] dark:text-[#3F3F3F] transition-all duration-200 ${
            url ? 'hover:bg-[rgba(220,220,220,0.35)] active:scale-95' : 'opacity-60 dark:opacity-80 cursor-default'
          }`}
          style={{
            left: u(248),
            top: u(285),
            width: u(83),
            height: u(47),
            borderRadius: u(62),
            paddingLeft: u(13),
            paddingRight: u(13),
            boxShadow: GLASS_SHADOW,
          }}
        >
          {/* Logo crop matches the design's "Spotify_App_Logo.svg 2" layer, masked to a circle. */}
          <span className="relative block overflow-hidden rounded-full shrink-0" style={{ width: u(31), height: u(31) }}>
            <img
              src={spotifyLogo}
              alt=""
              className="absolute max-w-none pointer-events-none"
              style={{ left: '-14.29%', top: '-13.58%', width: '128.57%', height: '130.4%' }}
            />
          </span>
          <ArrowUpRight style={{ width: u(20), height: u(20) }} strokeWidth={1.8} />
        </a>
      </div>
    </div>
  );
}

export { MusicWidget };
