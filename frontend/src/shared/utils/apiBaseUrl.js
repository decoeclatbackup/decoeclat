const rawApiBaseUrl = String(import.meta.env.VITE_API_URL || '').trim()

function stripTrailingSlash(value) {
  return value.replace(/\/+$/, '')
}

function shouldForceSameOrigin() {
  if (typeof window === 'undefined') return false

  const host = String(window.location.hostname || '').toLowerCase()
  const isLocalHost = host === 'localhost' || host === '127.0.0.1'
  if (isLocalHost) return false

  // In production, avoid direct browser calls to onrender.com and use same-origin rewrites.
  return /^https?:\/\/[^/]*onrender\.com/i.test(rawApiBaseUrl)
}

export const API_BASE_URL = shouldForceSameOrigin()
  ? ''
  : stripTrailingSlash(rawApiBaseUrl)

export function resolveAssetUrl(url) {
  if (!url) return null
  if (/^https?:\/\//i.test(url)) return url
  if (API_BASE_URL) return `${API_BASE_URL}${url}`
  return url
}
