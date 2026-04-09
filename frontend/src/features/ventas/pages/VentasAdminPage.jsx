import { MainLayout } from '../../../layouts/layouts'
import { useVentasAdmin } from '../hooks/useVentasAdmin'
import { Fragment, useMemo, useState } from 'react'
import AdminNavbar from '../../../shared/components/AdminNavbar'
import { formatCurrency } from '../../../shared/utils/utils'

export function VentasAdminPage() {
  const [expandedVentaId, setExpandedVentaId] = useState(null)
  const [expandedSections, setExpandedSections] = useState({
    administracion: true,
    manual: false,
  })
  const [clienteQuery, setClienteQuery] = useState('')
  const [showClienteSuggestions, setShowClienteSuggestions] = useState(false)
  const [itemProductoQueries, setItemProductoQueries] = useState({})
  const [itemVarianteQueries, setItemVarianteQueries] = useState({})
  const [itemProductoIds, setItemProductoIds] = useState({})
  const [focusedProductoIndex, setFocusedProductoIndex] = useState(null)
  const [focusedVarianteIndex, setFocusedVarianteIndex] = useState(null)

  function toggleSection(sectionKey) {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }))
  }

  const {
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
  } = useVentasAdmin()

  function handleToggleDetalle(ventaId) {
    setExpandedVentaId((prev) => (Number(prev) === Number(ventaId) ? null : Number(ventaId)))
  }

  const clienteSeleccionado = useMemo(() => {
    return clientes.find((cliente) => Number(cliente.cliente_id) === Number(manualForm.clienteId)) || null
  }, [clientes, manualForm.clienteId])

  const clientesFiltrados = useMemo(() => {
    const term = String(clienteQuery || '').trim().toLowerCase()
    if (!term) return clientes.slice(0, 8)
    return clientes
      .filter((cliente) => {
        const nombre = String(cliente.nombre || '').toLowerCase()
        const email = String(cliente.email || '').toLowerCase()
        const telefono = String(cliente.telefono || '').toLowerCase()
        return nombre.includes(term) || email.includes(term) || telefono.includes(term)
      })
      .slice(0, 8)
  }, [clienteQuery, clientes])

  const productosDisponibles = useMemo(() => {
    const map = new Map()
    variantes.forEach((variante) => {
      const productoId = Number(variante.producto_id)
      if (!Number.isInteger(productoId) || productoId <= 0) return
      if (map.has(productoId)) return
      map.set(productoId, {
        producto_id: productoId,
        producto_nombre: variante.producto_nombre || `Producto ${productoId}`,
      })
    })
    return Array.from(map.values())
  }, [variantes])

  const productosFiltradosPorItem = useMemo(() => {
    const result = {}
    Object.keys(itemProductoQueries).forEach((key) => {
      const index = Number(key)
      const term = String(itemProductoQueries[index] || '').trim().toLowerCase()
      if (!term) {
        result[index] = productosDisponibles.slice(0, 8)
        return
      }
      result[index] = productosDisponibles
        .filter((producto) => String(producto.producto_nombre || '').toLowerCase().includes(term))
        .slice(0, 8)
    })
    return result
  }, [itemProductoQueries, productosDisponibles])

  function getVarianteLabel(variante) {
    const medida =
      variante.size_valor ||
      variante.Size ||
      variante.size ||
      variante.medida ||
      variante.valor_size ||
      null

    const tela =
      variante.tela_nombre ||
      variante.tela ||
      variante.nombre_tela ||
      null

    const rellenoValue = variante.relleno
    const hasRelleno =
      rellenoValue === true ||
      rellenoValue === 1 ||
      rellenoValue === '1' ||
      String(rellenoValue || '').toLowerCase() === 'true'

    const rellenoLabel = hasRelleno ? 'Con relleno' : 'Sin relleno'
    return `${medida || 'Sin medida'} · ${tela || 'Sin tela'} · ${rellenoLabel} · Stock ${Number(variante.stock || 0)}`
  }

  function getSelectedProductoLabel(index, varianteId) {
    const manualProductoId = Number(itemProductoIds[index])
    if (manualProductoId > 0) {
      const producto = productosDisponibles.find((item) => Number(item.producto_id) === manualProductoId)
      return producto?.producto_nombre || ''
    }

    const selectedVariante = variantes.find((variante) => Number(variante.variante_id) === Number(varianteId))
    return selectedVariante?.producto_nombre || ''
  }

  function getSelectedProductoId(index, varianteId) {
    const manualProductoId = Number(itemProductoIds[index])
    if (manualProductoId > 0) return manualProductoId

    const selectedVariante = variantes.find((variante) => Number(variante.variante_id) === Number(varianteId))
    return Number(selectedVariante?.producto_id) || 0
  }

  function getVariantesPorProducto(productoId) {
    return variantes.filter((variante) => Number(variante.producto_id) === Number(productoId))
  }

  function getVariantesFiltradas(productoId, query) {
    const variantesProducto = getVariantesPorProducto(productoId)
    const term = String(query || '').trim().toLowerCase()
    if (!term) return variantesProducto.slice(0, 8)
    return variantesProducto
      .filter((variante) => getVarianteLabel(variante).toLowerCase().includes(term))
      .slice(0, 8)
  }

  function handleClienteSelect(cliente) {
    cambiarManualFormCampo('clienteId', String(cliente.cliente_id))
    setClienteQuery(`${cliente.nombre}${cliente.email ? ` (${cliente.email})` : ''}`)
    setShowClienteSuggestions(false)
  }

  function handleProductoQueryChange(index, value) {
    setItemProductoQueries((prev) => ({ ...prev, [index]: value }))
    setItemProductoIds((prev) => ({ ...prev, [index]: '' }))
    setItemVarianteQueries((prev) => ({ ...prev, [index]: '' }))
    cambiarManualItem(index, 'variante_id', '')
  }

  function handleProductoSelect(index, producto) {
    const variantesProducto = getVariantesPorProducto(producto.producto_id)

    setItemProductoQueries((prev) => ({
      ...prev,
      [index]: producto.producto_nombre,
    }))
    setItemProductoIds((prev) => ({
      ...prev,
      [index]: Number(producto.producto_id),
    }))
    setFocusedProductoIndex(null)

    if (variantesProducto.length === 1) {
      const unicaVariante = variantesProducto[0]
      cambiarManualItem(index, 'variante_id', unicaVariante.variante_id)
      setItemVarianteQueries((prev) => ({
        ...prev,
        [index]: getVarianteLabel(unicaVariante),
      }))
      setFocusedVarianteIndex(null)
      return
    }

    cambiarManualItem(index, 'variante_id', '')
    setItemVarianteQueries((prev) => ({ ...prev, [index]: '' }))
  }

  function handleVarianteQueryChange(index, value) {
    setItemVarianteQueries((prev) => ({ ...prev, [index]: value }))
    cambiarManualItem(index, 'variante_id', '')
  }

  function handleVarianteSelect(index, variante) {
    cambiarManualItem(index, 'variante_id', variante.variante_id)
    setItemVarianteQueries((prev) => ({ ...prev, [index]: getVarianteLabel(variante) }))
    setFocusedVarianteIndex(null)
  }

  function handleAgregarItemManual() {
    agregarItemManual()
  }

  function handleQuitarItemManual(index) {
    quitarItemManual(index)

    setItemProductoQueries((prev) => {
      const next = {}
      Object.keys(prev).forEach((key) => {
        const idx = Number(key)
        if (idx < index) next[idx] = prev[idx]
        if (idx > index) next[idx - 1] = prev[idx]
      })
      return next
    })

    setItemVarianteQueries((prev) => {
      const next = {}
      Object.keys(prev).forEach((key) => {
        const idx = Number(key)
        if (idx < index) next[idx] = prev[idx]
        if (idx > index) next[idx - 1] = prev[idx]
      })
      return next
    })

    setItemProductoIds((prev) => {
      const next = {}
      Object.keys(prev).forEach((key) => {
        const idx = Number(key)
        if (idx < index) next[idx] = prev[idx]
        if (idx > index) next[idx - 1] = prev[idx]
      })
      return next
    })

    setFocusedProductoIndex((prev) => {
      if (prev == null) return prev
      if (prev === index) return null
      return prev > index ? prev - 1 : prev
    })

    setFocusedVarianteIndex((prev) => {
      if (prev == null) return prev
      if (prev === index) return null
      return prev > index ? prev - 1 : prev
    })
  }

  return (
    <MainLayout navbar={<AdminNavbar />}>
      <div className="ventas-admin-page">
        {message ? <p className="alert">{message}</p> : null}
        {error ? <p className="alert">{error}</p> : null}

        <section className="card section-toolbar">
          <div className="actions">
            <h3 style={{ margin: '0 0 1rem 0' }}>Filtros y reportes</h3>

            <div className="actions">
              <label className="field ventas-periodo-field">
                <span>Periodo</span>
                <input
                  type="month"
                  value={periodoSeleccionado}
                  onChange={(event) => setPeriodoSeleccionado(event.target.value)}
                />
              </label>
              <button type="button" className="btn ghost" onClick={descargarReporteMensual} disabled={saving}>
                Descargar ventas del mes
              </button>
              <button type="button" className="btn ghost" onClick={descargarReporteResumen} disabled={saving}>
                Descargar productos/clientes top
              </button>
              <button type="button" className="btn" onClick={recargarTodo} disabled={loading || saving}>
                Actualizar ventas
              </button>
            </div>
          </div>
        </section>

        <section className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0 }}>Administración de Ventas</h2>
            <button
              type="button"
              className="home-admin-section-toggle"
              onClick={() => toggleSection('administracion')}
              aria-expanded={expandedSections.administracion}
              aria-label={expandedSections.administracion ? 'Ocultar administración' : 'Mostrar administración'}
            >
              <span aria-hidden="true">{expandedSections.administracion ? '▾' : '▸'}</span>
            </button>
          </div>

          {expandedSections.administracion && (
            <>

          {loading ? <p>Cargando ventas...</p> : null}

          {!loading && ventas.length === 0 ? <p>No hay ventas registradas.</p> : null}

          {!loading && ventas.length > 0 ? (
            <>
              <div className="table-wrap ventas-desktop-table">
                <table>
                  <thead>
                    <tr>
                      <th>Venta</th>
                      <th>Fecha</th>
                      <th>Cliente</th>
                      <th>Total</th>
                      <th>Detalle</th>
                      <th>Estado actual</th>
                      <th>Nuevo estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventas.map((venta) => {
                      const detalleItems = Array.isArray(venta.detalle_items) ? venta.detalle_items : []
                      const isExpanded = Number(expandedVentaId) === Number(venta.venta_id)

                      return (
                        <Fragment key={venta.venta_id}>
                          <tr>
                            <td>#{venta.venta_id}</td>
                            <td>{new Date(venta.created_at).toLocaleString('es-AR')}</td>
                            <td>
                              <div className="ventas-cliente-cell">
                                <strong>{venta.cliente_nombre || `Cliente ${venta.cliente_id}`}</strong>
                                <small>{venta.cliente_email || '-'}</small>
                                <small>{venta.cliente_telefono || '-'}</small>
                              </div>
                            </td>
                            <td>{formatCurrency(venta.total)}</td>
                            <td>
                              <button
                                type="button"
                                className="btn ghost tiny"
                                onClick={() => handleToggleDetalle(venta.venta_id)}
                              >
                                {isExpanded ? 'Ocultar' : `Ver (${detalleItems.length})`}
                              </button>
                            </td>
                            <td>
                              <span className="ventas-status-pill">{venta.estado_nombre || `Estado ${venta.estado_id}`}</span>
                            </td>
                            <td>
                              <select
                                value={estadoSeleccionado[Number(venta.venta_id)] || Number(venta.estado_id)}
                                onChange={(event) =>
                                  cambiarEstadoSeleccionado(venta.venta_id, Number(event.target.value))
                                }
                                disabled={saving}
                              >
                                {estados.map((estado) => (
                                  <option key={estado.estado_id} value={estado.estado_id}>
                                    {estado.descripcion}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <div className="actions compact">
                                <button
                                  type="button"
                                  className="btn tiny"
                                  onClick={() => guardarEstadoVenta(venta.venta_id)}
                                  disabled={saving}
                                >
                                  Guardar
                                </button>
                                <button
                                  type="button"
                                  className="btn danger tiny"
                                  onClick={() => eliminarVenta(venta.venta_id)}
                                  disabled={saving}
                                >
                                  Eliminar
                                </button>
                              </div>
                            </td>
                          </tr>

                          {isExpanded ? (
                            <tr key={`detalle-${venta.venta_id}`}>
                              <td colSpan={8}>
                                <div className="ventas-detalle-box">
                                  {detalleItems.length === 0 ? <p>La venta no tiene detalle de items.</p> : null}
                                  {detalleItems.map((item) => (
                                    <article key={item.detalle_id} className="ventas-detalle-item">
                                      <p>
                                        <strong>{item.producto_nombre || `Variante ${item.variante_id}`}</strong>
                                      </p>
                                      <p>
                                        {item.size_valor || 'Sin medida'} · {item.tela_nombre || 'Sin tela'}
                                      </p>
                                      <p>
                                        Cantidad: {item.cantidad} · Unitario: {formatCurrency(item.precio_unitario)} · Subtotal:{' '}
                                        {formatCurrency(item.subtotal)}
                                      </p>
                                    </article>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="ventas-mobile-list">
                {ventas.map((venta) => {
                  const detalleItems = Array.isArray(venta.detalle_items) ? venta.detalle_items : []
                  const isExpanded = Number(expandedVentaId) === Number(venta.venta_id)

                  return (
                    <article key={`mobile-${venta.venta_id}`} className="ventas-mobile-card">
                      <header className="ventas-mobile-head">
                        <strong>Venta #{venta.venta_id}</strong>
                        <small>{new Date(venta.created_at).toLocaleString('es-AR')}</small>
                      </header>

                      <div className="ventas-cliente-cell">
                        <strong>{venta.cliente_nombre || `Cliente ${venta.cliente_id}`}</strong>
                        <small>{venta.cliente_email || '-'}</small>
                        <small>{venta.cliente_telefono || '-'}</small>
                      </div>

                      <p className="ventas-mobile-total">Total: {formatCurrency(venta.total)}</p>

                      <div className="ventas-mobile-state-row">
                        <span className="ventas-status-pill">{venta.estado_nombre || `Estado ${venta.estado_id}`}</span>
                        <button
                          type="button"
                          className="btn ghost tiny"
                          onClick={() => handleToggleDetalle(venta.venta_id)}
                        >
                          {isExpanded ? 'Ocultar detalle' : `Ver detalle (${detalleItems.length})`}
                        </button>
                      </div>

                      <label className="field ventas-mobile-field">
                        <span>Nuevo estado</span>
                        <select
                          value={estadoSeleccionado[Number(venta.venta_id)] || Number(venta.estado_id)}
                          onChange={(event) =>
                            cambiarEstadoSeleccionado(venta.venta_id, Number(event.target.value))
                          }
                          disabled={saving}
                        >
                          {estados.map((estado) => (
                            <option key={estado.estado_id} value={estado.estado_id}>
                              {estado.descripcion}
                            </option>
                          ))}
                        </select>
                      </label>

                      <div className="actions ventas-mobile-actions">
                        <button
                          type="button"
                          className="btn tiny"
                          onClick={() => guardarEstadoVenta(venta.venta_id)}
                          disabled={saving}
                        >
                          Guardar estado
                        </button>
                        <button
                          type="button"
                          className="btn danger tiny"
                          onClick={() => eliminarVenta(venta.venta_id)}
                          disabled={saving}
                        >
                          Eliminar venta
                        </button>
                      </div>

                      {isExpanded ? (
                        <div className="ventas-detalle-box">
                          {detalleItems.length === 0 ? <p>La venta no tiene detalle de items.</p> : null}
                          {detalleItems.map((item) => (
                            <article key={item.detalle_id} className="ventas-detalle-item">
                              <p>
                                <strong>{item.producto_nombre || `Variante ${item.variante_id}`}</strong>
                              </p>
                              <p>
                                {item.size_valor || 'Sin medida'} · {item.tela_nombre || 'Sin tela'}
                              </p>
                              <p>
                                Cantidad: {item.cantidad} · Unitario: {formatCurrency(item.precio_unitario)} · Subtotal:{' '}
                                {formatCurrency(item.subtotal)}
                              </p>
                            </article>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  )
                })}
              </div>
            </>
          ) : null}
            </>
          )}
        </section>

        <section className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0 }}>Registrar Venta Manual</h2>
            <button
              type="button"
              className="home-admin-section-toggle"
              onClick={() => toggleSection('manual')}
              aria-expanded={expandedSections.manual}
              aria-label={expandedSections.manual ? 'Ocultar registrar venta' : 'Mostrar registrar venta'}
            >
              <span aria-hidden="true">{expandedSections.manual ? '▾' : '▸'}</span>
            </button>
          </div>

          {expandedSections.manual && (
            <>

          <div className="grid two ventas-manual-grid">
            <label className="field">
              <span>Cliente</span>
              <div className="home-admin-search-select ventas-search-select">
                <input
                  type="search"
                  disabled={manualForm.usarClienteNuevo}
                  value={clienteQuery}
                  onFocus={() => setShowClienteSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowClienteSuggestions(false), 120)}
                  onChange={(event) => {
                    const value = event.target.value
                    setClienteQuery(value)
                    cambiarManualFormCampo('clienteId', '')
                    setShowClienteSuggestions(true)
                  }}
                  placeholder="Buscar cliente por nombre, email o telefono"
                  autoComplete="off"
                />

                {!manualForm.usarClienteNuevo && showClienteSuggestions && clientesFiltrados.length > 0 ? (
                  <div className="home-admin-search-suggestions ventas-search-suggestions" role="listbox" aria-label="Clientes sugeridos">
                    {clientesFiltrados.map((cliente) => (
                      <button
                        key={cliente.cliente_id}
                        type="button"
                        className="home-admin-search-suggestion ventas-search-suggestion"
                        onMouseDown={(event) => {
                          event.preventDefault()
                          handleClienteSelect(cliente)
                        }}
                      >
                        <span className="home-admin-search-suggestion-name">
                          {cliente.nombre} {cliente.email ? `(${cliente.email})` : ''}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              {manualForm.clienteId && clienteSeleccionado ? (
                <small>Seleccionado: {clienteSeleccionado.nombre}</small>
              ) : null}
            </label>

            <label className="field ventas-manual-toggle">
              <span>Modo de cliente</span>
              <label className="ventas-checkbox-line">
                <input
                  type="checkbox"
                  checked={manualForm.usarClienteNuevo}
                  onChange={(event) => {
                    const checked = event.target.checked
                    cambiarManualFormCampo('usarClienteNuevo', checked)
                    if (checked) {
                      cambiarManualFormCampo('clienteId', '')
                      setClienteQuery('')
                    }
                  }}
                />
                Cargar cliente nuevo manualmente
              </label>
            </label>
          </div>

          {manualForm.usarClienteNuevo ? (
            <div className="grid three ventas-manual-grid">
              <label className="field">
                <span>Nombre cliente</span>
                <input
                  type="text"
                  value={manualForm.clienteNombre}
                  onChange={(event) => cambiarManualFormCampo('clienteNombre', event.target.value)}
                  placeholder="Nombre y apellido"
                />
              </label>

              <label className="field">
                <span>Email cliente</span>
                <input
                  type="email"
                  value={manualForm.clienteEmail}
                  onChange={(event) => cambiarManualFormCampo('clienteEmail', event.target.value)}
                  placeholder="cliente@email.com"
                />
              </label>

              <label className="field">
                <span>Telefono cliente</span>
                <input
                  type="text"
                  value={manualForm.clienteTelefono}
                  onChange={(event) => cambiarManualFormCampo('clienteTelefono', event.target.value)}
                  placeholder="11 5555 5555"
                />
              </label>
            </div>
          ) : null}

          <div className="grid two ventas-manual-grid">
            <label className="field">
              <span>Metodo de pago</span>
              <select
                value={manualForm.metodoId}
                onChange={(event) => cambiarManualFormCampo('metodoId', event.target.value)}
              >
                <option value="">Seleccionar metodo</option>
                {metodos.map((metodo) => (
                  <option key={metodo.metodo_id} value={metodo.metodo_id}>
                    {metodo.descripcion}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="ventas-manual-items">
            {manualForm.items.map((item, index) => (
              <div key={`manual-item-${index}`} className="grid three ventas-manual-item-row">
                <label className="field">
                  <span>Producto y variante</span>
                  <div className="home-admin-search-select ventas-search-select">
                    <input
                      type="search"
                      value={itemProductoQueries[index] ?? getSelectedProductoLabel(index, item.variante_id)}
                      onFocus={() => setFocusedProductoIndex(index)}
                      onBlur={() => setTimeout(() => setFocusedProductoIndex(null), 120)}
                      onChange={(event) => handleProductoQueryChange(index, event.target.value)}
                      placeholder="Buscar producto por nombre"
                      autoComplete="off"
                    />

                    {focusedProductoIndex === index ? (
                      <div className="home-admin-search-suggestions ventas-search-suggestions" role="listbox" aria-label="Productos sugeridos">
                        {(productosFiltradosPorItem[index] || productosDisponibles.slice(0, 8)).map((producto) => (
                          <button
                            key={producto.producto_id}
                            type="button"
                            className="home-admin-search-suggestion ventas-search-suggestion"
                            onMouseDown={(event) => {
                              event.preventDefault()
                              handleProductoSelect(index, producto)
                            }}
                          >
                            <span className="home-admin-search-suggestion-name">{producto.producto_nombre}</span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {(() => {
                    const selectedProductoId = getSelectedProductoId(index, item.variante_id)
                    const variantesProducto = selectedProductoId > 0 ? getVariantesPorProducto(selectedProductoId) : []

                    if (selectedProductoId <= 0) return null

                    if (variantesProducto.length <= 1) {
                      return item.variante_id ? <small>Variante unica seleccionada automaticamente</small> : null
                    }

                    return (
                      <div className="home-admin-search-select ventas-search-select ventas-variant-picker">
                        <input
                          type="search"
                          value={itemVarianteQueries[index] ?? ''}
                          onFocus={() => setFocusedVarianteIndex(index)}
                          onBlur={() => setTimeout(() => setFocusedVarianteIndex(null), 120)}
                          onChange={(event) => handleVarianteQueryChange(index, event.target.value)}
                          placeholder="Seleccionar variante"
                          autoComplete="off"
                        />

                        {focusedVarianteIndex === index ? (
                          <div className="home-admin-search-suggestions ventas-search-suggestions" role="listbox" aria-label="Variantes sugeridas">
                            {getVariantesFiltradas(selectedProductoId, itemVarianteQueries[index] ?? '').map((variante) => (
                              <button
                                key={variante.variante_id}
                                type="button"
                                className="home-admin-search-suggestion ventas-search-suggestion"
                                onMouseDown={(event) => {
                                  event.preventDefault()
                                  handleVarianteSelect(index, variante)
                                }}
                              >
                                <span className="home-admin-search-suggestion-name">{getVarianteLabel(variante)}</span>
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    )
                  })()}
                </label>

                <label className="field">
                  <span>Cantidad</span>
                  <input
                    type="number"
                    min="1"
                    value={item.cantidad}
                    onChange={(event) => cambiarManualItem(index, 'cantidad', event.target.value)}
                  />
                </label>

                <div className="actions ventas-manual-item-actions">
                  <button
                    type="button"
                    className="btn ghost tiny"
                    onClick={handleAgregarItemManual}
                    disabled={saving}
                  >
                    + Item
                  </button>
                  <button
                    type="button"
                    className="btn danger tiny"
                    onClick={() => handleQuitarItemManual(index)}
                    disabled={saving}
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="actions">
            <button type="button" className="btn success" onClick={guardarVentaManual} disabled={saving}>
              Registrar venta manual
            </button>
          </div>
            </>
          )}
        </section>
      </div>
    </MainLayout>
  )
}
