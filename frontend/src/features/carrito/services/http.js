const API_BASE_URL = import.meta.env.VITE_API_URL || ''

// Log the API URL being used (useful for debugging production issues)
if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
  console.log('📡 API_BASE_URL:', API_BASE_URL || '(empty - using relative URLs)')
}

function buildUrl(path, query = {}) {
  const params = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value)
    }
  })

  const qs = params.toString()
  const fullUrl = `${API_BASE_URL}${path}${qs ? `?${qs}` : ''}`
  
  // Log in production when making requests to ventas/web
  if (path.includes('/ventas/web')) {
    console.log('🚀 Request URL:', fullUrl)
  }
  
  return fullUrl
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function request(path, options = {}, query) {
  const {
    suppressAuthRedirect = false,
    requireAuth = false,
    headers: customHeaders = {},
    ...fetchOptions
  } = options
  const isFormData = fetchOptions.body instanceof FormData
  const method = String(fetchOptions.method || 'GET').toUpperCase()
  const retryableMethod = method === 'GET' || method === 'HEAD'
  const transientStatuses = new Set([502, 503, 504])
  const maxAttempts = retryableMethod ? 3 : 1
  const hasBody = fetchOptions.body != null
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
  const hasAuthorizationHeader = Boolean(
    customHeaders && (customHeaders.Authorization || customHeaders.authorization)
  )
  const shouldAttachAuthorization = Boolean(
    hasAuthorizationHeader || (token && (requireAuth || (method !== 'GET' && method !== 'HEAD')))
  )

  const finalHeaders = {
    ...(!isFormData && hasBody ? { 'Content-Type': 'application/json' } : {}),
    ...(!hasAuthorizationHeader && shouldAttachAuthorization ? { Authorization: `Bearer ${token}` } : {}),
    ...(customHeaders || {}),
  }

  const requestInit = {
    ...fetchOptions,
    headers: finalHeaders,
    cache: method === 'GET' ? 'no-store' : fetchOptions.cache,
  }

  const fullUrl = buildUrl(path, query)
  let response

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const isRetry = attempt > 1
    const currentUrl = isRetry
      ? buildUrl(path, { ...(query || {}), _cb: `${Date.now()}-${attempt}` })
      : fullUrl

    try {
      response = await fetch(currentUrl, requestInit)
    } catch {
      if (attempt === maxAttempts) {
        throw new Error('Error de conexion con el servidor')
      }

      await delay(250 * attempt)
      continue
    }

    if (retryableMethod && transientStatuses.has(response.status) && attempt < maxAttempts) {
      await delay(250 * attempt)
      continue
    }

    if (retryableMethod && response.status === 304 && attempt < maxAttempts) {
      await delay(150)
      continue
    }

    break
  }

  if (!response.ok) {
    if (!suppressAuthRedirect && (response.status === 401 || response.status === 403) && typeof window !== 'undefined') {
      localStorage.removeItem('authToken')
      localStorage.removeItem('authUser')
      localStorage.removeItem('token')

      if (window.location.pathname.startsWith('/admin')) {
        const nextPath = encodeURIComponent(window.location.pathname + window.location.search)
        window.location.assign(`/admin/login?reason=session-expired&next=${nextPath}`)
      }
    }

    let message = 'Error de red'
    try {
      const body = await response.json()
      message = body.error || message
    } catch {
      message = response.statusText || message
    }
    
    // Enhanced error logging
    const errorMsg = `[${response.status}] ${message} - URL: ${fullUrl}`
    console.error('❌ API Error:', errorMsg)
    
    throw new Error(message)
  }

  if (response.status === 204) return null
  if (response.status === 304) return null
  return response.json()
}