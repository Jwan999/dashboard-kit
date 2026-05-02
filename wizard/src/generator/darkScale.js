/**
 * Generate a dark-mode primary scale by inverting the lightness axis of the
 * existing light scale. We re-use the wizard's OKLCH helpers so the dark scale
 * is perceptually consistent with the light one (not just hex-flipped).
 */
import { hexToOklch, oklchToHex, normalizeHex } from '../utils/color.js'

const SCALE_STOPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]

// Dark-mode lightness targets. Mirror image of the light scale's L_TARGETS
// (light 50 ≈ dark 900). Chroma stays close to the light value because OKLCH
// chroma is already perceptually-bound.
const DARK_L_TARGETS = {
  50: 0.22,
  100: 0.27,
  200: 0.34,
  300: 0.42,
  400: 0.5,
  500: null, // base — keep source L (the user-picked color stays anchored)
  600: 0.7,
  700: 0.78,
  800: 0.86,
  900: 0.94,
}

const DARK_C_FACTORS = {
  50: 0.45,
  100: 0.6,
  200: 0.78,
  300: 0.9,
  400: 0.96,
  500: 1.0,
  600: 0.92,
  700: 0.78,
  800: 0.55,
  900: 0.32,
}

export function generateDarkScale(hex) {
  const safe = normalizeHex(hex) || '#6366f1'
  const base = hexToOklch(safe)
  const out = {}
  for (const stop of SCALE_STOPS) {
    if (stop === 500) {
      out[500] = safe
      continue
    }
    const c = Math.max(0, base.c * DARK_C_FACTORS[stop])
    out[stop] = oklchToHex({ l: DARK_L_TARGETS[stop], c, h: base.h })
  }
  return out
}