import { useCallback, useEffect, useRef, useState } from 'react';
import { itunesPreviewSearchUrl, spotifyUri } from '../model';

// Plays a saved song from wherever we can:
// - Spotify link -> hidden Spotify embed driven through its iFrame API (full song when the
//   browser is logged into Spotify, otherwise Spotify's preview).
// - otherwise -> 30s iTunes preview found by title + artist.

export type PlaybackStatus = 'loading' | 'ready' | 'unavailable';

export interface MusicPlayback {
  status: PlaybackStatus;
  isPlaying: boolean;
  /** Seconds. */
  position: number;
  /** Seconds; 0 until known. */
  duration: number;
  toggle(): void;
  seekBy(seconds: number): void;
  /** Mount point for the Spotify embed; must stay in the DOM (it's hidden, not removed). */
  embedRef: React.RefObject<HTMLDivElement | null>;
}

interface Player {
  play(): void;
  pause(): void;
  seekTo(seconds: number): void;
  destroy(): void;
}

interface PlayerEvents {
  onReady(): void;
  onUnavailable(): void;
  onUpdate(update: { isPlaying?: boolean; position?: number; duration?: number }): void;
}

// Only one widget plays at a time.
let activePlayer: Player | null = null;
const claim = (player: Player) => {
  if (activePlayer && activePlayer !== player) activePlayer.pause();
  activePlayer = player;
};

// iTunes ------------------------------------------------------------------

const previewCache = new Map<string, Promise<string | undefined>>();

function findPreview(searchUrl: string): Promise<string | undefined> {
  let pending = previewCache.get(searchUrl);
  if (!pending) {
    pending = fetch(searchUrl)
      .then((res) => (res.ok ? res.json() : undefined))
      .then((body) => {
        const url = body?.results?.[0]?.previewUrl;
        return typeof url === 'string' ? url : undefined;
      })
      .catch(() => undefined);
    // Failed lookups shouldn't stick for the whole session.
    pending.then((url) => url || previewCache.delete(searchUrl));
    previewCache.set(searchUrl, pending);
  }
  return pending;
}

function createPreviewPlayer(searchUrl: string, events: PlayerEvents): Player {
  const audio = new Audio();
  audio.preload = 'none';
  let destroyed = false;
  // One abort() in destroy() detaches every listener below.
  const listeners = new AbortController();
  const { signal } = listeners;

  const update = () =>
    events.onUpdate({
      isPlaying: !audio.paused && !audio.ended,
      position: audio.currentTime,
      duration: Number.isFinite(audio.duration) ? audio.duration : 0,
    });
  for (const name of ['play', 'pause', 'ended', 'timeupdate', 'loadedmetadata', 'seeked']) {
    audio.addEventListener(name, update, { signal });
  }
  audio.addEventListener('error', () => !destroyed && events.onUnavailable(), { signal });

  findPreview(searchUrl).then((src) => {
    if (destroyed) return;
    if (!src) return events.onUnavailable();
    audio.src = src;
    events.onReady();
  });

  const player: Player = {
    play() {
      if (!audio.src) return;
      claim(player);
      if (audio.ended) audio.currentTime = 0;
      audio.play().catch(update);
    },
    pause: () => audio.pause(),
    seekTo(seconds) {
      if (audio.src) audio.currentTime = seconds;
    },
    destroy() {
      destroyed = true;
      listeners.abort();
      audio.pause();
      audio.removeAttribute('src');
      audio.load(); // drop the buffered media now that src is gone
      if (activePlayer === player) activePlayer = null;
    },
  };
  return player;
}

// Spotify -----------------------------------------------------------------

interface SpotifyController {
  addListener(event: string, cb: (e: { data: Record<string, unknown> }) => void): void;
  play(): void;
  resume(): void;
  pause(): void;
  seek(seconds: number): void;
  destroy(): void;
}

interface SpotifyIFrameAPI {
  createController(
    el: HTMLElement,
    options: { uri: string; width?: number | string; height?: number | string },
    cb: (controller: SpotifyController) => void,
  ): void;
}

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: SpotifyIFrameAPI) => void;
  }
}

const SPOTIFY_API_URL = 'https://open.spotify.com/embed/iframe-api/v1';
const SPOTIFY_TIMEOUT_MS = 10000;
let spotifyApi: Promise<SpotifyIFrameAPI> | undefined;

function loadSpotifyApi(): Promise<SpotifyIFrameAPI> {
  spotifyApi ??= new Promise((resolve, reject) => {
    window.onSpotifyIframeApiReady = resolve;
    const script = document.createElement('script');
    script.src = SPOTIFY_API_URL;
    script.async = true;
    script.onerror = () => {
      spotifyApi = undefined;
      reject(new Error('Spotify iFrame API failed to load'));
    };
    document.body.appendChild(script);
  });
  return spotifyApi;
}

function createSpotifyPlayer(uri: string, mount: HTMLElement, events: PlayerEvents): Player {
  let controller: SpotifyController | undefined;
  let started = false;
  let destroyed = false;
  const timeout = setTimeout(() => !controller && events.onUnavailable(), SPOTIFY_TIMEOUT_MS);

  // The controller replaces the element it's given, so hand it a child we own.
  const target = document.createElement('div');
  mount.appendChild(target);

  loadSpotifyApi()
    .then((api) => {
      if (destroyed) return;
      api.createController(target, { uri, width: 300, height: 80 }, (c) => {
        if (destroyed) return c.destroy();
        controller = c;
        c.addListener('ready', () => {
          clearTimeout(timeout);
          events.onReady();
        });
        c.addListener('playback_update', ({ data }) => {
          const { isPaused, isBuffering, position, duration } = data as {
            isPaused: boolean;
            isBuffering: boolean;
            position: number;
            duration: number;
          };
          events.onUpdate({
            isPlaying: !isPaused || isBuffering,
            position: position / 1000,
            duration: duration / 1000,
          });
        });
      });
    })
    .catch(() => !destroyed && events.onUnavailable());

  const player: Player = {
    play() {
      if (!controller) return;
      claim(player);
      if (started) controller.resume();
      else controller.play();
      started = true;
    },
    pause: () => controller?.pause(),
    seekTo: (seconds) => controller?.seek(seconds),
    destroy() {
      destroyed = true;
      clearTimeout(timeout);
      controller?.destroy();
      mount.replaceChildren();
      if (activePlayer === player) activePlayer = null;
    },
  };
  return player;
}

// Hook --------------------------------------------------------------------

interface PlaybackState {
  /** Source this state belongs to; state for an old source reads as fresh. */
  source: string;
  status: PlaybackStatus;
  isPlaying: boolean;
  position: number;
  duration: number;
}

export function useMusicPlayback({ title, artist, url }: { title?: string; artist?: string; url?: string }): MusicPlayback {
  const embedRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);

  const uri = spotifyUri(url);
  const searchUrl = uri ? undefined : itunesPreviewSearchUrl(title, artist);
  const source = uri ?? searchUrl ?? '';
  const fresh: PlaybackState = { source, status: source ? 'loading' : 'unavailable', isPlaying: false, position: 0, duration: 0 };

  const [stored, setStored] = useState<PlaybackState>(fresh);
  const state = stored.source === source ? stored : fresh;
  // Latest state for toggle/seek, which run outside render.
  const stateRef = useRef(state);

  useEffect(() => {
    if (!source) return;
    const initial: PlaybackState = { source, status: 'loading', isPlaying: false, position: 0, duration: 0 };
    stateRef.current = initial;
    const update = (patch: Partial<PlaybackState>) =>
      setStored((prev) => {
        const next = { ...(prev.source === source ? prev : initial), ...patch };
        stateRef.current = next;
        return next;
      });

    const events: PlayerEvents = {
      onReady: () => update({ status: 'ready' }),
      onUnavailable: () => update({ status: 'unavailable', isPlaying: false }),
      onUpdate: (u) => update(u),
    };

    let player: Player | null = null;
    if (uri && embedRef.current) player = createSpotifyPlayer(uri, embedRef.current, events);
    else if (searchUrl) player = createPreviewPlayer(searchUrl, events);
    playerRef.current = player;
    return () => {
      player?.destroy();
      playerRef.current = null;
    };
  }, [source, uri, searchUrl]);

  const toggle = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    if (stateRef.current.isPlaying) player.pause();
    else player.play();
  }, []);

  const seekBy = useCallback((seconds: number) => {
    const player = playerRef.current;
    const { position: current, duration: total } = stateRef.current;
    if (!player || !total) return;
    const next = Math.min(total, Math.max(0, current + seconds));
    player.seekTo(next);
    setStored((prev) => {
      const updated = { ...prev, position: next };
      stateRef.current = updated;
      return updated;
    });
  }, []);

  const { status, isPlaying, position, duration } = state;
  return { status, isPlaying, position, duration, toggle, seekBy, embedRef };
}
