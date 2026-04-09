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

export async function request(path, options = {}, query) {
  const { suppressAuthRedirect = false, headers: customHeaders = {}, ...fetchOptions } = options
  const isFormData = fetchOptions.body instanceof FormData
  const method = String(fetchOptions.method || 'GET').toUpperCase()
  const hasBody = fetchOptions.body != null
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
  const hasAuthorizationHeader = Boolean(
    customHeaders && (customHeaders.Authorization || customHeaders.authorization)
  )

  const finalHeaders = {
    ...(!isFormData && hasBody ? { 'Content-Type': 'application/json' } : {}),
    ...(!hasAuthorizationHeader && token ? { Authorization: `Bearer ${token}` } : {}),
    ...(customHeaders || {}),
  }

  const requestInit = {
    ...fetchOptions,
    headers: finalHeaders,
    cache: method === 'GET' ? 'no-store' : fetchOptions.cache,
  }

  const fullUrl = buildUrl(path, query)
  let response

  try {
    response = await fetch(fullUrl, requestInit)
  } catch (networkError) {
    const retryableMethod = method === 'GET' || method === 'HEAD'
    if (!retryableMethod) {
      throw new Error('Error de conexion con el servidor')
    }

    try {
      const retryUrl = buildUrl(path, { ...(query || {}), _cb: Date.now() })
      response = await fetch(retryUrl, requestInit)
    } catch {
      throw new Error('Error de conexion con el servidor')
    }
  }

  if (response.status === 304 && (method === 'GET' || method === 'HEAD')) {
    const retryUrl = buildUrl(path, { ...(query || {}), _cb: Date.now() })
    response = await fetch(retryUrl, requestInit)
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