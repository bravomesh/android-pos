/**
 * Shared motion tokens. Durations scale with what moves: a tap answers
 * fast, a panel takes a beat longer, a celebration longer still. Entering
 * decelerates, leaving accelerates, and only playful moments overshoot.
 */
export const duration = {
  tap: 120,
  quick: 180,
  enter: 260,
  emphasis: 420,
  celebrate: 700,
} as const;

export const easing = {
  decelerate: "cubic-bezier(0.2, 0, 0, 1)",
  accelerate: "cubic-bezier(0.3, 0, 1, 1)",
  standard: "cubic-bezier(0.4, 0, 0.2, 1)",
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;

/** The device asked for less motion: show end states straight away. */
export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Delay for the nth item of a staggered list, capped so long lists don't drag. */
export const stagger = (index: number, step = 35, max = 12) => `${Math.min(index, max) * step}ms`;

/** A short buzz to confirm something important happened (sale done, payment taken). */
export const haptic = (ms = 15) => {
  try {
    navigator.vibrate?.(ms);
  } catch {
    // Not every WebView allows it; the visual feedback is enough.
  }
};
