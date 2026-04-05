import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { homePublicService } from '../../features/home/services/homePublicService'
import { carritoServices } from '../../features/carrito/services/carritoService'
import { formatCurrency } from '../utils/utils'

const CART_UPDATED_EVENT = 'decoeclat:cart-updated'
const API_BASE_URL = import.meta.env.VITE_API_URL || ''
const CATEGORY_DISPLAY_ORDER = [
  'textiles',
  'kids',
  'combos',
  'cesteria',
  'para la cocina',
  'para la mesa',
]

function normalizeCategoryName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function resolveImageUrl(url) {
  if (!url) return null
  if (/^https?:\/\//i.test(url)) return url
  if (API_BASE_URL) return `${API_BASE_URL}${url}`
  if (url.startsWith('/uploads')) return `http://localhost:4000${url}`
  return url
}

function getItemsCount(carrito) {
  const items = Array.isArray(carrito?.items) ? carrito.items : []
  if (!items.length) return 0

  return items.reduce((acc, item) => acc + (Number(item?.cantidad) || 0), 0)
}

function buildCategoryTree(categories) {
  const items = Array.isArray(categories) ? categories : []
  const categoriesById = new Map(items.map((category) => [String(category.categoria_id), category]))

  const rootCategories = items.filter((category) => {
    if (category.parent_id == null) return true
    return !categoriesById.has(String(category.parent_id))
  })

  return rootCategories.map((category) => ({
    id: String(category.categoria_id),
    name: category.nombre,
    children: items
      .filter((child) => String(child.parent_id) === String(category.categoria_id))
      .map((child) => ({
        id: String(child.categoria_id),
        name: child.nombre,
      })),
  }))
}

export default function HomePublicNavbar({ searchValue = '', onSearchSubmit, categories = [] }) {
  const [draftSearchValue, setDraftSearchValue] = useState(searchValue)
  const [internalCategories, setInternalCategories] = useState([])
  const [searchSuggestions, setSearchSuggestions] = useState([])
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false)
  const [cartItemsCount, setCartItemsCount] = useState(0)
  const [isProductsMenuOpen, setIsProductsMenuOpen] = useState(false)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [mobileMenuView, setMobileMenuView] = useState('main')
  const [mobileActiveCategory, setMobileActiveCategory] = useState(null)
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(max-width: 900px)').matches
  })
  const closeTimerRef = useRef(null)
  const adminAccount = (() => {
    if (typeof window === 'undefined') return '/admin/login'
    const token = localStorage.getItem('authToken')
    const rawUser = localStorage.getItem('authUser')

    if (!token || !rawUser) {
      return { path: '/admin/login', isLoggedIn: false }
    }

    try {
      const user = JSON.parse(rawUser)
      const isLoggedIn = Number(user?.rol) === 1
      return { path: isLoggedIn ? '/admin/home' : '/admin/login', isLoggedIn }
    } catch {
      return { path: '/admin/login', isLoggedIn: false }
    }
  })()

  useEffect(() => {
    setDraftSearchValue(searchValue || '')
  }, [searchValue])

  useEffect(() => {
    const term = String(draftSearchValue || '').trim()
    if (term.length < 2) {
      setSearchSuggestions([])
      setIsSearchingSuggestions(false)
      return undefined
    }

    let cancelled = false
    const timeoutId = window.setTimeout(async () => {
      setIsSearchingSuggestions(true)
      try {
        const items = await homePublicService.searchProductsByName(term, 6)
        if (!cancelled) {
          setSearchSuggestions(items)
        }
      } catch {
        if (!cancelled) {
          setSearchSuggestions([])
        }
      } finally {
        if (!cancelled) {
          setIsSearchingSuggestions(false)
        }
      }
    }, 220)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [draftSearchValue])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const mediaQuery = window.matchMedia('(max-width: 900px)')
    const handleChange = (event) => {
      setIsMobileViewport(event.matches)
      setIsProductsMenuOpen(false)
      setIsMobileNavOpen(false)
    }

    setIsMobileViewport(mediaQuery.matches)

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }

    mediaQuery.addListener(handleChange)
    return () => mediaQuery.removeListener(handleChange)
  }, [])

  useEffect(() => () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current)
    }
  }, [])

  useEffect(() => {
    function handlePointerDown(event) {
      if (event.target?.closest?.('.home-top-search')) return
      setIsSearchFocused(false)
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsSearchFocused(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function ensureCategories() {
      if (Array.isArray(categories) && categories.length > 0) {
        setInternalCategories(categories)
        return
      }

      try {
        const result = await homePublicService.listCategories()
        if (!cancelled) {
          setInternalCategories(Array.isArray(result) ? result : [])
        }
      } catch {
        if (!cancelled) {
          setInternalCategories([])
        }
      }
    }

    ensureCategories()

    return () => {
      cancelled = true
    }
  }, [categories])

  useEffect(() => {
    let cancelled = false

    async function loadCartItemsCount() {
      const clienteId = localStorage.getItem('clienteId')
      if (!clienteId) {
        if (!cancelled) setCartItemsCount(0)
        return
      }

      try {
        const carrito = await carritoServices.getCarrito(clienteId)
        if (!cancelled) {
          setCartItemsCount(getItemsCount(carrito))
        }
      } catch {
        if (!cancelled) {
          setCartItemsCount(0)
        }
      }
    }

    function handleCartUpdated(event) {
      const count = Number(event?.detail?.itemsCount)
      setCartItemsCount(Number.isFinite(count) ? Math.max(0, count) : 0)
    }

    loadCartItemsCount()
    window.addEventListener(CART_UPDATED_EVENT, handleCartUpdated)

    return () => {
      cancelled = true
      window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdated)
    }
  }, [])

  const categoryTree = useMemo(() => buildCategoryTree(internalCategories), [internalCategories])
  const orderedCategoryTree = useMemo(() => {
    const orderIndexByName = new Map(
      CATEGORY_DISPLAY_ORDER.map((name, index) => [name, index])
    )

    const items = [...categoryTree]
    items.sort((a, b) => {
      const aOrder = orderIndexByName.get(normalizeCategoryName(a.name))
      const bOrder = orderIndexByName.get(normalizeCategoryName(b.name))
      const aHasCustomOrder = Number.isInteger(aOrder)
      const bHasCustomOrder = Number.isInteger(bOrder)

      if (aHasCustomOrder && bHasCustomOrder) {
        return aOrder - bOrder
      }

      if (aHasCustomOrder) return -1
      if (bHasCustomOrder) return 1

      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
    })
    return items
  }, [categoryTree])

  function clearCloseTimer() {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  function openProductsMenu() {
    clearCloseTimer()
    setIsProductsMenuOpen(true)
  }

  function scheduleCloseProductsMenu(delay = 240) {
    clearCloseTimer()
    closeTimerRef.current = window.setTimeout(() => {
      setIsProductsMenuOpen(false)
      closeTimerRef.current = null
    }, delay)
  }

  function handleProductsMouseEnter() {
    if (isMobileViewport) return
    openProductsMenu()
  }

  function handleProductsMouseLeave() {
    if (isMobileViewport) return
    scheduleCloseProductsMenu()
  }

  function handleProductsBlur(event) {
    if (isMobileViewport) return
    const nextTarget = event.relatedTarget
    if (event.currentTarget.contains(nextTarget)) return
    scheduleCloseProductsMenu(180)
  }

  function handleMobileProductsToggle() {
    if (!isMobileViewport) return
    clearCloseTimer()
    setIsProductsMenuOpen((prev) => !prev)
  }

  function handleCategoryClick() {
    setIsProductsMenuOpen(false)
    setIsMobileNavOpen(false)
    setMobileMenuView('main')
    setMobileActiveCategory(null)
  }

  function handleNavLinkClick() {
    if (!isMobileViewport) return
    setIsProductsMenuOpen(false)
    setIsMobileNavOpen(false)
    setMobileMenuView('main')
    setMobileActiveCategory(null)
  }

  function handleMobileMenuToggle() {
    if (!isMobileViewport) return
    setIsMobileNavOpen((prev) => {
      const nextValue = !prev
      if (!nextValue) {
        setIsProductsMenuOpen(false)
        setMobileMenuView('main')
        setMobileActiveCategory(null)
      }
      return nextValue
    })
  }

  function handleCloseMobileMenu() {
    if (!isMobileViewport) return
    setIsMobileNavOpen(false)
    setIsProductsMenuOpen(false)
    setMobileMenuView('main')
    setMobileActiveCategory(null)
  }

  function handleOpenMobileProducts() {
    if (!isMobileViewport) return
    setMobileMenuView('products')
    setMobileActiveCategory(null)
  }

  function handleOpenMobileSubcategories(category) {
    if (!isMobileViewport || !category?.children?.length) return
    setMobileActiveCategory(category)
    setMobileMenuView('subcategory')
  }

  function handleMobileBackToMain() {
    setMobileMenuView('main')
    setMobileActiveCategory(null)
  }

  function handleMobileBackToProducts() {
    setMobileMenuView('products')
    setMobileActiveCategory(null)
  }

  function handleSubmit(event) {
    event.preventDefault()
    onSearchSubmit?.(draftSearchValue)
    setIsSearchFocused(false)
    if (isMobileViewport) {
      setIsMobileNavOpen(false)
      setIsProductsMenuOpen(false)
    }
  }

  function handleSearchSuggestionClick() {
    setIsSearchFocused(false)
    setIsProductsMenuOpen(false)
    if (isMobileViewport) {
      setIsMobileNavOpen(false)
      setMobileMenuView('main')
      setMobileActiveCategory(null)
    }
  }

  function renderSearchSuggestions() {
    const hasEnoughCharacters = String(draftSearchValue || '').trim().length >= 2
    const shouldRender = isSearchFocused && hasEnoughCharacters && (isSearchingSuggestions || searchSuggestions.length > 0)
    if (!shouldRender) return null

    return (
      <div className="home-top-search-suggestions" role="listbox" aria-label="Sugerencias de productos">
        {isSearchingSuggestions ? (
          <p className="home-top-search-suggestions-empty">Buscando...</p>
        ) : (
          searchSuggestions.map((product) => (
            <Link
              key={product.producto_id}
              to={`/producto/${product.producto_id}`}
              className="home-top-search-suggestion-item"
              onClick={handleSearchSuggestionClick}
            >
              <span className="home-top-search-suggestion-thumb" aria-hidden="true">
                {resolveImageUrl(product.imagen_principal) ? (
                  <img
                    src={resolveImageUrl(product.imagen_principal)}
                    alt={product.nombre}
                    className="home-top-search-suggestion-image"
                    loading="lazy"
                  />
                ) : (
                  <span className="home-top-search-suggestion-image-fallback">Sin imagen</span>
                )}
              </span>
              <span className="home-top-search-suggestion-text">
                <span className="home-top-search-suggestion-name">{product.nombre}</span>
                {product.categoria ? (
                  <span className="home-top-search-suggestion-category">{product.categoria}</span>
                ) : null}
                {Number(product.finalPrice) > 0 ? (
                  product.hasOffer && Number(product.basePrice) > Number(product.finalPrice) ? (
                    <span className="home-top-search-suggestion-price-group">
                      <span className="home-top-search-suggestion-price-old">{formatCurrency(product.basePrice)}</span>
                      <span className="home-top-search-suggestion-price">{formatCurrency(product.finalPrice)}</span>
                    </span>
                  ) : (
                    <span className="home-top-search-suggestion-price">{formatCurrency(product.finalPrice)}</span>
                  )
                ) : null}
              </span>
            </Link>
          ))
        )}
      </div>
    )
  }

  return (
    <nav className={`home-top-navbar ${isMobileNavOpen ? 'menu-open' : ''}`}>
      <div className="home-top-navbar-main">
        <button
          type="button"
          className="home-top-mobile-menu-btn"
          aria-label={isMobileNavOpen ? 'Cerrar menu' : 'Abrir menu'}
          aria-expanded={isMobileNavOpen}
          onClick={handleMobileMenuToggle}
        >
          <span />
          <span />
          <span />
        </button>

        <form className="home-top-search" onSubmit={handleSubmit}>
          <input
            type="search"
            name="name"
            value={draftSearchValue}
            onChange={(event) => {
              setDraftSearchValue(event.target.value)
              setIsSearchFocused(true)
            }}
            onFocus={() => setIsSearchFocused(true)}
            placeholder="Buscar"
            aria-label="Buscar productos"
          />
          <button type="submit" aria-label="Buscar">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="home-top-search-icon">
              <path
                d="M10.5 4a6.5 6.5 0 1 0 0 13a6.5 6.5 0 0 0 0-13Zm0 1.8a4.7 4.7 0 1 1 0 9.4a4.7 4.7 0 0 1 0-9.4Zm5.54 10.97l3.43 3.43a.9.9 0 1 1-1.27 1.27l-3.43-3.43a.9.9 0 0 1 1.27-1.27Z"
                fill="currentColor"
              />
            </svg>
          </button>
          {renderSearchSuggestions()}
        </form>

        <Link to="/" className="home-top-brand">DECO ECLAT</Link>

        <div className="home-top-actions" aria-label="Accesos rápidos">
          <Link
            to={adminAccount.path}
            className={`home-top-icon-link ${adminAccount.isLoggedIn ? 'logged-in' : ''}`}
            aria-label={adminAccount.isLoggedIn ? 'Cuenta admin conectada' : 'Iniciar sesion admin'}
            title={adminAccount.isLoggedIn ? 'Admin conectado' : 'Iniciar sesion admin'}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 12.3a4.15 4.15 0 1 1 0-8.3a4.15 4.15 0 0 1 0 8.3Zm0 1.8c-4.2 0-7.6 2.62-7.6 5.85c0 .5.4.9.9.9h13.4c.5 0 .9-.4.9-.9c0-3.23-3.4-5.85-7.6-5.85Zm0-1.8a2.35 2.35 0 1 0 0-4.7a2.35 2.35 0 0 0 0 4.7Zm0 3.6c3.05 0 5.5 1.7 5.77 3.15H6.23c.27-1.45 2.72-3.15 5.77-3.15Z"
                fill="currentColor"
              />
            </svg>
          </Link>

          <Link to="/carrito" className="home-top-icon-link" aria-label="Carrito">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M7 6.2c0-1.88 1.52-3.4 3.4-3.4h3.2C15.48 2.8 17 4.32 17 6.2V7h1.1c.5 0 .9.4.9.9v10.7c0 1.32-1.08 2.4-2.4 2.4H7.4A2.4 2.4 0 0 1 5 18.6V7.9c0-.5.4-.9.9-.9H7v-.8Zm1.8 0V7h6.4v-.8c0-.88-.72-1.6-1.6-1.6h-3.2c-.88 0-1.6.72-1.6 1.6Zm-2 2.6v9.8c0 .33.27.6.6.6h9.2c.33 0 .6-.27.6-.6V8.8H6.8Z"
                fill="currentColor"
              />
            </svg>
            {cartItemsCount > 0 ? (
              <span className="home-top-cart-badge" aria-label={`${cartItemsCount} producto(s) en el carrito`}>
                {cartItemsCount > 99 ? '99+' : cartItemsCount}
              </span>
            ) : null}
          </Link>
        </div>
      </div>

      {isMobileViewport && isMobileNavOpen ? (
        <button
          type="button"
          className="home-top-mobile-backdrop"
          aria-label="Cerrar menu"
          onClick={handleCloseMobileMenu}
        />
      ) : null}

      <div className="home-top-navbar-links">
        {isMobileViewport ? (
          <>
            <form className="home-top-search home-top-search-mobile" onSubmit={handleSubmit}>
              <input
                type="search"
                name="name-mobile"
                value={draftSearchValue}
                onChange={(event) => {
                  setDraftSearchValue(event.target.value)
                  setIsSearchFocused(true)
                }}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Buscar productos"
                aria-label="Buscar productos"
              />
              <button type="submit" aria-label="Buscar">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="home-top-search-icon">
                  <path
                    d="M10.5 4a6.5 6.5 0 1 0 0 13a6.5 6.5 0 0 0 0-13Zm0 1.8a4.7 4.7 0 1 1 0 9.4a4.7 4.7 0 0 1 0-9.4Zm5.54 10.97l3.43 3.43a.9.9 0 1 1-1.27 1.27l-3.43-3.43a.9.9 0 0 1 1.27-1.27Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
              {renderSearchSuggestions()}
            </form>

            {mobileMenuView === 'main' ? (
              <>
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) => `home-top-nav-link ${isActive ? 'active' : ''}`}
                  onClick={handleNavLinkClick}
                >
                  Inicio
                </NavLink>

                <NavLink
                  to="/carrito"
                  className={({ isActive }) => `home-top-nav-link home-top-mobile-cart-link ${isActive ? 'active' : ''}`}
                  onClick={handleNavLinkClick}
                >
                  <span>Carrito</span>
                  {cartItemsCount > 0 ? (
                    <span className="home-top-mobile-cart-badge" aria-label={`${cartItemsCount} producto(s) en el carrito`}>
                      {cartItemsCount > 99 ? '99+' : cartItemsCount}
                    </span>
                  ) : null}
                </NavLink>

                <button
                  type="button"
                  className="home-top-nav-link home-top-mobile-products-entry"
                  onClick={handleOpenMobileProducts}
                  aria-expanded={mobileMenuView === 'products'}
                >
                  <span>Productos</span>
                  <span className="home-top-mobile-arrow" aria-hidden="true">→</span>
                </button>

                <NavLink
                  to="/contacto"
                  className={({ isActive }) => `home-top-nav-link ${isActive ? 'active' : ''}`}
                  onClick={handleNavLinkClick}
                >
                  Personalizado
                </NavLink>
              </>
            ) : null}

            {mobileMenuView === 'products' ? (
              <div className="home-top-mobile-products-panel" role="menu" aria-label="Categorias de productos">
                <div className="home-top-mobile-products-header">
                  <button
                    type="button"
                    className="home-top-mobile-back-btn"
                    onClick={handleMobileBackToMain}
                    aria-label="Volver"
                  >
                    ←
                  </button>
                  <span>Productos</span>
                </div>

                <Link to="/catalogo" className="home-top-mobile-products-link home-top-mobile-products-link-all" onClick={handleCategoryClick}>
                  Ver todo
                </Link>

                {orderedCategoryTree.map((category) => (
                  category.children.length > 0 ? (
                    <button
                      key={category.id}
                      type="button"
                      className="home-top-mobile-products-link with-arrow"
                      onClick={() => handleOpenMobileSubcategories(category)}
                    >
                      <span>{category.name}</span>
                      <span className="home-top-mobile-arrow" aria-hidden="true">→</span>
                    </button>
                  ) : (
                    <Link
                      key={category.id}
                      to={`/categoria/${category.id}`}
                      className="home-top-mobile-products-link"
                      onClick={handleCategoryClick}
                    >
                      {category.name}
                    </Link>
                  )
                ))}
              </div>
            ) : null}

            {mobileMenuView === 'subcategory' && mobileActiveCategory ? (
              <div className="home-top-mobile-products-panel" role="menu" aria-label={`Subcategorias de ${mobileActiveCategory.name}`}>
                <div className="home-top-mobile-products-header">
                  <button
                    type="button"
                    className="home-top-mobile-back-btn"
                    onClick={handleMobileBackToProducts}
                    aria-label="Volver a productos"
                  >
                    ←
                  </button>
                  <span>{mobileActiveCategory.name}</span>
                </div>

                <Link
                  to={`/categoria/${mobileActiveCategory.id}`}
                  className="home-top-mobile-products-link home-top-mobile-products-link-all"
                  onClick={handleCategoryClick}
                >
                  Ver todo
                </Link>

                {mobileActiveCategory.children.map((child) => (
                  <Link
                    key={child.id}
                    to={`/categoria/${child.id}`}
                    className="home-top-mobile-products-link"
                    onClick={handleCategoryClick}
                  >
                    {child.name}
                  </Link>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <>
            <NavLink
              to="/"
              end
              className={({ isActive }) => `home-top-nav-link ${isActive ? 'active' : ''}`}
              onClick={handleNavLinkClick}
            >
              Inicio
            </NavLink>

            <div
              className="home-top-nav-item products"
              onMouseEnter={handleProductsMouseEnter}
              onMouseLeave={handleProductsMouseLeave}
              onBlur={handleProductsBlur}
            >
              <div className="home-top-products-trigger">
                <NavLink
                  to="/catalogo"
                  className={({ isActive }) => `home-top-nav-link ${isActive ? 'active' : ''}`}
                  onClick={handleNavLinkClick}
                >
                  Productos
                </NavLink>
                <button
                  type="button"
                  className="home-top-products-toggle"
                  aria-label="Ver categorias"
                  aria-expanded={isProductsMenuOpen}
                  onClick={handleMobileProductsToggle}
                >
                  ▾
                </button>
              </div>

              <div
                className={`home-top-products-menu ${isProductsMenuOpen ? 'open' : ''}`}
                style={{ '--desktop-products-columns': String(Math.max(orderedCategoryTree.length, 1)) }}
                role="menu"
                aria-label="Categorias de productos"
                onMouseEnter={handleProductsMouseEnter}
                onMouseLeave={handleProductsMouseLeave}
              >
                {orderedCategoryTree.map((category) => (
                  <div key={category.id} className="home-top-products-group">
                    <Link to={`/categoria/${category.id}`} className="home-top-products-parent" onClick={handleCategoryClick}>
                      {category.name}
                    </Link>
                    {category.children.length > 0 ? (
                      <div className="home-top-products-children">
                        {category.children.map((child) => (
                          <Link
                            key={child.id}
                            to={`/categoria/${child.id}`}
                            className="home-top-products-child"
                            onClick={handleCategoryClick}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <NavLink
              to="/contacto"
              className={({ isActive }) => `home-top-nav-link ${isActive ? 'active' : ''}`}
              onClick={handleNavLinkClick}
            >
              Personalizado
            </NavLink>
          </>
        )}
      </div>
    </nav>
  )
}
