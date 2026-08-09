export const IDLE_TIMEOUT_MS = 1 * 1000 // 40 minutes
// export const IDLE_TIMEOUT_MS = 40 * 60 * 1000 // 40 minutes

export const IDLE_ACTIVITY_EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'scroll',
] as const

export const IDLE_STORAGE_KEYS = {
  lastActivityAt: 'elco_idle_last_activity_at',
  locked: 'elco_idle_locked',
} as const
