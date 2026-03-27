import { request } from '../../carrito/services/http'

export const homePublicService = {
  async getHomeData() {
    return request('/api/home')
  },

  async listCategories() {
    const response = await request('/api/categorias')
    return Array.isArray(response) ? response : []
  },

  async sendContactMessage(payload) {
    return request('/api/contacto', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
}
