import { request } from '../../carrito/services/http'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

function getAuthHeaders() {
  const token = localStorage.getItem('token') || localStorage.getItem('authToken')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function sendFormData(path, formData, method = 'POST') {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...getAuthHeaders(),
    },
    body: formData,
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

export const homeAdminService = {
  async getHomeData() {
    return request('/api/home')
  },

  async listProducts() {
    const response = await request('/api/products')
    return Array.isArray(response) ? response : []
  },

  async listCategories() {
    const response = await request('/api/categorias')
    return Array.isArray(response) ? response : []
  },

  async addFeaturedProduct({ productoId, orden }) {
    return request('/api/home/productos', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        producto_id: Number(productoId),
        orden: Number(orden || 0),
      }),
    })
  },

  async updateFeaturedProduct(homeId, updates = {}) {
    return request(`/api/home/productos/${Number(homeId)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    })
  },

  async removeFeaturedProduct(homeId) {
    return request(`/api/home/productos/${Number(homeId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
  },

  async addBanner({ desktopFile, mobileFile, orden, productoId, categoriaId }) {
    const formData = new FormData()

    if (desktopFile) formData.append('desktop', desktopFile)
    if (mobileFile) formData.append('mobile', mobileFile)
    formData.append('orden', String(Number(orden || 0)))
    if (productoId) formData.append('producto_id', String(Number(productoId)))
    if (categoriaId) formData.append('categoria_id', String(Number(categoriaId)))

    return sendFormData('/api/home/carousel', formData, 'POST')
  },

  async updateBanner(carouselId, { desktopFile, mobileFile, orden, productoId, categoriaId, activo } = {}) {
    const hasFile = desktopFile || mobileFile

    if (hasFile) {
      const formData = new FormData()
      if (desktopFile) formData.append('desktop', desktopFile)
      if (mobileFile) formData.append('mobile', mobileFile)
      if (orden !== undefined) formData.append('orden', String(Number(orden)))
      if (productoId !== undefined) formData.append('producto_id', productoId ? String(Number(productoId)) : '')
      if (categoriaId !== undefined) formData.append('categoria_id', categoriaId ? String(Number(categoriaId)) : '')
      if (activo !== undefined) formData.append('activo', String(Boolean(activo)))
      return sendFormData(`/api/home/carousel/${Number(carouselId)}`, formData, 'PUT')
    }

    return request(`/api/home/carousel/${Number(carouselId)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...(orden !== undefined ? { orden: Number(orden) } : {}),
        ...(productoId !== undefined ? { producto_id: productoId ? Number(productoId) : null } : {}),
        ...(categoriaId !== undefined ? { categoria_id: categoriaId ? Number(categoriaId) : null } : {}),
        ...(activo !== undefined ? { activo: Boolean(activo) } : {}),
      }),
    })
  },

  async removeBanner(carouselId) {
    return request(`/api/home/carousel/${Number(carouselId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
  },
}
