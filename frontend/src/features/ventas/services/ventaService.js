import { request } from '../../carrito/services/http'

const WEB_METODO_ID = Number(import.meta.env.VITE_WEB_METODO_ID || 2)
const API_BASE_URL = import.meta.env.VITE_API_URL || ''

function parseFileName(contentDisposition, fallbackName) {
  const match = /filename=([^;]+)/i.exec(contentDisposition || '')
  if (!match) return fallbackName
  return match[1].replace(/"/g, '').trim() || fallbackName
}

async function descargarArchivo(path, { mes, anio, defaultName }) {
  const query = new URLSearchParams({
    mes: String(Number(mes)),
    anio: String(Number(anio)),
  })
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('authToken') || localStorage.getItem('token')
    : null

  const response = await fetch(`${API_BASE_URL}${path}?${query.toString()}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!response.ok) {
    let message = 'No se pudo descargar el reporte'
    try {
      const body = await response.json()
      message = body?.error || message
    } catch {
      message = response.statusText || message
    }
    throw new Error(message)
  }

  const blob = await response.blob()
  const fileName = parseFileName(response.headers.get('content-disposition'), defaultName)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

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

    const payload = {
      cliente_id: Number(clienteId),
      metodo_id: Number(metodoId),
      items: normalizedItems,
    }
    
    console.log('📦 Enviando venta al backend:', payload)

    const response = await request('/api/ventas/web', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    console.log('✅ Respuesta del backend:', response)
    return response?.data || response
  },

  async listarVentas({ mes, anio } = {}) {
    const response = await request('/api/ventas', { requireAuth: true }, { mes, anio })
    return Array.isArray(response?.data) ? response.data : []
  },

  async descargarReporteMensual({ mes, anio }) {
    return descargarArchivo('/api/reportes/descargar', {
      mes,
      anio,
      defaultName: `Reporte_Ventas_${mes}_${anio}.csv`,
    })
  },

  async descargarReporteResumen({ mes, anio }) {
    return descargarArchivo('/api/reportes/dashboard', {
      mes,
      anio,
      defaultName: `Ventas_Clientes_${mes}_${anio}.csv`,
    })
  },

  async listarEstados() {
    const response = await request('/api/ventas/estados', { requireAuth: true })
    return Array.isArray(response?.data) ? response.data : []
  },

  async listarMetodos() {
    const response = await request('/api/ventas/metodos', { requireAuth: true })
    return Array.isArray(response?.data) ? response.data : []
  },

  async listarClientes() {
    const response = await request('/api/clientes', { requireAuth: true })
    return Array.isArray(response) ? response : []
  },

  async listarVariantes() {
    const response = await request('/api/variantes', { requireAuth: true })
    return Array.isArray(response) ? response : []
  },

  async actualizarEstadoVenta({ ventaId, estadoId }) {
    const response = await request(`/api/ventas/${Number(ventaId)}/estado`, {
      method: 'PUT',
      body: JSON.stringify({
        estado_id: Number(estadoId),
      }),
    })

    return response?.data || response
  },

  async eliminarVenta(ventaId) {
    await request(`/api/ventas/${Number(ventaId)}`, {
      method: 'DELETE',
    })
    return true
  },

  async registrarVentaManual({ clienteId, cliente, items, metodoId }) {
    const safeItems = Array.isArray(items) ? items : []

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

    const hasClienteId = Number.isInteger(Number(clienteId)) && Number(clienteId) > 0
    const hasClienteNuevo =
      typeof cliente?.nombre === 'string' &&
      cliente.nombre.trim() &&
      typeof cliente?.email === 'string' &&
      cliente.email.trim()

    if (!hasClienteId && !hasClienteNuevo) {
      throw new Error('Debes seleccionar un cliente o cargar un cliente nuevo')
    }

    if (normalizedItems.length === 0) {
      throw new Error('Debes cargar al menos un item valido')
    }

    if (!metodoId) {
      throw new Error('Debes seleccionar un metodo de pago')
    }

    const response = await request('/api/ventas/manual', {
      method: 'POST',
      body: JSON.stringify({
        cliente_id: hasClienteId ? Number(clienteId) : null,
        cliente: hasClienteNuevo
          ? {
              nombre: String(cliente.nombre || '').trim(),
              email: String(cliente.email || '').trim(),
              telefono: String(cliente.telefono || '').trim() || null,
            }
          : null,
        metodo_id: Number(metodoId),
        items: normalizedItems,
      }),
    })

    return response?.data || response
  },
}
