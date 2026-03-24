import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MainLayout } from '../../../layouts/layouts'
import Navbar from '../../../shared/components/Navbar'
import { Cart } from '../components/Cart'
import { CheckoutCustomerStep } from '../components/CheckoutCustomerStep'
import { useCarrito } from '../hooks/useCarrito'
import { useVentas } from '../../ventas/hooks/useVentas'

const INITIAL_CLIENT_FORM = {
  nombre: '',
  email: '',
  telefono: '',
}

const WHATSAPP_NUMBER = (import.meta.env.VITE_WHATSAPP_NUMBER || '').replace(/\D/g, '')

function formatPrice(value) {
  const amount = Number(value) || 0
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(amount)
}

function buildWhatsAppMessage({ cliente, carrito, ventaId }) {
  const items = Array.isArray(carrito?.items) ? carrito.items : []
  const total = Number(carrito?.total) || 0
  const lines = [
    'Hola! Quiero finalizar mi compra.',
    '',
    `Pedido: #${ventaId || '-'}`,
    'Estado: pendiente',
    '',
    `Nombre: ${cliente?.nombre || '-'}`,
    `Email: ${cliente?.email || '-'}`,
    `Telefono: ${cliente?.telefono || '-'}`,
    '',
    'Productos:',
  ]

  if (items.length === 0) {
    lines.push('- (sin productos en carrito)')
  } else {
    items.forEach((item) => {
      const nombre = item?.producto_nombre || `Producto #${item?.producto_id || '-'}`
      const cantidad = Number(item?.cantidad) || 0
      const subtotal = Number(item?.subtotal) || 0

      const variantParts = []
      if (item?.size_valor) variantParts.push(`Medida: ${item.size_valor}`)
      if (item?.tela_nombre) variantParts.push(`Tela: ${item.tela_nombre}`)

      const variantText = variantParts.length > 0
        ? ` | ${variantParts.join(' | ')}`
        : ''

      lines.push(`- ${nombre} x${cantidad}${variantText} (${formatPrice(subtotal)})`)
    })
  }

  lines.push('')
  lines.push(`Total: ${formatPrice(total)}`)
  return lines.join('\n')
}

export function CartPage() {
  const navigate = useNavigate()

  const {
    carrito,
    loading,
    error,
    getClienteTemporalId,
    getOrCreateClienteTemporalId,
    completarDatosClienteTemporal,
    handleGetCarrito,
    handleEliminarItem,
    handleUpdateCantidad,
    handleVaciarCarrito,
  } = useCarrito()

  const { registrarVentaWeb } = useVentas()

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

  const handleGoToWhatsApp = async (event) => {
    event.preventDefault()
    setCheckoutNotice({ type: '', text: '' })

    if (!WHATSAPP_NUMBER) {
      setCheckoutNotice({
        type: 'error',
        text: 'Falta configurar VITE_WHATSAPP_NUMBER en el frontend.',
      })
      return
    }

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

      const carritoSnapshot = {
        ...carrito,
        items: Array.isArray(carrito?.items) ? [...carrito.items] : [],
      }

      const ventaRegistrada = await registrarVentaWeb({
        clienteId: getClienteTemporalId(),
        items: carrito?.items || [],
      })

      const ventaId = ventaRegistrada?.venta_id || ventaRegistrada?.id || null

      setCheckoutNotice({
        type: 'success',
        text: ventaId
          ? `Pedido #${ventaId} generado correctamente en estado pendiente.`
          : 'Pedido generado correctamente en estado pendiente.',
      })

      try {
        await handleVaciarCarrito()
      } catch {
        // Si falla el vaciado no bloqueamos el flujo de WhatsApp.
      }

      const message = buildWhatsAppMessage({
        cliente: clienteActualizado,
        carrito: carritoSnapshot,
        ventaId,
      })

      const url = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}`
      window.location.assign(url)
    } catch (err) {
      setCheckoutNotice({
        type: 'error',
        text: err?.message || 'No se pudieron guardar los datos del cliente para continuar por WhatsApp.',
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
            onSubmit={handleGoToWhatsApp}
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