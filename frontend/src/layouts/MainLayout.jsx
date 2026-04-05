import SiteFooter from '../shared/components/SiteFooter'
import FloatingWhatsAppButton from '../shared/components/FloatingWhatsAppButton'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

const CART_ITEM_ADDED_EVENT = 'decoeclat:cart-item-added'
const SEO_DEFAULT_TITLE = 'DECOECLAT | Textiles y deco para el hogar en Argentina'
const SEO_DEFAULT_DESCRIPTION = 'DECOECLAT: textiles, fundas y deco para transformar tu hogar con estilo.'
const SEO_DEFAULT_IMAGE_PATH = '/deco2-editado.jpg'

function upsertMetaTag({ name, property, content }) {
  if (typeof document === 'undefined') return

  const selector = name ? `meta[name="${name}"]` : `meta[property="${property}"]`
  let node = document.head.querySelector(selector)

  if (!node) {
    node = document.createElement('meta')
    if (name) node.setAttribute('name', name)
    if (property) node.setAttribute('property', property)
    document.head.appendChild(node)
  }

  node.setAttribute('content', content)
}

function upsertLinkTag({ rel, href }) {
  if (typeof document === 'undefined') return

  let node = document.head.querySelector(`link[rel="${rel}"]`)
  if (!node) {
    node = document.createElement('link')
    node.setAttribute('rel', rel)
    document.head.appendChild(node)
  }

  node.setAttribute('href', href)
}

function buildAbsoluteUrl(pathOrUrl) {
  if (typeof window === 'undefined') return String(pathOrUrl || '')

  const value = String(pathOrUrl || '').trim()
  if (!value) return `${window.location.origin}/`

  if (/^https?:\/\//i.test(value)) return value

  const safePath = value.startsWith('/') ? value : `/${value}`
  return `${window.location.origin}${safePath}`
}

export function MainLayout({ navbar, title, description, image, noIndex = false, children }) {
  const { pathname, search } = useLocation()
  const isAdminRoute = pathname.startsWith('/admin')
  const [cartToastMessage, setCartToastMessage] = useState('')

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return

    const pageTitle = String(title || '').trim()
    const seoTitle = pageTitle ? `DECOECLAT | ${pageTitle}` : SEO_DEFAULT_TITLE
    const seoDescription = String(description || '').trim() || SEO_DEFAULT_DESCRIPTION
    const canonicalUrl = `${window.location.origin}${pathname}${search}`
    const seoImage = buildAbsoluteUrl(image || SEO_DEFAULT_IMAGE_PATH)
    const robotsContent = (noIndex || isAdminRoute)
      ? 'noindex,nofollow,noarchive'
      : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'

    document.title = seoTitle

    upsertMetaTag({ name: 'description', content: seoDescription })
    upsertMetaTag({ name: 'robots', content: robotsContent })

    upsertMetaTag({ property: 'og:site_name', content: 'DECOECLAT' })
    upsertMetaTag({ property: 'og:locale', content: 'es_AR' })
    upsertMetaTag({ property: 'og:type', content: 'website' })
    upsertMetaTag({ property: 'og:title', content: seoTitle })
    upsertMetaTag({ property: 'og:description', content: seoDescription })
    upsertMetaTag({ property: 'og:url', content: canonicalUrl })
    upsertMetaTag({ property: 'og:image', content: seoImage })

    upsertMetaTag({ name: 'twitter:card', content: 'summary_large_image' })
    upsertMetaTag({ name: 'twitter:title', content: seoTitle })
    upsertMetaTag({ name: 'twitter:description', content: seoDescription })
    upsertMetaTag({ name: 'twitter:image', content: seoImage })

    upsertLinkTag({ rel: 'canonical', href: canonicalUrl })
  }, [description, image, isAdminRoute, noIndex, pathname, search, title])

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
