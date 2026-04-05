import { useEffect, useMemo, useRef, useState } from 'react'
import { MainLayout } from '../../../layouts/layouts'
import AdminNavbar from '../../../shared/components/AdminNavbar'
import { useHomeAdmin } from '../hooks/useHomeAdmin'
import { homeAdminService } from '../services/homeAdminService'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

function resolveImageUrl(url) {
  if (!url) return null
  if (/^https?:\/\//i.test(url)) return url
  if (API_BASE_URL) return `${API_BASE_URL}${url}`
  if (url.startsWith('/uploads')) return `http://localhost:4000${url}`
  return url
}

export function HomeAdminPage() {
  const [bannerProductQuery, setBannerProductQuery] = useState('')
  const [isBannerProductOpen, setIsBannerProductOpen] = useState(false)
  const [featuredProductQuery, setFeaturedProductQuery] = useState('')
  const [isFeaturedProductOpen, setIsFeaturedProductOpen] = useState(false)
  const [bannerOrderDrafts, setBannerOrderDrafts] = useState({})
  const [featuredOrderDrafts, setFeaturedOrderDrafts] = useState({})
  const [openSections, setOpenSections] = useState({
    carouselForm: false,
    carouselDesktop: false,
    carouselMobile: false,
    featuredForm: false,
    featuredList: false,
  })
  const bannerProductSearchRef = useRef(null)
  const featuredProductSearchRef = useRef(null)
  const {
    banners,
    productosDestacados,
    productos,
    categorias,
    bannerForm,
    featuredForm,
    loading,
    saving,
    message,
    error,
    updateBannerForm,
    updateFeaturedForm,
    submitBanner,
    removeBanner,
    toggleBannerActivo,
    submitFeaturedProduct,
    removeFeaturedProduct,
    toggleFeaturedActivo,
    loadData,
  } = useHomeAdmin()

  const desktopBannerItems = useMemo(
    () => banners.filter((banner) => Boolean(banner.img_desktop_url)),
    [banners]
  )

  const mobileBannerItems = useMemo(
    () => banners.filter((banner) => Boolean(banner.img_mobile_url)),
    [banners]
  )

  const bannerProductSuggestions = useMemo(() => {
    const term = String(bannerProductQuery || '').trim().toLowerCase()
    if (term.length < 2) return []

    return productos
      .filter((producto) => String(producto.nombre || '').toLowerCase().includes(term))
      .slice(0, 6)
  }, [bannerProductQuery, productos])

  const featuredProductSuggestions = useMemo(() => {
    const term = String(featuredProductQuery || '').trim().toLowerCase()
    if (term.length < 2) return []

    return productos
      .filter((producto) => String(producto.nombre || '').toLowerCase().includes(term))
      .slice(0, 6)
  }, [featuredProductQuery, productos])

  useEffect(() => {
    function handlePointerDown(event) {
      const isInsideBannerSearch = bannerProductSearchRef.current?.contains(event.target)
      const isInsideFeaturedSearch = featuredProductSearchRef.current?.contains(event.target)

      if (!isInsideBannerSearch) {
        setIsBannerProductOpen(false)
      }

      if (!isInsideFeaturedSearch) {
        setIsFeaturedProductOpen(false)
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsBannerProductOpen(false)
        setIsFeaturedProductOpen(false)
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
    setBannerOrderDrafts((prev) => {
      const next = {}
      banners.forEach((banner) => {
        const key = String(banner.carousel_id)
        next[key] = prev[key] ?? ''
      })
      return next
    })
  }, [banners])

  useEffect(() => {
    setFeaturedOrderDrafts((prev) => {
      const next = {}
      productosDestacados.forEach((item) => {
        const key = String(item.home_id)
        next[key] = prev[key] ?? ''
      })
      return next
    })
  }, [productosDestacados])

  const bannerSelectedProduct = useMemo(
    () => productos.find((producto) => String(producto.producto_id) === String(bannerForm.productoId)),
    [bannerForm.productoId, productos]
  )

  const featuredSelectedProduct = useMemo(
    () => productos.find((producto) => String(producto.producto_id) === String(featuredForm.productoId)),
    [featuredForm.productoId, productos]
  )

  function handleBannerOrderDraftChange(carouselId, value) {
    if (!/^\d*$/.test(value)) return
    setBannerOrderDrafts((prev) => ({
      ...prev,
      [String(carouselId)]: value,
    }))
  }

  async function handleSaveBannerOrder(carouselId) {
    const rawValue = bannerOrderDrafts[String(carouselId)]
    const parsedOrder = Number(rawValue)
    if (!Number.isInteger(parsedOrder) || parsedOrder < 0) return

    try {
      await homeAdminService.updateBanner(carouselId, { orden: parsedOrder })
      setBannerOrderDrafts((prev) => ({
        ...prev,
        [String(carouselId)]: '',
      }))
      await loadData()
    } catch (err) {
      console.error(err)
    }
  }

  function handleFeaturedOrderDraftChange(homeId, value) {
    if (!/^\d*$/.test(value)) return
    setFeaturedOrderDrafts((prev) => ({
      ...prev,
      [String(homeId)]: value,
    }))
  }

  async function handleSaveFeaturedOrder(homeId) {
    const rawValue = featuredOrderDrafts[String(homeId)]
    const parsedOrder = Number(rawValue)
    if (!Number.isInteger(parsedOrder) || parsedOrder < 0) return

    try {
      await homeAdminService.updateFeaturedProduct(homeId, { orden: parsedOrder })
      setFeaturedOrderDrafts((prev) => ({
        ...prev,
        [String(homeId)]: '',
      }))
      await loadData()
    } catch (err) {
      console.error(err)
    }
  }

  function toggleSection(sectionKey) {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }))
  }

  return (
    <MainLayout navbar={<AdminNavbar />}>
      <section className="home-admin-page">
        <header className="home-admin-hero card">
          <div className="home-admin-hero-copy">
            <p className="kicker">Home Admin</p>
            <h1>Contenido destacado y banners</h1>
          </div>

          <div className="home-admin-hero-actions">
            <button type="button" className="btn ghost" onClick={loadData} disabled={loading || saving}>
              Actualizar home
            </button>
          </div>
        </header>

        {message ? <p className="alert home-admin-feedback">{message}</p> : null}
        {error ? <p className="alert home-admin-feedback">{error}</p> : null}

        <section className="card home-admin-section-card">
          <div className="home-admin-section-header">
            <div>
              <p className="kicker">Carousel</p>
              <h2>Banner principal</h2>
            </div>
            <button
              type="button"
              className="home-admin-section-toggle"
              onClick={() => toggleSection('carouselForm')}
              aria-expanded={openSections.carouselForm}
              aria-label={openSections.carouselForm ? 'Ocultar sección de banner principal' : 'Mostrar sección de banner principal'}
            >
              <span aria-hidden="true">{openSections.carouselForm ? '▾' : '▸'}</span>
            </button>
          </div>

        {openSections.carouselForm ? (
        <>
        <div className="grid two home-admin-grid">
          <label className="field">
            <span>Imagen desktop</span>
            <input
              className="home-admin-file-input"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => updateBannerForm('desktopFile', event.target.files?.[0] || null)}
            />
            <small>Recomendado 1920×600 px</small>
          </label>

          <label className="field">
            <span>Imagen mobile</span>
            <input
              className="home-admin-file-input"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => updateBannerForm('mobileFile', event.target.files?.[0] || null)}
            />
            <small>Recomendado 450x250 px</small>
          </label>

          <label className="field">
            <span>Orden</span>
            <input
              type="number"
              min="0"
              value={bannerForm.orden}
              onChange={(event) => updateBannerForm('orden', event.target.value)}
            />
          </label>

          <label className="field">
            <span>Producto vinculado (opcional)</span>
            <div className="home-admin-search-select" ref={bannerProductSearchRef}>
              <input
                type="search"
                value={bannerProductQuery}
                onChange={(event) => {
                  const nextValue = event.target.value
                  setBannerProductQuery(nextValue)
                  setIsBannerProductOpen(true)
                  if (!nextValue.trim()) {
                    updateBannerForm('productoId', '')
                  }
                }}
                onFocus={() => setIsBannerProductOpen(true)}
                placeholder="Buscar producto por nombre"
                autoComplete="off"
              />

              {isBannerProductOpen && bannerProductSuggestions.length > 0 ? (
                <div className="home-admin-search-suggestions" role="listbox" aria-label="Productos sugeridos">
                  {bannerProductSuggestions.map((producto) => (
                    <button
                      key={producto.producto_id}
                      type="button"
                      className="home-admin-search-suggestion"
                      onClick={() => {
                        updateBannerForm('productoId', producto.producto_id)
                        setBannerProductQuery(producto.nombre)
                        setIsBannerProductOpen(false)
                      }}
                    >
                      {resolveImageUrl(producto.imagen_principal) ? (
                        <img
                          src={resolveImageUrl(producto.imagen_principal)}
                          alt={producto.nombre}
                          className="home-admin-search-suggestion-image"
                        />
                      ) : (
                        <span className="home-admin-search-suggestion-image-fallback">Sin imagen</span>
                      )}
                      <span className="home-admin-search-suggestion-name">{producto.nombre}</span>
                    </button>
                  ))}
                </div>
              ) : null}

              {bannerSelectedProduct ? (
                <p className="home-admin-search-selected">
                  Seleccionado: <strong>{bannerSelectedProduct.nombre}</strong>
                </p>
              ) : null}
            </div>
          </label>

          <label className="field full-width">
            <span>Categoria vinculada (opcional)</span>
            <select
              value={bannerForm.categoriaId}
              onChange={(event) => updateBannerForm('categoriaId', event.target.value)}
            >
              <option value="">Sin categoria</option>
              {categorias.map((categoria) => (
                <option key={categoria.categoria_id} value={categoria.categoria_id}>
                  {categoria.nombre}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="actions">
          <button type="button" className="btn" onClick={submitBanner} disabled={saving}>
            Agregar banner
          </button>
        </div>
        </>
        ) : null}
        </section>

        <section className="card home-admin-section-card">
          <div className="home-admin-section-header">
            <div>
              <p className="kicker">Carousel cargado</p>
              <h2>Imagenes de desktop</h2>
            </div>
            <button
              type="button"
              className="home-admin-section-toggle"
              onClick={() => toggleSection('carouselDesktop')}
              aria-expanded={openSections.carouselDesktop}
              aria-label={openSections.carouselDesktop ? 'Ocultar imágenes de desktop' : 'Mostrar imágenes de desktop'}
            >
              <span aria-hidden="true">{openSections.carouselDesktop ? '▾' : '▸'}</span>
            </button>
          </div>

          {openSections.carouselDesktop ? (
          <>
          {desktopBannerItems.length === 0 ? <p className="home-admin-empty-state">No hay imágenes desktop cargadas.</p> : null}

          {desktopBannerItems.length > 0 ? (
            <div className="home-admin-media-grid">
              {desktopBannerItems.map((banner) => (
                <article key={`desktop-${banner.carousel_id}`} className="home-admin-media-card">
                  {resolveImageUrl(banner.img_desktop_url) ? (
                    <img
                      src={resolveImageUrl(banner.img_desktop_url)}
                      alt="Banner desktop"
                      className="home-admin-banner-image"
                    />
                  ) : (
                    <p className="home-admin-media-placeholder">Sin imagen desktop</p>
                  )}

                  <p className="home-admin-order-current">Orden actual: {Number(banner.orden || 0)}</p>
                  <div className="home-admin-order-inline">
                    <label htmlFor={`desktop-order-${banner.carousel_id}`}>Nuevo orden</label>
                    <div className="home-admin-order-inline-controls">
                      <input
                        id={`desktop-order-${banner.carousel_id}`}
                        type="number"
                        min="0"
                        value={bannerOrderDrafts[String(banner.carousel_id)] ?? ''}
                        onChange={(event) => handleBannerOrderDraftChange(banner.carousel_id, event.target.value)}
                      />
                      <button
                        type="button"
                        className="btn ghost tiny"
                        onClick={() => handleSaveBannerOrder(banner.carousel_id)}
                        disabled={
                          saving ||
                          bannerOrderDrafts[String(banner.carousel_id)] === '' ||
                          Number(bannerOrderDrafts[String(banner.carousel_id)]) < 0 ||
                          Number(bannerOrderDrafts[String(banner.carousel_id)]) === Number(banner.orden || 0)
                        }
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                  <p>Producto: {banner.producto_nombre || '-'}</p>
                  <p>Categoria: {banner.categoria_nombre || '-'}</p>

                  <div className="actions compact">
                    <button
                      type="button"
                      className={`btn tiny ${banner.activo ? 'success' : 'danger'}`}
                      onClick={() => toggleBannerActivo(banner)}
                      disabled={saving}
                    >
                      {banner.activo ? 'Activo' : 'Inactivo'}
                    </button>
                    <button
                      type="button"
                      className="btn danger tiny"
                      onClick={async () => {
                        await homeAdminService.removeBannerImage(banner.carousel_id, 'img_desktop_url')
                        await loadData()
                      }}
                      disabled={saving}
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
          </>
          ) : null}
        </section>

        <section className="card home-admin-section-card">
          <div className="home-admin-section-header">
            <div>
              <p className="kicker">Carousel cargado</p>
              <h2>Imagenes de mobile</h2>
            </div>
            <button
              type="button"
              className="home-admin-section-toggle"
              onClick={() => toggleSection('carouselMobile')}
              aria-expanded={openSections.carouselMobile}
              aria-label={openSections.carouselMobile ? 'Ocultar imágenes de mobile' : 'Mostrar imágenes de mobile'}
            >
              <span aria-hidden="true">{openSections.carouselMobile ? '▾' : '▸'}</span>
            </button>
          </div>

          {openSections.carouselMobile ? (
          <>
          {mobileBannerItems.length === 0 ? <p className="home-admin-empty-state">No hay imágenes mobile cargadas.</p> : null}

          {mobileBannerItems.length > 0 ? (
            <div className="home-admin-media-grid">
              {mobileBannerItems.map((banner) => (
                <article key={`mobile-${banner.carousel_id}`} className="home-admin-media-card">
                  {resolveImageUrl(banner.img_mobile_url) ? (
                    <img
                      src={resolveImageUrl(banner.img_mobile_url)}
                      alt="Banner mobile"
                      className="home-admin-banner-image"
                    />
                  ) : (
                    <p className="home-admin-media-placeholder">Sin imagen mobile</p>
                  )}

                  <p className="home-admin-order-current">Orden actual: {Number(banner.orden || 0)}</p>
                  <div className="home-admin-order-inline">
                    <label htmlFor={`mobile-order-${banner.carousel_id}`}>Nuevo orden</label>
                    <div className="home-admin-order-inline-controls">
                      <input
                        id={`mobile-order-${banner.carousel_id}`}
                        type="number"
                        min="0"
                        value={bannerOrderDrafts[String(banner.carousel_id)] ?? ''}
                        onChange={(event) => handleBannerOrderDraftChange(banner.carousel_id, event.target.value)}
                      />
                      <button
                        type="button"
                        className="btn ghost tiny"
                        onClick={() => handleSaveBannerOrder(banner.carousel_id)}
                        disabled={
                          saving ||
                          bannerOrderDrafts[String(banner.carousel_id)] === '' ||
                          Number(bannerOrderDrafts[String(banner.carousel_id)]) < 0 ||
                          Number(bannerOrderDrafts[String(banner.carousel_id)]) === Number(banner.orden || 0)
                        }
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                  <p>Producto: {banner.producto_nombre || '-'}</p>
                  <p>Categoria: {banner.categoria_nombre || '-'}</p>

                  <div className="actions compact">
                    <button
                      type="button"
                      className={`btn tiny ${banner.activo ? 'success' : 'danger'}`}
                      onClick={() => toggleBannerActivo(banner)}
                      disabled={saving}
                    >
                      {banner.activo ? 'Activo' : 'Inactivo'}
                    </button>
                    <button
                      type="button"
                      className="btn danger tiny"
                      onClick={async () => {
                        await homeAdminService.removeBannerImage(banner.carousel_id, 'img_mobile_url')
                        await loadData()
                      }}
                      disabled={saving}
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
          </>
          ) : null}
        </section>

        <section className="card home-admin-section-card">
          <div className="home-admin-section-header">
            <div>
              <p className="kicker">Destacados</p>
              <h2>Productos destacados</h2>
            </div>
            <button
              type="button"
              className="home-admin-section-toggle"
              onClick={() => toggleSection('featuredForm')}
              aria-expanded={openSections.featuredForm}
              aria-label={openSections.featuredForm ? 'Ocultar formulario de destacados' : 'Mostrar formulario de destacados'}
            >
              <span aria-hidden="true">{openSections.featuredForm ? '▾' : '▸'}</span>
            </button>
          </div>

          {openSections.featuredForm ? (
          <>
          <div className="grid two home-admin-grid">
            <label className="field">
              <span>Producto</span>
              <div className="home-admin-search-select" ref={featuredProductSearchRef}>
                <input
                  type="search"
                  value={featuredProductQuery}
                  onChange={(event) => {
                    const nextValue = event.target.value
                    setFeaturedProductQuery(nextValue)
                    setIsFeaturedProductOpen(true)
                    if (!nextValue.trim()) {
                      updateFeaturedForm('productoId', '')
                    }
                  }}
                  onFocus={() => setIsFeaturedProductOpen(true)}
                  placeholder="Buscar producto por nombre"
                  autoComplete="off"
                />

                {isFeaturedProductOpen && featuredProductSuggestions.length > 0 ? (
                  <div className="home-admin-search-suggestions" role="listbox" aria-label="Productos sugeridos para destacado">
                    {featuredProductSuggestions.map((producto) => (
                      <button
                        key={producto.producto_id}
                        type="button"
                        className="home-admin-search-suggestion"
                        onClick={() => {
                          updateFeaturedForm('productoId', producto.producto_id)
                          setFeaturedProductQuery(producto.nombre)
                          setIsFeaturedProductOpen(false)
                        }}
                      >
                        {resolveImageUrl(producto.imagen_principal) ? (
                          <img
                            src={resolveImageUrl(producto.imagen_principal)}
                            alt={producto.nombre}
                            className="home-admin-search-suggestion-image"
                          />
                        ) : (
                          <span className="home-admin-search-suggestion-image-fallback">Sin imagen</span>
                        )}
                        <span className="home-admin-search-suggestion-name">{producto.nombre}</span>
                      </button>
                    ))}
                  </div>
                ) : null}

                {featuredSelectedProduct ? (
                  <p className="home-admin-search-selected">
                    Seleccionado: <strong>{featuredSelectedProduct.nombre}</strong>
                  </p>
                ) : null}
              </div>
            </label>

            <label className="field">
              <span>Orden</span>
              <input
                type="number"
                min="0"
                value={featuredForm.orden}
                onChange={(event) => updateFeaturedForm('orden', event.target.value)}
              />
            </label>
          </div>

          <div className="actions">
            <button type="button" className="btn" onClick={submitFeaturedProduct} disabled={saving}>
              Agregar destacado
            </button>
          </div>
          </>
          ) : null}
        </section>

        <section className="card home-admin-section-card">
          <div className="home-admin-section-header">
            <div>
              <p className="kicker">Listado</p>
              <h2>Destacados cargados ({productosDestacados.length})</h2>
            </div>
            <button
              type="button"
              className="home-admin-section-toggle"
              onClick={() => toggleSection('featuredList')}
              aria-expanded={openSections.featuredList}
              aria-label={openSections.featuredList ? 'Ocultar listado de destacados' : 'Mostrar listado de destacados'}
            >
              <span aria-hidden="true">{openSections.featuredList ? '▾' : '▸'}</span>
            </button>
          </div>

          {openSections.featuredList ? (
          <>
          {productosDestacados.length === 0 ? <p className="home-admin-empty-state">No hay productos destacados cargados.</p> : null}

          {productosDestacados.length > 0 ? (
            <div className="home-admin-featured-grid">
              {productosDestacados.map((item) => (
                <article key={item.home_id} className="home-admin-featured-card">
                  {resolveImageUrl(item.imagen_principal) ? (
                    <img
                      src={resolveImageUrl(item.imagen_principal)}
                      alt={item.nombre}
                      className="home-admin-featured-thumb"
                    />
                  ) : (
                    <div className="home-admin-featured-thumb home-admin-featured-thumb-empty">Sin imagen</div>
                  )}
                  <h3>{item.nombre}</h3>
                  <p className="home-admin-order-current">Orden actual: {Number(item.orden || 0)}</p>
                  <div className="home-admin-order-inline">
                    <label htmlFor={`featured-order-${item.home_id}`}>Nuevo orden</label>
                    <div className="home-admin-order-inline-controls">
                      <input
                        id={`featured-order-${item.home_id}`}
                        type="number"
                        min="0"
                        value={featuredOrderDrafts[String(item.home_id)] ?? ''}
                        onChange={(event) => handleFeaturedOrderDraftChange(item.home_id, event.target.value)}
                      />
                      <button
                        type="button"
                        className="btn ghost tiny"
                        onClick={() => handleSaveFeaturedOrder(item.home_id)}
                        disabled={
                          saving ||
                          featuredOrderDrafts[String(item.home_id)] === '' ||
                          Number(featuredOrderDrafts[String(item.home_id)]) < 0 ||
                          Number(featuredOrderDrafts[String(item.home_id)]) === Number(item.orden || 0)
                        }
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                  <div className="actions compact">
                    <button
                      type="button"
                      className={`btn tiny ${item.activo ? 'success' : 'danger'}`}
                      onClick={() => toggleFeaturedActivo(item)}
                      disabled={saving}
                    >
                      {item.activo ? 'Activo' : 'Inactivo'}
                    </button>
                    <button
                      type="button"
                      className="btn danger tiny"
                      onClick={() => removeFeaturedProduct(item.home_id)}
                      disabled={saving}
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
          </>
          ) : null}
        </section>
      </section>
    </MainLayout>
  )
}
