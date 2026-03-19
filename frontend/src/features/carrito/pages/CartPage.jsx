import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MainLayout } from '../../../layouts/layouts'
import Navbar from '../../../shared/components/Navbar'
import { Cart } from '../components/Cart'
import { CheckoutCustomerStep } from '../components/CheckoutCustomerStep'
import { useCarrito } from '../hooks/useCarrito'

const INITIAL_CLIENT_FORM = {
  nombre: '',
  email: '',
  telefono: '',
}

export function CartPage() {
  const navigate = useNavigate()

  const {
    carrito,
    loading,
    error,
    getOrCreateClienteTemporalId,
    completarDatosClienteTemporal,
    handleGetCarrito,
    handleEliminarItem,
    handleUpdateCantidad,
    handleVaciarCarrito,
  } = useCarrito()

  const [checkoutStep, setCheckoutStep] = useState('carrito')
  const [clientForm, setClientForm] = useState(INITIAL_CLIENT_FORM)
  const [checkoutNotice, setCheckoutNotice] = useState({ type: '', text: '' })
  const [clienteGuardado, setClienteGuardado] = useState(null)

  const itemsCount = Array.isArray(carrito?.items) ? carrito.items.length : 0
  const total = Number(carrito?.total) || 0

  useEffect(() => {
    handleGetCarrito().catch(() => {
      // El estado de error se maneja en el hook.
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFinalizarCompra = async () => {
    setCheckoutNotice({ type: '', text: '' })
    try {
      await getOrCreateClienteTemporalId()
      setCheckoutStep('cliente')
    } catch (err) {
      setCheckoutNotice({
        type: 'error',
        text: err?.message || 'No se pudo iniciar la carga de datos del cliente.',
      })
    }
  }

  const handleClientChange = (event) => {
    const { name, value } = event.target
    setClientForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleBackToCart = () => {
    setCheckoutStep('carrito')
    setCheckoutNotice({ type: '', text: '' })
  }

  const handleSubmitCliente = async (event) => {
    event.preventDefault()
    setCheckoutNotice({ type: '', text: '' })

    const payload = {
      nombre: clientForm.nombre.trim(),
      email: clientForm.email.trim().toLowerCase(),
      telefono: clientForm.telefono.trim() || null,
    }

    if (!payload.nombre || !payload.email) {
      setCheckoutNotice({
        type: 'error',
        text: 'Nombre y email son obligatorios para continuar.',
      })
      return
    }

    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)
    if (!isEmailValid) {
      setCheckoutNotice({
        type: 'error',
        text: 'Ingresa un email valido.',
      })
      return
    }

    try {
      const clienteActualizado = await completarDatosClienteTemporal(payload)
      setClienteGuardado(clienteActualizado)
      setCheckoutNotice({
        type: 'success',
        text: 'Datos del cliente guardados correctamente.',
      })
    } catch (err) {
      setCheckoutNotice({
        type: 'error',
        text: err?.message || 'No se pudieron guardar los datos del cliente.',
      })
    }
  }

  const handleNavbarSearch = () => {
    navigate('/catalogo')
  }

  return (
    <MainLayout
      navbar={
        <Navbar
          categories={[]}
          selectedCategoryId={null}
          searchValue=""
          onSearchSubmit={handleNavbarSearch}
        />
      }
    >
      <section className="cart-page">
        <header className="cart-page-header">
          <h1>{checkoutStep === 'carrito' ? 'Tu carrito' : 'Finalizar compra'}</h1>
          <p>
            {checkoutStep === 'carrito'
              ? 'Revisa productos, cantidades y total antes de finalizar la compra.'
              : 'Paso 2: carga de datos del cliente.'}
          </p>
          <Link to="/catalogo" className="btn ghost cart-page-back-link">Seguir comprando</Link>
        </header>

        {checkoutNotice.type === 'error' && checkoutStep === 'carrito' ? (
          <p className="alert">{checkoutNotice.text}</p>
        ) : null}

        {checkoutStep === 'carrito' ? (
          <Cart
            carrito={carrito}
            loading={loading}
            error={error}
            handleEliminarItem={handleEliminarItem}
            handleUpdateCantidad={handleUpdateCantidad}
            handleVaciarCarrito={handleVaciarCarrito}
            handleFinalizarCompra={handleFinalizarCompra}
          />
        ) : (
          <CheckoutCustomerStep
            formData={clientForm}
            onChange={handleClientChange}
            onSubmit={handleSubmitCliente}
            onBack={handleBackToCart}
            loading={loading}
            itemsCount={itemsCount}
            total={total}
            notice={checkoutNotice}
            clienteGuardado={clienteGuardado}
          />
        )}
      </section>
    </MainLayout>
  )
}