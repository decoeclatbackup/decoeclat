import { request } from '../../carrito/services/http'

function getDisplayPriceFromVariant(variant) {
  const basePrice = Number(variant?.precio) || 0
  const hasOffer = Boolean(variant?.en_oferta) && Number(variant?.precio_oferta) > 0
  const finalPrice = hasOffer ? Number(variant?.precio_oferta) : basePrice

  return {
    basePrice,
    finalPrice,
    hasOffer,
  }
}

export const homePublicService = {
  async getHomeData() {
    return request('/api/home')
  },

  async searchProductsByName(name, limit = 6) {
    const term = String(name || '').trim()
    if (!term) return []

    const response = await request('/api/products', {}, { name: term })
    const items = Array.isArray(response) ? response : []
    const safeLimit = Math.max(1, Number(limit) || 6)

    const activeItems = items
      .filter((product) => Boolean(product?.activo))
      .slice(0, safeLimit)

    const withPrice = await Promise.all(
      activeItems.map(async (product) => {
        try {
          const variants = await request('/api/variantes', {}, { productoId: product.producto_id })
          const firstVariant = Array.isArray(variants) ? variants[0] : null
          const { basePrice, finalPrice, hasOffer } = getDisplayPriceFromVariant(firstVariant)

          return {
            ...product,
            basePrice,
            finalPrice,
            hasOffer,
          }
        } catch {
          return {
            ...product,
            basePrice: 0,
            finalPrice: 0,
            hasOffer: false,
          }
        }
      })
    )

    return withPrice
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
