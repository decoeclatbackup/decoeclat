import SiteFooter from '../shared/components/SiteFooter'
import FloatingWhatsAppButton from '../shared/components/FloatingWhatsAppButton'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

const CART_ITEM_ADDED_EVENT = 'decoeclat:cart-item-added'

export function MainLayout({navbar, children }) {
  const { pathname } = useLocation()
  const isAdminRoute = pathname.startsWith('/admin')
  const [cartToastMessage, setCartToastMessage] = useState('')

  useEffect(() => {
    if (isAdminRoute || typeof window === 'undefined') return undefined

    let timeoutId = null

    function handleCartItemAdded(event) {
      const message = String(event?.detail?.message || 'Producto agregado al carrito').trim()
      setCartToastMessage(message)

      if (timeoutId) {
        window.clearTimeout(timeoutId)
      }

      timeoutId = window.setTimeout(() => {
        setCartToastMessage('')
        timeoutId = null
      }, 2200)
    }

    window.addEventListener(CART_ITEM_ADDED_EVENT, handleCartItemAdded)

    return () => {
      window.removeEventListener(CART_ITEM_ADDED_EVENT, handleCartItemAdded)
      if (timeoutId) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [isAdminRoute])

  return (
    <div className="app-page">
      {navbar ? <div className="app-topbar">{navbar}</div> : null}
      <main className="app-shell">
        <section className="content">{children}</section>
      </main>
      {!isAdminRoute && cartToastMessage ? (
        <div className="app-cart-toast" role="status" aria-live="polite">
          {cartToastMessage}
        </div>
      ) : null}
      <SiteFooter />
      {!isAdminRoute ? <FloatingWhatsAppButton /> : null}
    </div>
  )
}
