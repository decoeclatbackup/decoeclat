import { useState } from 'react'
import { ventaService } from '../services/ventaService'

export function useVentas() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const registrarVentaWeb = async ({ clienteId, items, metodoId }) => {
    setLoading(true)
    setError(null)

    try {
      return await ventaService.registrarVentaWeb({ clienteId, items, metodoId })
    } catch (err) {
      const message = err?.message || 'No se pudo registrar la venta'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    registrarVentaWeb,
  }
}
