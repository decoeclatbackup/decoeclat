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
  const isFormData = options.body instanceof FormData
  const response = await fetch(buildUrl(path, query), {
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {}),
    },
    ...options,
  })

  if (!response.ok) {
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