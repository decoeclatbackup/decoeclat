const API_BASE_URL = import.meta.env.VITE_API_URL || ''

function buildUrl(path, query = {}) {
  const params = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value)
    }
  })

  const qs = params.toString()
  return `${API_BASE_URL}${path}${qs ? `?${qs}` : ''}`
}

export async function request(path, options = {}, query) {
  const { suppressAuthRedirect = false, headers: customHeaders = {}, ...fetchOptions } = options
  const isFormData = fetchOptions.body instanceof FormData
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
  const hasAuthorizationHeader = Boolean(
    customHeaders && (customHeaders.Authorization || customHeaders.authorization)
  )

  const response = await fetch(buildUrl(path, query), {
    ...fetchOptions,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(!hasAuthorizationHeader && token ? { Authorization: `Bearer ${token}` } : {}),
      ...(customHeaders || {}),
    },
  })

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
    throw new Error(message)
  }

  if (response.status === 204) return null
  return response.json()
}