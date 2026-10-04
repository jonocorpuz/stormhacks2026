// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { hapticTick, prepareHaptics, resetHaptics } from './haptics';

const setPointer = (coarse: boolean) => {
  window.matchMedia = vi.fn().mockReturnValue({ matches: coarse }) as unknown as typeof window.matchMedia;
};
const switchInput = () => document.querySelector<HTMLInputElement>('label > input[type="checkbox"][switch]');

describe('haptics', () => {
  let now = 1000;
  beforeEach(() => {
    resetHaptics();
    vi.spyOn(performance, 'now').mockImplementation(() => now);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    // @ts-expect-error test cleanup of a possibly-stubbed API
    delete navigator.vibrate;
  });

  it('does nothing without a coarse pointer', () => {
    setPointer(false);
    const vibrate = vi.fn();
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true });
    hapticTick();
    prepareHaptics();
    expect(vibrate).not.toHaveBeenCalled();
    expect(switchInput()).toBeNull();
  });

  it('uses the Vibration API when present', () => {
    setPointer(true);
    const vibrate = vi.fn();
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true });
    hapticTick();
    expect(vibrate).toHaveBeenCalledTimes(1);
    expect(switchInput()).toBeNull();
  });

  it('falls back to toggling a hidden switch (iOS)', () => {
    setPointer(true);
    prepareHaptics();
    const input = switchInput()!;
    expect(input).not.toBeNull();
    hapticTick();
    expect(input.checked).toBe(true);
    now += 100;
    hapticTick();
    expect(input.checked).toBe(false);
    expect(document.querySelectorAll('input[switch]')).toHaveLength(1);
  });

  it('throttles ticks closer than the minimum gap', () => {
    setPointer(true);
    const vibrate = vi.fn();
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true });
    hapticTick();
    now += 10;
    hapticTick();
    now += 100;
    hapticTick();
    expect(vibrate).toHaveBeenCalledTimes(2);
  });
});
