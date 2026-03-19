import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MainLayout } from '../../../layouts/layouts'
import { Cart } from '../components/Cart'
import { useCarrito } from '../hooks/useCarrito'

export function CartPage() {
  const {
    carrito,
    loading,
    error,
    handleGetCarrito,
    handleEliminarItem,
    handleUpdateCantidad,
    handleVaciarCarrito,
  } = useCarrito()

  const [checkoutMessage, setCheckoutMessage] = useState('')

  useEffect(() => {
    handleGetCarrito().catch(() => {
      // El estado de error se maneja en el hook.
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFinalizarCompra = () => {
    setCheckoutMessage('Siguiente paso: crear pantalla de checkout y confirmar venta.')
  }

  return (
    <MainLayout>
      <section className="cart-page">
        <header className="cart-page-header">
          <h1>Tu carrito</h1>
          <p>Revisa productos, cantidades y total antes de finalizar la compra.</p>
          <Link to="/catalogo" className="btn ghost cart-page-back-link">Seguir comprando</Link>
        </header>

        {checkoutMessage ? <p className="alert">{checkoutMessage}</p> : null}

        <Cart
          carrito={carrito}
          loading={loading}
          error={error}
          handleEliminarItem={handleEliminarItem}
          handleUpdateCantidad={handleUpdateCantidad}
          handleVaciarCarrito={handleVaciarCarrito}
          handleFinalizarCompra={handleFinalizarCompra}
        />
      </section>
    </MainLayout>
  )
}