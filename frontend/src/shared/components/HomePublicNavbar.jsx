import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { homePublicService } from '../../features/home/services/homePublicService'

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
  const [isProductsMenuOpen, setIsProductsMenuOpen] = useState(false)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(max-width: 900px)').matches
  })
  const closeTimerRef = useRef(null)

  useEffect(() => {
    setDraftSearchValue(searchValue || '')
  }, [searchValue])

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

  const categoryTree = useMemo(() => buildCategoryTree(internalCategories), [internalCategories])

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
  }

  function handleNavLinkClick() {
    if (!isMobileViewport) return
    setIsProductsMenuOpen(false)
    setIsMobileNavOpen(false)
  }

  function handleMobileMenuToggle() {
    if (!isMobileViewport) return
    setIsMobileNavOpen((prev) => {
      const nextValue = !prev
      if (!nextValue) {
        setIsProductsMenuOpen(false)
      }
      return nextValue
    })
  }

  function handleSubmit(event) {
    event.preventDefault()
    onSearchSubmit?.(draftSearchValue)
    if (isMobileViewport) {
      setIsMobileNavOpen(false)
      setIsProductsMenuOpen(false)
    }
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
            onChange={(event) => setDraftSearchValue(event.target.value)}
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
        </form>

        <Link to="/" className="home-top-brand">DECO ECLAT</Link>

        <div className="home-top-actions" aria-label="Accesos rápidos">
          <Link to="/catalogo" className="home-top-icon-link" aria-label="Cuenta">
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
          </Link>
        </div>
      </div>

      <div className="home-top-navbar-links">
        <form className="home-top-search home-top-search-mobile" onSubmit={handleSubmit}>
          <input
            type="search"
            name="name-mobile"
            value={draftSearchValue}
            onChange={(event) => setDraftSearchValue(event.target.value)}
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
        </form>

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

          {categoryTree.length > 0 ? (
            <div
              className={`home-top-products-menu ${isProductsMenuOpen ? 'open' : ''}`}
              role="menu"
              aria-label="Categorias de productos"
              onMouseEnter={handleProductsMouseEnter}
              onMouseLeave={handleProductsMouseLeave}
            >
              {categoryTree.map((category) => (
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
          ) : null}
        </div>

        <Link to="/#contacto" className="home-top-nav-link" onClick={handleNavLinkClick}>Contacto</Link>
      </div>
    </nav>
  )
}
