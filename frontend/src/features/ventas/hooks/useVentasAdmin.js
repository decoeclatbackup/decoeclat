import { useCallback, useEffect, useMemo, useState } from 'react'
import { ventaService } from '../services/ventaService'

function getCurrentPeriodValue() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = now.getFullYear()
  return `${year}-${month}`
}

const EMPTY_MANUAL_FORM = {
  clienteId: '',
  usarClienteNuevo: false,
  clienteNombre: '',
  clienteEmail: '',
  clienteTelefono: '',
  metodoId: '',
  items: [{ variante_id: '', cantidad: 1 }],
}

function normalizeManualItems(items = []) {
  return items
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
}

export function useVentasAdmin() {
  const [ventas, setVentas] = useState([])
  const [variantes, setVariantes] = useState([])
  const [estados, setEstados] = useState([])
  const [metodos, setMetodos] = useState([])
  const [clientes, setClientes] = useState([])
  const [estadoSeleccionado, setEstadoSeleccionado] = useState({})
  const [manualForm, setManualForm] = useState(EMPTY_MANUAL_FORM)
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(getCurrentPeriodValue())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function resetManualForm() {
    setManualForm(EMPTY_MANUAL_FORM)
  }

  const periodo = useMemo(() => {
    const [anioRaw, mesRaw] = String(periodoSeleccionado || '').split('-')
    const anio = Number(anioRaw)
    const mes = Number(mesRaw)
    return {
      anio: Number.isInteger(anio) ? anio : null,
      mes: Number.isInteger(mes) ? mes : null,
    }
  }, [periodoSeleccionado])

  const estadosById = useMemo(() => {
    const map = {}
    estados.forEach((estado) => {
      map[Number(estado.estado_id)] = estado.descripcion
    })
    return map
  }, [estados])

  const recargarTodo = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [ventasData, estadosData, metodosData, clientesData, variantesData] = await Promise.all([
        ventaService.listarVentas({ mes: periodo.mes, anio: periodo.anio }),
        ventaService.listarEstados(),
        ventaService.listarMetodos(),
        ventaService.listarClientes(),
        ventaService.listarVariantes(),
      ])

      setVentas(Array.isArray(ventasData) ? ventasData : [])
      setEstados(Array.isArray(estadosData) ? estadosData : [])
      setMetodos(Array.isArray(metodosData) ? metodosData : [])
      setClientes(Array.isArray(clientesData) ? clientesData : [])
      setVariantes(Array.isArray(variantesData) ? variantesData : [])

      const preselected = {}
      ;(Array.isArray(ventasData) ? ventasData : []).forEach((venta) => {
        preselected[Number(venta.venta_id)] = Number(venta.estado_id)
      })
      setEstadoSeleccionado(preselected)
    } catch (err) {
      setError(err?.message || 'No se pudo cargar la administración de ventas')
    } finally {
      setLoading(false)
    }
  }, [periodo.anio, periodo.mes])

  useEffect(() => {
    recargarTodo()
  }, [recargarTodo])

  function cambiarEstadoSeleccionado(ventaId, nuevoEstadoId) {
    setEstadoSeleccionado((prev) => ({
      ...prev,
      [Number(ventaId)]: Number(nuevoEstadoId),
    }))
  }

  async function guardarEstadoVenta(ventaId) {
    const estadoId = Number(estadoSeleccionado[Number(ventaId)])
    if (!estadoId) {
      setError('Debes seleccionar un estado válido')
      return
    }

    setSaving(true)
    setError('')
    setMessage('')

    try {
      const ventaActualizada = await ventaService.actualizarEstadoVenta({ ventaId, estadoId })

      setVentas((prev) =>
        prev.map((venta) =>
          Number(venta.venta_id) === Number(ventaId)
            ? {
                ...venta,
                ...ventaActualizada,
                estado_id: Number(ventaActualizada.estado_id),
                estado_nombre:
                  ventaActualizada.estado_nombre ||
                  estadosById[Number(ventaActualizada.estado_id)] ||
                  venta.estado_nombre,
              }
            : venta
        )
      )

      setEstadoSeleccionado((prev) => ({
        ...prev,
        [Number(ventaId)]: Number(ventaActualizada.estado_id),
      }))

      setMessage(`Estado de venta ${ventaId} actualizado correctamente`)
    } catch (err) {
      setError(err?.message || 'No se pudo actualizar el estado de la venta')
    } finally {
      setSaving(false)
    }
  }

  function cambiarManualFormCampo(name, value) {
    setManualForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  function cambiarManualItem(index, field, value) {
    setManualForm((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      ),
    }))
  }

  function agregarItemManual() {
    setManualForm((prev) => ({
      ...prev,
      items: [...prev.items, { variante_id: '', cantidad: 1 }],
    }))
  }

  function quitarItemManual(index) {
    setManualForm((prev) => {
      if (prev.items.length <= 1) return prev
      return {
        ...prev,
        items: prev.items.filter((_, itemIndex) => itemIndex !== index),
      }
    })
  }

  async function guardarVentaManual() {
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const items = normalizeManualItems(manualForm.items)
      await ventaService.registrarVentaManual({
        clienteId: manualForm.clienteId,
        cliente: manualForm.usarClienteNuevo
          ? {
              nombre: manualForm.clienteNombre,
              email: manualForm.clienteEmail,
              telefono: manualForm.clienteTelefono,
            }
          : null,
        metodoId: manualForm.metodoId,
        items,
      })

      resetManualForm()
      setMessage('Venta manual registrada correctamente')
      await recargarTodo()
      return true
    } catch (err) {
      setError(err?.message || 'No se pudo registrar la venta manual')
      return false
    } finally {
      setSaving(false)
    }
  }

  async function eliminarVenta(ventaId) {
    if (!window.confirm(`¿Eliminar la venta #${ventaId}? Esta accion no se puede deshacer.`)) {
      return
    }

    setSaving(true)
    setError('')
    setMessage('')

    try {
      await ventaService.eliminarVenta(ventaId)
      setVentas((prev) => prev.filter((venta) => Number(venta.venta_id) !== Number(ventaId)))
      setMessage(`Venta ${ventaId} eliminada correctamente`)
    } catch (err) {
      setError(err?.message || 'No se pudo eliminar la venta')
    } finally {
      setSaving(false)
    }
  }

  async function descargarReporteMensual() {
    setSaving(true)
    setError('')
    setMessage('')

    try {
      await ventaService.descargarReporteMensual({ mes: periodo.mes, anio: periodo.anio })
      setMessage(`Reporte mensual ${periodo.mes}/${periodo.anio} descargado correctamente`)
    } catch (err) {
      setError(err?.message || 'No se pudo descargar el reporte mensual')
    } finally {
      setSaving(false)
    }
  }

  async function descargarReporteResumen() {
    setSaving(true)
    setError('')
    setMessage('')

    try {
      await ventaService.descargarReporteResumen({ mes: periodo.mes, anio: periodo.anio })
      setMessage(`Resumen de productos y clientes ${periodo.mes}/${periodo.anio} descargado correctamente`)
    } catch (err) {
      setError(err?.message || 'No se pudo descargar el resumen mensual')
    } finally {
      setSaving(false)
    }
  }

  return {
    ventas,
    variantes,
    estados,
    metodos,
    clientes,
    estadoSeleccionado,
    manualForm,
    periodoSeleccionado,
    loading,
    saving,
    message,
    error,
    cambiarEstadoSeleccionado,
    setPeriodoSeleccionado,
    guardarEstadoVenta,
    cambiarManualFormCampo,
    cambiarManualItem,
    agregarItemManual,
    quitarItemManual,
    guardarVentaManual,
    eliminarVenta,
    descargarReporteMensual,
    descargarReporteResumen,
    recargarTodo,
    resetManualForm,
  }
}
