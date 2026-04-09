const rawApiBaseUrl = String(
  import.meta.env.VITE_API_URL ||
  import.meta.env.REACT_APP_API_URL ||
  ''
).trim()

const renderHostPattern = /^https?:\/\/[^/]*onrender\.com/i

function stripTrailingSlash(value) {
  return value.replace(/\/+$/, '')
}

function shouldForceSameOrigin() {
  if (typeof window === 'undefined') return false

  const host = String(window.location.hostname || '').toLowerCase()
  const isLocalHost = host === 'localhost' || host === '127.0.0.1'
  if (isLocalHost) return false

  // In production, avoid direct browser calls to onrender.com and use same-origin rewrites.
  return renderHostPattern.test(rawApiBaseUrl)
}

export const API_BASE_URL = shouldForceSameOrigin()
  ? ''
  : stripTrailingSlash(rawApiBaseUrl)

export function buildApiUrl(path, query = {}) {
  const safePath = String(path || '').trim()
  if (!safePath) return API_BASE_URL || ''

  const params = new URLSearchParams()
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value))
    }
  })

  const qs = params.toString()
  return `${API_BASE_URL}${safePath}${qs ? `?${qs}` : ''}`
}

export function resolveAssetUrl(url) {
  if (!url) return null
  if (/^https?:\/\//i.test(url)) return url
  if (API_BASE_URL) return `${API_BASE_URL}${url}`
  return url
}
