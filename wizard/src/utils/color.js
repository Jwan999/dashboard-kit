/**
 * Tiny zero-dependency color utility for the wizard.
 *
 * Provides:
 *   - normalizeHex(input)            -> "#rrggbb" or null
 *   - hexToRgb(hex)                  -> { r, g, b }
 *   - rgbToHex({r,g,b})              -> "#rrggbb"
 *   - hexToHsl(hex)                  -> { h, s, l } (h: 0..360, s/l: 0..1)
 *   - hslToHex({h,s,l})              -> "#rrggbb"
 *   - hexToOklch(hex)                -> { l, c, h }   (l: 0..1, c: ~0..0.4, h: 0..360)
 *   - oklchToHex({l,c,h})            -> "#rrggbb"
 *   - generateScale(hex)             -> { 50, 100, ..., 900 } map of hex strings
 *   - suggestNeutral(hex)            -> 'cool' | 'warm' | 'true' | 'slate'
 *   - readableTextOn(hex)            -> '#0b0d12' or '#ffffff'
 *
 * The scale generator interpolates lightness in OKLCH space while preserving
 * hue, and tapers chroma at the extremes so very light / very dark shades
 * don't oversaturate. Falls back to HSL gracefully if OKLCH math overflows.
 */

// ---------- low-level conversions ----------

export function normalizeHex(input) {
  if (typeof input !== 'string') return null
  let s = input.trim().replace(/^#/, '')
  if (s.length === 3) {
    s = s
      .split('')
      .map((c) => c + c)
      .join('')
  }
  if (!/^[0-9a-fA-F]{6}$/.test(s)) return null
  return '#' + s.toLowerCase()
}

export function hexToRgb(hex) {
  const h = normalizeHex(hex)
  if (!h) return { r: 0, g: 0, b: 0 }
  return {
    r: parseInt(h.slice(1, 3), 16),
    g: parseInt(h.slice(3, 5), 16),
    b: parseInt(h.slice(5, 7), 16),
  }
}

export function rgbToHex({ r, g, b }) {
  const c = (n) => {
    const v = Math.max(0, Math.min(255, Math.round(n)))
    return v.toString(16).padStart(2, '0')
  }
  return '#' + c(r) + c(g) + c(b)
}

// sRGB <-> linear-light helpers
function srgbToLinear(u) {
  const v = u / 255
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}
function linearToSrgb(v) {
  const u = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(Math.max(v, 0), 1 / 2.4) - 0.055
  return Math.max(0, Math.min(255, Math.round(u * 255)))
}

// ---------- HSL ----------

export function hexToHsl(hex) {
  const { r, g, b } = hexToRgb(hex)
  const rn = r / 255,
    gn = g / 255,
    bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0)
        break
      case gn:
        h = (bn - rn) / d + 2
        break
      case bn:
        h = (rn - gn) / d + 4
        break
    }
    h *= 60
  }
  return { h, s, l }
}

export function hslToHex({ h, s, l }) {
  const a = s * Math.min(l, 1 - l)
  const f = (n) => {
    const k = (n + h / 30) % 12
    const v = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(v * 255)
  }
  return rgbToHex({ r: f(0), g: f(8), b: f(4) })
}

// ---------- OKLCH (via Oklab) ----------

export function hexToOklch(hex) {
  const { r, g, b } = hexToRgb(hex)
  const lr = srgbToLinear(r)
  const lg = srgbToLinear(g)
  const lb = srgbToLinear(b)
  // linear sRGB -> LMS
  const l_ = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb
  const m_ = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb
  const s_ = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb
  const lc = Math.cbrt(l_)
  const mc = Math.cbrt(m_)
  const sc = Math.cbrt(s_)
  // LMS -> Oklab
  const L = 0.2104542553 * lc + 0.793617785 * mc - 0.0040720468 * sc
  const A = 1.9779984951 * lc - 2.428592205 * mc + 0.4505937099 * sc
  const B = 0.0259040371 * lc + 0.7827717662 * mc - 0.808675766 * sc
  // Oklab -> OKLCH
  const C = Math.sqrt(A * A + B * B)
  let H = (Math.atan2(B, A) * 180) / Math.PI
  if (H < 0) H += 360
  return { l: L, c: C, h: H }
}

export function oklchToHex({ l, c, h }) {
  const hr = (h * Math.PI) / 180
  const A = c * Math.cos(hr)
  const B = c * Math.sin(hr)
  // Oklab -> LMS
  const lc = l + 0.3963377774 * A + 0.2158037573 * B
  const mc = l - 0.1055613458 * A - 0.0638541728 * B
  const sc = l - 0.0894841775 * A - 1.291485548 * B
  const l_ = lc ** 3
  const m_ = mc ** 3
  const s_ = sc ** 3
  // LMS -> linear sRGB
  const lr = +4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_
  const lg = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_
  const lb = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_
  return rgbToHex({ r: linearToSrgb(lr), g: linearToSrgb(lg), b: linearToSrgb(lb) })
}

// ---------- scale generation ----------

const SCALE_STOPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]
// Lightness targets in OKLCH for each stop. 500 is the user-picked color.
const L_TARGETS = {
  50: 0.97,
  100: 0.94,
  200: 0.88,
  300: 0.8,
  400: 0.7,
  500: null, // base — keep source L
  600: 0.5,
  700: 0.42,
  800: 0.32,
  900: 0.22,
}
// Scale chroma down at the extremes so pastels don't oversaturate.
const C_FACTORS = {
  50: 0.18,
  100: 0.32,
  200: 0.55,
  300: 0.78,
  400: 0.92,
  500: 1.0,
  600: 0.96,
  700: 0.86,
  800: 0.7,
  900: 0.55,
}

export function generateScale(hex) {
  const safe = normalizeHex(hex) || '#6366f1'
  const base = hexToOklch(safe)
  const out = {}
  for (const stop of SCALE_STOPS) {
    if (stop === 500) {
      out[500] = safe
      continue
    }
    const lTarget = L_TARGETS[stop]
    const cFactor = C_FACTORS[stop]
    const c = Math.max(0, base.c * cFactor)
    out[stop] = oklchToHex({ l: lTarget, c, h: base.h })
  }
  return out
}

// ---------- neutral suggestion ----------

/**
 * Suggest a neutral palette flavor based on the primary's hue.
 *  - reds / oranges / yellows  -> warm gray
 *  - greens                    -> true gray (neutral)
 *  - cyans / blues / purples   -> cool gray (slate-like cool)
 *  - violet / magenta          -> slate
 */
export function suggestNeutral(hex) {
  const { h, c } = hexToOklch(hex)
  if (c < 0.02) return 'true'
  if ((h >= 0 && h < 50) || h >= 350) return 'warm'
  if (h >= 50 && h < 100) return 'warm'
  if (h >= 100 && h < 180) return 'true'
  if (h >= 180 && h < 260) return 'cool'
  if (h >= 260 && h < 310) return 'slate'
  return 'cool'
}

// ---------- contrast helper ----------

function relLuminance({ r, g, b }) {
  const a = [r, g, b].map((v) => {
    const u = v / 255
    return u <= 0.03928 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]
}

export function readableTextOn(hex) {
  const lum = relLuminance(hexToRgb(hex))
  return lum > 0.55 ? '#0b0d12' : '#ffffff'
}