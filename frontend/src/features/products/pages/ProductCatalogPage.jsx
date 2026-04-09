import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { MainLayout } from '../../../layouts/layouts'
import { CatalogProductGrid, CatalogSidebar } from '../components/components'
import { useProductCatalog } from '../hooks/useProductCatalog'
import HomePublicNavbar from '../../../shared/components/HomePublicNavbar'
import { SEO } from '../../../shared/components/SEO'

const PRODUCT_COLOR_HEX = {
  Beige: '#d8c3a5',
  Arena: '#c2b280',
  Avellana: '#8b6f47',
  Khaki: '#bdb76b',
  Blanco: '#f7f7f2',
  Negro: '#1f1f1f',
  'Gris Perla': '#d9d9d9',
  'Gris Aero': '#9aa8b0',
  'Gris Acero': '#6e7b82',
  Verde: '#6b8f71',
  Rosa: '#d89ca4',
  Canela: '#8b5a3c',
  Amarillo: '#e7c84b',
  Chocolate: '#5a3a29',
}

const PRODUCTS_BATCH_SIZE = 12
const CATALOG_VIEW_STATE_KEY = 'decoeclat:catalog-view-state'
const CATALOG_VIEW_STATE_MAX_AGE_MS = 30 * 60 * 1000

function normalizePathname(pathname) {
  const value = String(pathname || '').trim()
  if (!value) return '/'
  if (value.length === 1) return value
  return value.replace(/\/+$/, '')
}

function toList(value) {
  if (Array.isArray(value)) return value.map(String)
  if (value == null || value === '') return []
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function buildMobileDraftFilters(sourceFilters) {
  return {
    ...sourceFilters,
    sizeId: toList(sourceFilters?.sizeId),
    telaId: toList(sourceFilters?.telaId),
    color: toList(sourceFilters?.color),
  }
}

export function ProductCatalogPage() {
  const location = useLocation()
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_BATCH_SIZE)
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)
  const [isMobileFiltersSheetOpen, setIsMobileFiltersSheetOpen] = useState(false)
  const [mobileFiltersSheetMode, setMobileFiltersSheetMode] = useState('filters')
  const [pendingRestoreScrollY, setPendingRestoreScrollY] = useState(null)
  const [pendingRestoreProductId, setPendingRestoreProductId] = useState(null)
  const skipNextProductsResetRef = useRef(false)

  const {
    products,
    categories,
    sizes,
    telas,
    productColors,
    isFundasCategory,
    currentCategory,
    filters,
    setFilters,
    loading,
    message,
    handleFilterChange,
    handleNavbarSearch,
    handleClearFilters,
    sortOrder,
    setSortOrder,
  } = useProductCatalog()

  const [mobileDraftFilters, setMobileDraftFilters] = useState(() => buildMobileDraftFilters(filters))
  const [mobileDraftSortOrder, setMobileDraftSortOrder] = useState(sortOrder)

  const activeFilters = useMemo(() => {
    const chips = []

    const selectedSizeIds = Array.isArray(filters.sizeId)
      ? filters.sizeId
      : String(filters.sizeId || '')
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)

    const selectedTelaIds = Array.isArray(filters.telaId)
      ? filters.telaId
      : String(filters.telaId || '')
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)

    const selectedColors = Array.isArray(filters.color)
      ? filters.color
      : String(filters.color || '')
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)

    if (filters.name) {
      chips.push({
        key: 'name',
        label: `Busqueda: ${filters.name}`,
        removable: true,
        clear: () => setFilters((prev) => ({ ...prev, name: '' })),
      })
    }

    if (selectedSizeIds.length > 0 && isFundasCategory) {
      selectedSizeIds.forEach((sizeId) => {
        const selectedSize = sizes.find((size) => String(size.size_id) === String(sizeId))
        chips.push({
          key: `sizeId-${sizeId}`,
          label: `Medida: ${selectedSize?.valor || sizeId}`,
          removable: true,
          clear: () => {
            const nextValues = selectedSizeIds.filter((currentValue) => String(currentValue) !== String(sizeId))
            setFilters((prev) => ({
              ...prev,
              sizeId: nextValues,
            }))
          },
        })
      })
    }

    if (selectedTelaIds.length > 0) {
      selectedTelaIds.forEach((telaId) => {
        const selectedTela = telas.find((tela) => String(tela.tela_id) === String(telaId))
        chips.push({
          key: `telaId-${telaId}`,
          label: `Diseño: ${selectedTela?.nombre || telaId}`,
          removable: true,
          clear: () => {
            const nextValues = selectedTelaIds.filter((currentValue) => String(currentValue) !== String(telaId))
            setFilters((prev) => ({
              ...prev,
              telaId: nextValues,
            }))
          },
        })
      })
    }

    if (selectedColors.length > 0) {
      selectedColors.forEach((colorName) => {
        chips.push({
          key: `color-${colorName}`,
          label: `Color: ${colorName}`,
          removable: true,
          clear: () => {
            const nextValues = selectedColors.filter((currentValue) => String(currentValue) !== String(colorName))
            setFilters((prev) => ({
              ...prev,
              color: nextValues,
            }))
          },
        })
      })
    }

    return chips
  }, [currentCategory?.nombre, filters.name, filters.sizeId, filters.telaId, filters.color, isFundasCategory, sizes, telas, setFilters])

  const hasActiveFilters = activeFilters.length > 0

  const visibleProducts = useMemo(
    () => products.slice(0, visibleCount),
    [products, visibleCount]
  )

  const hasMoreProducts = products.length > visibleCount

  useEffect(() => {
    if (!isMobileFiltersSheetOpen) return

    setMobileDraftFilters(buildMobileDraftFilters(filters))
    setMobileDraftSortOrder(sortOrder)
  }, [filters, isMobileFiltersSheetOpen, sortOrder])

  useEffect(() => {
    if (skipNextProductsResetRef.current) {
      skipNextProductsResetRef.current = false
      return
    }

    setVisibleCount(PRODUCTS_BATCH_SIZE)
  }, [products])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const previousMode = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'

    return () => {
      window.history.scrollRestoration = previousMode
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    let parsed = null
    try {
      const raw = sessionStorage.getItem(CATALOG_VIEW_STATE_KEY)
      parsed = raw ? JSON.parse(raw) : null
    } catch {
      parsed = null
    }

    const currentPath = `${normalizePathname(location.pathname)}${location.search}`
    const parsedPath = `${normalizePathname(parsed?.pathname)}${parsed?.search || ''}`
    const savedAt = Number(parsed?.savedAt || 0)
    const isExpired = !Number.isFinite(savedAt) || (Date.now() - savedAt) > CATALOG_VIEW_STATE_MAX_AGE_MS

    if (!parsed || parsedPath !== currentPath || isExpired) {
      sessionStorage.removeItem(CATALOG_VIEW_STATE_KEY)
      return
    }

    const savedVisibleCount = Number(parsed.visibleCount)
    const savedScrollY = Number(parsed.scrollY)
    const savedProductId = Number(parsed.productId)

    if (Number.isFinite(savedVisibleCount) && savedVisibleCount > PRODUCTS_BATCH_SIZE) {
      skipNextProductsResetRef.current = true
      setVisibleCount(savedVisibleCount)
    }

    if (Number.isFinite(savedScrollY) && savedScrollY >= 0) {
      setPendingRestoreScrollY(savedScrollY)
    }

    if (Number.isFinite(savedProductId) && savedProductId > 0) {
      setPendingRestoreProductId(savedProductId)
    }
  }, [location.pathname, location.search])

  useEffect(() => {
    if (pendingRestoreScrollY == null || loading) return

    let cancelled = false
    let rafId = null
    let attempts = 0
    const maxAttempts = 20

    const restoreScroll = () => {
      if (cancelled) return

      const maxScrollTop = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
      const targetTop = Math.min(pendingRestoreScrollY, maxScrollTop)

      window.scrollTo({ top: targetTop, left: 0, behavior: 'auto' })

      const isCloseEnough = Math.abs(window.scrollY - targetTop) <= 2
      if (isCloseEnough || attempts >= maxAttempts) {
        if (!isCloseEnough && pendingRestoreProductId) {
          const anchor = document.querySelector(`[data-catalog-product-id="${pendingRestoreProductId}"]`)
          if (anchor && typeof anchor.scrollIntoView === 'function') {
            anchor.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' })
          }
        }

        sessionStorage.removeItem(CATALOG_VIEW_STATE_KEY)
        setPendingRestoreScrollY(null)
        setPendingRestoreProductId(null)
        return
      }

      attempts += 1
      rafId = window.requestAnimationFrame(restoreScroll)
    }

    rafId = window.requestAnimationFrame(restoreScroll)

    return () => {
      cancelled = true
      if (rafId != null) {
        window.cancelAnimationFrame(rafId)
      }
    }
  }, [loading, pendingRestoreProductId, pendingRestoreScrollY, visibleCount, products.length])

  useEffect(() => {
    if (!isMobileFiltersSheetOpen) return undefined

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsMobileFiltersSheetOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)

    return () => document.removeEventListener('keydown', handleEscape)
  }, [isMobileFiltersSheetOpen])

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + PRODUCTS_BATCH_SIZE)
  }

  function openMobileFiltersSheet(mode) {
    setMobileFiltersSheetMode(mode)
    setIsMobileFiltersSheetOpen(true)
  }

  function closeMobileFiltersSheet() {
    setIsMobileFiltersSheetOpen(false)
  }

  function toggleMobileDraftListValue(name, value) {
    setMobileDraftFilters((prev) => {
      const currentValues = toList(prev?.[name])
      const nextValues = value === ''
        ? []
        : currentValues.includes(String(value))
          ? currentValues.filter((currentValue) => currentValue !== String(value))
          : [...currentValues, String(value)]

      return {
        ...prev,
        [name]: nextValues,
      }
    })
  }

  function applyMobileFilters() {
    setFilters(mobileDraftFilters)
    setSortOrder(mobileDraftSortOrder)
    closeMobileFiltersSheet()
  }

  function handleProductNavigate(productId) {
    if (typeof window === 'undefined') return

    const viewState = {
      pathname: normalizePathname(location.pathname),
      search: location.search,
      visibleCount,
      scrollY: window.scrollY,
      productId: Number(productId) || null,
      savedAt: Date.now(),
    }

    sessionStorage.setItem(CATALOG_VIEW_STATE_KEY, JSON.stringify(viewState))
  }

  const mobileSelectedSizeIds = toList(mobileDraftFilters.sizeId)
  const mobileSelectedTelaIds = toList(mobileDraftFilters.telaId)
  const mobileSelectedColors = toList(mobileDraftFilters.color)

  return (
    <>
      <SEO
        title={currentCategory ? `Catálogo de ${currentCategory.nombre} en DECOECLAT` : 'Catálogo de productos para el hogar en DECOECLAT'}
        description={currentCategory
          ? `Explorá ${currentCategory.nombre} en DECOECLAT: textiles, diseños y medidas para decorar tu hogar.`
          : 'Explorá el catálogo de DECOECLAT con textiles, fundas y deco por categoría, diseño o medida.'}
        keywords="catalogo de productos, textiles, fundas, deco para el hogar, decoración"
        image="/d.jpg"
      />
      <MainLayout
        seoDisabled
        navbar={(
          <HomePublicNavbar
            categories={categories}
            searchValue={filters.name}
            onSearchSubmit={handleNavbarSearch}
          />
        )}
      >
        {message ? <p className="alert">{message}</p> : null}

        <section className="catalog-layout">
          <section className="catalog-results">
            {currentCategory?.nombre ? (
              <div className="catalog-selected-category">
                <strong className="catalog-selected-category-name">{currentCategory.nombre}</strong>
              </div>
            ) : null}

            <div className="catalog-results-toolbar catalog-results-toolbar-top">
              <div className="catalog-mobile-toolbar">
                <button
                  type="button"
                  className="catalog-mobile-toolbar-btn"
                  onClick={() => openMobileFiltersSheet('filters')}
                >
                  <span>FILTROS</span>
                  <span className="catalog-mobile-toolbar-icon" aria-hidden="true">⇅</span>
                </button>

                <button
                  type="button"
                  className="catalog-mobile-toolbar-btn"
                  onClick={() => openMobileFiltersSheet('sort')}
                >
                  <span>ORDENAR</span>
                  <svg viewBox="0 0 20 20" className="catalog-mobile-toolbar-chevron" aria-hidden="true" focusable="false">
                    <path d="M5 7.5L10 12.5L15 7.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              <div className="catalog-desktop-toolbar-controls">
                <CatalogSidebar
                  filters={filters}
                  sizes={sizes}
                  telas={telas}
                  colors={productColors}
                  isFundasCategory={isFundasCategory}
                  isMobileFiltersOpen={isMobileFiltersOpen}
                  onToggleMobileFilters={() => setIsMobileFiltersOpen((current) => !current)}
                  onCloseMobileFilters={() => setIsMobileFiltersOpen(false)}
                  onFilterChange={handleFilterChange}
                />

                <label className="catalog-sort-control">
                  <span className="catalog-sort-control-label">
                    <span className="catalog-sort-control-icon" aria-hidden="true">⇅</span>
                    <select
                      className="catalog-sort-control-select"
                      value={sortOrder}
                      onChange={(event) => setSortOrder(event.target.value)}
                    >
                      <option value="none">ORDENAR</option>
                      <option value="price-asc">Menor a mayor</option>
                      <option value="price-desc">Mayor a menor</option>
                    </select>
                    <svg viewBox="0 0 20 20" className="catalog-sort-control-chevron" aria-hidden="true" focusable="false">
                      <path d="M5 7.5L10 12.5L15 7.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </label>
              </div>
            </div>

            {isMobileFiltersSheetOpen ? (
              <div
                className="catalog-mobile-filters-backdrop"
                role="presentation"
                onClick={closeMobileFiltersSheet}
              >
                <div
                  className="catalog-mobile-filters-sheet"
                  role="dialog"
                  aria-modal="true"
                  aria-label={mobileFiltersSheetMode === 'sort' ? 'Ordenar productos' : 'Filtros de productos'}
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="catalog-mobile-filters-header">
                    <div>
                      <p className="catalog-mobile-filters-kicker">
                        {mobileFiltersSheetMode === 'sort' ? 'Ordenar' : 'Filtros'}
                      </p>
                      <h3>{mobileFiltersSheetMode === 'sort' ? 'Elegí cómo ordenar' : 'Elegí tus filtros'}</h3>
                    </div>

                    <button
                      type="button"
                      className="catalog-mobile-filters-close"
                      onClick={closeMobileFiltersSheet}
                      aria-label="Cerrar"
                    >
                      ×
                    </button>
                  </div>

                  <div className={`catalog-mobile-filters-body ${mobileFiltersSheetMode === 'sort' ? 'sort-first' : ''}`}>
                    <div className="catalog-mobile-filters-section catalog-mobile-filters-sort-section">
                      <label className="catalog-mobile-filters-label" htmlFor="mobile-sort-order">
                        Ordenar por
                      </label>
                      <select
                        id="mobile-sort-order"
                        className="catalog-mobile-filters-select"
                        value={mobileDraftSortOrder}
                        onChange={(event) => setMobileDraftSortOrder(event.target.value)}
                      >
                        <option value="none">Ordenar por</option>
                        <option value="price-asc">Menor a mayor</option>
                        <option value="price-desc">Mayor a menor</option>
                      </select>
                    </div>

                    {isFundasCategory ? (
                      <details className="catalog-mobile-filters-tab" open>
                        <summary className="catalog-mobile-filters-tab-trigger">
                          <span>Medidas</span>
                          <span aria-hidden="true">▾</span>
                        </summary>
                        <div className="catalog-mobile-filters-buttons">
                          <button
                            type="button"
                            className={`catalog-filter-btn ${mobileSelectedSizeIds.length === 0 ? 'active' : ''}`}
                            onClick={() => setMobileDraftFilters((prev) => ({ ...prev, sizeId: [] }))}
                          >
                            Todos
                          </button>
                          {sizes.map((size) => (
                            <button
                              key={size.size_id}
                              type="button"
                              className={`catalog-filter-btn ${mobileSelectedSizeIds.includes(String(size.size_id)) ? 'active' : ''}`}
                              onClick={() => toggleMobileDraftListValue('sizeId', String(size.size_id))}
                            >
                              {size.valor}
                            </button>
                          ))}
                        </div>
                      </details>
                    ) : null}

                    <details className="catalog-mobile-filters-tab" open>
                      <summary className="catalog-mobile-filters-tab-trigger">
                        <span>Diseño</span>
                        <span aria-hidden="true">▾</span>
                      </summary>
                      <div className="catalog-mobile-filters-buttons">
                        <button
                          type="button"
                          className={`catalog-filter-btn ${mobileSelectedTelaIds.length === 0 ? 'active' : ''}`}
                          onClick={() => setMobileDraftFilters((prev) => ({ ...prev, telaId: [] }))}
                        >
                          Todas
                        </button>
                        {telas.map((tela) => (
                          <button
                            key={tela.tela_id}
                            type="button"
                            className={`catalog-filter-btn ${mobileSelectedTelaIds.includes(String(tela.tela_id)) ? 'active' : ''}`}
                            onClick={() => toggleMobileDraftListValue('telaId', String(tela.tela_id))}
                          >
                            {tela.nombre}
                          </button>
                        ))}
                      </div>
                    </details>

                    <details className="catalog-mobile-filters-tab" open>
                      <summary className="catalog-mobile-filters-tab-trigger">
                        <span>Color</span>
                        <span aria-hidden="true">▾</span>
                      </summary>
                      <div className="catalog-mobile-filters-buttons catalog-filter-buttons-color">
                        <button
                          type="button"
                          className={`catalog-filter-btn catalog-filter-btn-color-all ${mobileSelectedColors.length === 0 ? 'active' : ''}`}
                          onClick={() => setMobileDraftFilters((prev) => ({ ...prev, color: [] }))}
                        >
                          Todos
                        </button>
                        {productColors.map((colorName) => (
                          <button
                            key={colorName}
                            type="button"
                            className={`catalog-filter-btn catalog-filter-btn-color ${mobileSelectedColors.includes(String(colorName)) ? 'active' : ''}`}
                            onClick={() => toggleMobileDraftListValue('color', String(colorName))}
                          >
                            <span
                              className="catalog-color-swatch"
                              style={{ backgroundColor: PRODUCT_COLOR_HEX[colorName] || '#cccccc' }}
                              aria-hidden="true"
                            />
                            <span>{colorName}</span>
                          </button>
                        ))}
                      </div>
                    </details>
                  </div>

                  <div className="catalog-mobile-filters-footer">
                    <button type="button" className="btn catalog-mobile-filters-apply" onClick={applyMobileFilters}>
                      Aplicar filtros
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {hasActiveFilters ? (
              <div className="catalog-active-filters">
                <div className="catalog-active-filters-chips">
                  {activeFilters.map((filter) => (
                    <button
                      key={filter.key}
                      type="button"
                      className="catalog-active-filter-chip"
                      onClick={filter.removable ? filter.clear : undefined}
                      disabled={!filter.removable}
                      aria-label={filter.removable ? `Quitar ${filter.label}` : filter.label}
                    >
                      <span className="catalog-active-filter-chip-label">{filter.label}</span>
                      {filter.removable ? (
                        <span className="catalog-active-filter-chip-close" aria-hidden="true">×</span>
                      ) : null}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="catalog-active-filters-clear"
                  onClick={handleClearFilters}
                >
                  <span>BORRAR TODO</span>
                  <span className="catalog-active-filters-clear-icon" aria-hidden="true">⊗</span>
                </button>
              </div>
            ) : null}

            <CatalogProductGrid
              products={visibleProducts}
              loading={loading}
              onProductNavigate={handleProductNavigate}
            />

            {!loading && hasMoreProducts ? (
              <div className="catalog-load-more">
                <button
                  type="button"
                  className="btn"
                  onClick={handleLoadMore}
                >
                  Cargar mas
                </button>
              </div>
            ) : null}
          </section>
        </section>
      </MainLayout>
    </>
  )
}
