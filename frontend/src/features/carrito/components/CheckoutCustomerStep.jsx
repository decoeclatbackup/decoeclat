import { formatCurrency } from '../../../shared/utils/utils'

export function CheckoutCustomerStep({
  formData,
  onChange,
  onSubmit,
  onBack,
  loading = false,
  itemsCount = 0,
  total = 0,
  notice,
  clienteGuardado,
}) {
  const noticeClass =
    notice?.type === 'error'
      ? 'checkout-notice checkout-notice-error'
      : notice?.type === 'success'
        ? 'checkout-notice checkout-notice-success'
        : 'checkout-notice'

  return (
    <section className="card checkout-step">
      <header className="checkout-step-header">
        <h2>Datos del cliente</h2>
        <p>Completa tus datos para continuar con la compra.</p>
      </header>

      <div className="checkout-step-resumen">
        <span>{itemsCount} {itemsCount === 1 ? 'producto' : 'productos'}</span>
        <strong>Total: {formatCurrency(total)}</strong>
      </div>

      <form className="checkout-client-form" onSubmit={onSubmit}>
        <label className="field">
          <span>Nombre y apellido</span>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={onChange}
            placeholder="Ej: Mauro Perez"
            autoComplete="name"
            required
            disabled={loading}
          />
        </label>

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={onChange}
            placeholder="tuemail@gmail.com"
            autoComplete="email"
            required
            disabled={loading}
          />
        </label>

        <label className="field">
          <span>Telefono</span>
          <input
            type="tel"
            name="telefono"
            value={formData.telefono}
            onChange={onChange}
            placeholder="Ej: 3512345678"
            autoComplete="tel"
            disabled={loading}
          />
        </label>

        <div className="actions checkout-step-actions">
          <button
            type="button"
            className="btn ghost"
            onClick={onBack}
            disabled={loading}
          >
            Volver al carrito
          </button>

          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Procesando...' : 'Comprar'}
          </button>
        </div>
      </form>

      {notice?.text ? <p className={noticeClass}>{notice.text}</p> : null}

      {clienteGuardado ? (
        <p className="checkout-next-hint">
          Datos guardados correctamente.
        </p>
      ) : null}
    </section>
  )
}
