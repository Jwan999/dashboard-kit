/**
 * Maps for visual-language tokens. Used by the preview pane to render
 * radius / density / shadow / motion in real time.
 */

export const RADIUS_MAP = {
  sharp: '0px',
  subtle: '6px',
  rounded: '12px',
  pill: '9999px',
}

export const DENSITY_MAP = {
  comfortable: { padY: '14px', padX: '20px', rowH: '52px', fontSize: '15px' },
  default: { padY: '10px', padX: '16px', rowH: '44px', fontSize: '14px' },
  compact: { padY: '6px', padX: '12px', rowH: '36px', fontSize: '13px' },
}

export const SHADOW_MAP = {
  flat: 'none',
  soft: '0 1px 2px rgba(15,23,42,.05), 0 4px 12px rgba(15,23,42,.08)',
  layered:
    '0 1px 2px rgba(15,23,42,.04), 0 4px 8px rgba(15,23,42,.06), 0 12px 28px rgba(15,23,42,.12), 0 24px 48px rgba(15,23,42,.10)',
}

export const MOTION_MAP = {
  minimal: { duration: 80, easing: 'ease-out' },
  standard: { duration: 200, easing: 'cubic-bezier(.2,.8,.2,1)' },
  expressive: { duration: 420, easing: 'cubic-bezier(.34,1.56,.64,1)' },
}