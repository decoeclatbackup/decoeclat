import { request } from '../../carrito/services/http'
import { API_BASE_URL } from '../../../shared/utils/apiBaseUrl'

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
    const normalizedProductoId = Number(productoId)
    if (!Number.isInteger(normalizedProductoId) || normalizedProductoId <= 0) {
      throw new Error('Debes seleccionar un producto valido')
    }

    return request('/api/home/productos', {
      method: 'POST',
      body: JSON.stringify({
        producto_id: normalizedProductoId,
        orden: Number(orden || 0),
      }),
    })
  },

  async updateFeaturedProduct(homeId, updates = {}) {
    return request(`/api/home/productos/${Number(homeId)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  async removeFeaturedProduct(homeId) {
    return request(`/api/home/productos/${Number(homeId)}`, {
      method: 'DELETE',
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
      body: JSON.stringify({
        ...(orden !== undefined ? { orden: Number(orden) } : {}),
        ...(productoId !== undefined ? { producto_id: productoId ? Number(productoId) : null } : {}),
        ...(categoriaId !== undefined ? { categoria_id: categoriaId ? Number(categoriaId) : null } : {}),
        ...(activo !== undefined ? { activo: Boolean(activo) } : {}),
      }),
    })
  },

  async removeBannerImage(carouselId, imageField) {
    const allowedFields = ['img_desktop_url', 'img_mobile_url']
    if (!allowedFields.includes(imageField)) {
      throw new Error('Campo de imagen invalido')
    }

    return request(`/api/home/carousel/${Number(carouselId)}`, {
      method: 'PUT',
      body: JSON.stringify({
        [imageField]: null,
      }),
    })
  },

  async removeBanner(carouselId) {
    return request(`/api/home/carousel/${Number(carouselId)}`, {
      method: 'DELETE',
    })
  },
}
