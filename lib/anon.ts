'use client'

/** Stable per-browser anonymous owner id (no login). */
export function anonOwner(): string {
  if (typeof window === 'undefined') return ''
  let id = window.localStorage.getItem('pupil_owner')
  if (!id) {
    id = crypto.randomUUID()
    window.localStorage.setItem('pupil_owner', id)
  }
  return id
}
