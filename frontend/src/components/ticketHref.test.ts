import { describe, expect, it } from 'vitest';
import { ticketHref } from './ticketHref';

describe('ticketHref', () => {
  it('keeps http(s) urls', () => {
    expect(ticketHref('https://example.com/t/1', 'Ticketmaster')).toBe('https://example.com/t/1');
  });

  it('adds a scheme to bare urls', () => {
    expect(ticketHref('ticketmaster.ca/event/1', undefined)).toBe('https://ticketmaster.ca/event/1');
  });

  it('falls back to the vendor tickets page', () => {
    expect(ticketHref('', 'Ticketmaster')).toBe('https://www.ticketmaster.ca/user/orders');
    expect(ticketHref('javascript:alert(1)', 'ticketmaster')).toBe('https://www.ticketmaster.ca/user/orders');
  });

  it('is empty for unknown vendors without a url', () => {
    expect(ticketHref(undefined, 'Some Box Office')).toBe('');
    expect(ticketHref(undefined, undefined)).toBe('');
  });
});
