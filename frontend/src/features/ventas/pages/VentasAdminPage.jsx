import { MainLayout } from '../../../layouts/layouts'
import { useVentasAdmin } from '../hooks/useVentasAdmin'
import { Fragment, useState } from 'react'
import AdminNavbar from '../../../shared/components/AdminNavbar'

function formatMoney(value) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
  }).format(Number(value || 0))
}

export function VentasAdminPage() {
  const [expandedVentaId, setExpandedVentaId] = useState(null)

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

  return (
    <MainLayout navbar={<AdminNavbar />}>
      {message ? <p className="alert">{message}</p> : null}
      {error ? <p className="alert">{error}</p> : null}

      <section className="card section-toolbar">
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
      </section>

      <section className="card">
        <h2>Administracion de Ventas</h2>
        <p className="ventas-admin-note">
          Gestion de estados con tabla estados_venta, control transaccional de stock y filtro por periodo mensual.
        </p>

        {loading ? <p>Cargando ventas...</p> : null}

        {!loading && ventas.length === 0 ? <p>No hay ventas registradas.</p> : null}

        {!loading && ventas.length > 0 ? (
          <div className="table-wrap">
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
                        <td>{formatMoney(venta.total)}</td>
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
                                    Cantidad: {item.cantidad} · Unitario: {formatMoney(item.precio_unitario)} · Subtotal:{' '}
                                    {formatMoney(item.subtotal)}
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
        ) : null}
      </section>

      <section className="card">
        <h2>Registrar Venta Manual</h2>

        <div className="grid two ventas-manual-grid">
          <label className="field">
            <span>Cliente</span>
            <select
              disabled={manualForm.usarClienteNuevo}
              value={manualForm.clienteId}
              onChange={(event) => cambiarManualFormCampo('clienteId', event.target.value)}
            >
              <option value="">Seleccionar cliente</option>
              {clientes.map((cliente) => (
                <option key={cliente.cliente_id} value={cliente.cliente_id}>
                  {cliente.nombre} ({cliente.email})
                </option>
              ))}
            </select>
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
                <span>Producto / Variante</span>
                <select
                  value={item.variante_id}
                  onChange={(event) => cambiarManualItem(index, 'variante_id', event.target.value)}
                >
                  <option value="">Seleccionar producto</option>
                  {variantes.map((variante) => (
                    <option key={variante.variante_id} value={variante.variante_id}>
                      {variante.producto_nombre} · {variante.Size || 'Sin medida'} · {variante.tela || 'Sin tela'} · Stock {Number(variante.stock || 0)}
                    </option>
                  ))}
                </select>
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
                  onClick={agregarItemManual}
                  disabled={saving}
                >
                  + Item
                </button>
                <button
                  type="button"
                  className="btn danger tiny"
                  onClick={() => quitarItemManual(index)}
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
      </section>
    </MainLayout>
  )
}
