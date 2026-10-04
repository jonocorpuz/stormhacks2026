// Light haptic tick on touch devices. Android: Vibration API. iOS Safari has no Vibration API, but
// since iOS 18 toggling an <input type="checkbox" switch> plays the system switch haptic, and a
// programmatic click on its label toggles it. That's unofficial and WebKit may only honour it near
// a user gesture, so it's best-effort: misses are silent. No-op without a coarse pointer (desktop).

const MIN_GAP_MS = 35; // fast flicks cross cards quicker than the taptic engine can separate ticks
let last = -Infinity;
let label: HTMLLabelElement | null = null;

const touch = () => typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches;
const canVibrate = () => typeof navigator.vibrate === 'function';

// One persistent hidden switch. Fixed + clipped so toggling it never scrolls, shows, or takes focus.
function switchLabel() {
  if (label?.isConnected) return label;
  label = document.createElement('label');
  label.setAttribute('aria-hidden', 'true');
  label.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;clip-path:inset(50%)';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.setAttribute('switch', '');
  input.tabIndex = -1;
  label.append(input);
  document.body.append(label);
  return label;
}

// Build the iOS switch ahead of time so the first tick isn't spent creating DOM.
export function prepareHaptics() {
  if (touch() && !canVibrate()) switchLabel();
}

export function hapticTick() {
  if (!touch()) return;
  const now = performance.now();
  if (now - last < MIN_GAP_MS) return;
  last = now;
  if (canVibrate()) navigator.vibrate(8);
  else switchLabel().click();
}

// Test-only: forget throttle + element between cases.
export function resetHaptics() {
  last = -Infinity;
  label?.remove();
  label = null;
}
