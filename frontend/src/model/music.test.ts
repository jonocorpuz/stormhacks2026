import { describe, expect, it } from 'vitest'
import { itunesPreviewSearchUrl, spotifyUri } from '.'

describe('spotifyUri', () => {
  it('reads track links, with locale and share params', () => {
    expect(spotifyUri('https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC')).toBe('spotify:track:4uLU6hMCjMI75M1A2tKUQC')
    expect(spotifyUri('https://open.spotify.com/intl-fr/track/abc123?si=xyz')).toBe('spotify:track:abc123')
    expect(spotifyUri(' spotify:episode:abc123 ')).toBe('spotify:episode:abc123')
  })

  it('ignores non-track links and bad input', () => {
    expect(spotifyUri('https://open.spotify.com/album/abc123')).toBeUndefined()
    expect(spotifyUri('https://music.apple.com/track/abc')).toBeUndefined()
    expect(spotifyUri('')).toBeUndefined()
    expect(spotifyUri(42)).toBeUndefined()
  })
})

describe('itunesPreviewSearchUrl', () => {
  it('searches title and artist together', () => {
    const url = new URL(itunesPreviewSearchUrl('Brazil', 'Declan McKenna')!)
    expect(url.searchParams.get('term')).toBe('Brazil Declan McKenna')
    expect(url.searchParams.get('entity')).toBe('song')
  })

  it('works with either part, nothing without both', () => {
    expect(new URL(itunesPreviewSearchUrl(' Brazil ', undefined)!).searchParams.get('term')).toBe('Brazil')
    expect(itunesPreviewSearchUrl('', '  ')).toBeUndefined()
  })
})
