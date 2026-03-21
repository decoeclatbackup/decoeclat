import { request } from '../../carrito/services/http'

const WEB_METODO_ID = Number(import.meta.env.VITE_WEB_METODO_ID || 2)

export const ventaService = {
  async registrarVentaWeb({ clienteId, items, metodoId = WEB_METODO_ID }) {
    const safeItems = Array.isArray(items) ? items : []

    if (!clienteId) {
      throw new Error('No hay cliente activo para registrar la venta')
    }

    if (safeItems.length === 0) {
      throw new Error('El carrito esta vacio, no se puede registrar la venta')
    }

    const normalizedItems = safeItems
      .map((item) => ({
        variante_id: Number(item?.variante_id),
        cantidad: Number(item?.cantidad),
      }))
      .filter(
        (item) =>
          Number.isInteger(item.variante_id) &&
          item.variante_id > 0 &&
          Number.isInteger(item.cantidad) &&
          item.cantidad > 0
      )

    if (normalizedItems.length === 0) {
      throw new Error('No hay items validos para registrar la venta')
    }

    const response = await request('/api/ventas/web', {
      method: 'POST',
      body: JSON.stringify({
        cliente_id: Number(clienteId),
        metodo_id: Number(metodoId),
        items: normalizedItems,
      }),
    })

    return response?.data || response
  },
}
