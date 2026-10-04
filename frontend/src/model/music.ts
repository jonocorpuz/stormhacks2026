// Music track helpers: where a saved song can be played from. Pure; playback lives in components.

/**
 * Spotify URI for a track/episode link, e.g. https://open.spotify.com/intl-fr/track/ID?si=x
 * or spotify:track:ID -> "spotify:track:ID". Undefined for anything else.
 */
export function spotifyUri(url: unknown): string | undefined {
  if (typeof url !== 'string') return undefined
  const match =
    url.trim().match(/^spotify:(track|episode):([A-Za-z0-9]+)$/) ??
    url.trim().match(/^https?:\/\/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(track|episode)\/([A-Za-z0-9]+)/i)
  return match ? `spotify:${match[1].toLowerCase()}:${match[2]}` : undefined
}

/** iTunes Search API request for a song's 30s preview. Undefined when there's nothing to search for. */
export function itunesPreviewSearchUrl(title: unknown, artist: unknown): string | undefined {
  const term = [title, artist]
    .filter((s): s is string => typeof s === 'string')
    .map((s) => s.trim())
    .filter(Boolean)
    .join(' ')
  if (!term) return undefined
  const params = new URLSearchParams({ term, media: 'music', entity: 'song', limit: '1' })
  return `https://itunes.apple.com/search?${params}`
}
