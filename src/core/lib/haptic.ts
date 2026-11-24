const PATTERNS = {
  light: 5,
  rigid: 8,
  soft: 6,
  medium: 12,
  selection: 4,
  success: [10, 40, 10],
  error: [20, 60, 20],
} satisfies Record<string, VibratePattern>

/** Progressive enhancement only (Android Chrome). Visual feedback is always the primary signal. */
export function haptic(pattern: keyof typeof PATTERNS) {
  if (!('vibrate' in navigator)) return
  // Browsers block (and log an error for) vibration before the person has interacted with the page.
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return
  navigator.vibrate(PATTERNS[pattern])
}
