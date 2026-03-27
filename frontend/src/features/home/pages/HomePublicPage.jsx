import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MainLayout } from '../../../layouts/layouts'
import HomePublicNavbar from '../../../shared/components/HomePublicNavbar'
import { useHomePublic } from '../hooks/useHomePublic'
import { useCarrito } from '../../carrito/hooks/useCarrito'

function buildBannerTarget(banner) {
  if (banner?.producto_id) return `/producto/${banner.producto_id}`
  if (banner?.categoria_id) return `/categoria/${banner.categoria_id}`
  return '/catalogo'
}

export function HomePublicPage() {
  const navigate = useNavigate()
  const { banners, featuredProducts, categories, loading, error } = useHomePublic()
  const { handleAddToCart, loading: addingToCart } = useCarrito()
  const [activeBannerIndex, setActiveBannerIndex] = useState(0)

  const safeActiveBannerIndex = useMemo(() => {
    if (banners.length === 0) return 0
    return Math.min(activeBannerIndex, banners.length - 1)
  }, [activeBannerIndex, banners.length])

  const activeBanner = banners[safeActiveBannerIndex] || null

  useEffect(() => {
    if (banners.length <= 1) return undefined

    const intervalId = window.setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % banners.length)
    }, 5000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [banners.length])

  useEffect(() => {
    if (activeBannerIndex < banners.length) return
    setActiveBannerIndex(0)
  }, [activeBannerIndex, banners.length])

  const handleNavbarSearch = (searchValue) => {
    const query = new URLSearchParams()
    if (searchValue?.trim()) {
      query.set('name', searchValue.trim())
    }
    navigate(`/catalogo${query.toString() ? `?${query.toString()}` : ''}`)
  }

  const handleQuickBuy = async (e, item) => {
    e.preventDefault()
    if (!item.variante_id) {
      alert('No hay variante disponible para este producto')
      return
    }
    try {
      await handleAddToCart(item.variante_id, 1)
      navigate('/carrito')
    } catch (err) {
      console.error('Error al agregar al carrito:', err)
    }
  }

  return (
    <MainLayout
      navbar={(
        <HomePublicNavbar
          categories={categories}
          searchValue=""
          onSearchSubmit={handleNavbarSearch}
        />
      )}
    >
      {error ? <p className="alert">{error}</p> : null}

      <section className="home-public-hero">
        <div className="home-public-banner-shell">
          {!loading && activeBanner ? (
            <Link className="home-public-banner" to={buildBannerTarget(activeBanner)}>
              <img
                src={activeBanner.imageUrl}
                alt={activeBanner.producto_nombre || activeBanner.categoria_nombre || 'Banner principal'}
              />
            </Link>
          ) : null}

          {!loading && !activeBanner ? <div className="home-public-banner empty" aria-hidden="true" /> : null}

          {banners.length > 1 ? (
            <div className="home-public-banner-dots" role="tablist" aria-label="Seleccionar banner">
              {banners.map((banner, index) => (
                <button
                  key={banner.carousel_id || index}
                  type="button"
                  className={`home-public-banner-dot ${index === safeActiveBannerIndex ? 'active' : ''}`}
                  onClick={() => setActiveBannerIndex(index)}
                  aria-label={`Banner ${index + 1}`}
                />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="home-public-featured">
        <div className="home-public-section-heading centered">
          <h2>Productos destacados</h2>
          <Link to="/catalogo" className="home-public-see-all">Ver todos</Link>
        </div>

        {featuredProducts.length === 0 ? (
          <p className="home-public-featured-empty">No hay productos destacados activos por ahora.</p>
        ) : (
          <div className="home-public-featured-grid">
            {featuredProducts.map((item) => (
              <article key={item.home_id} className="home-public-featured-card">
                <Link to={`/producto/${item.producto_id}`} className="home-public-featured-media">
                  {item.imagen_principal ? (
                    <img src={item.imagen_principal} alt={item.nombre} />
                  ) : (
                    <div className="home-public-featured-placeholder">Sin imagen</div>
                  )}
                </Link>
                <div className="home-public-featured-body">
                  <h3>{item.nombre}</h3>
                  <div className="home-public-featured-price">
                    {item.precio_oferta ? (
                      <>
                        <span className="original-price">${Number(item.precio).toFixed(2)}</span>
                        <span className="offer-price">${Number(item.precio_oferta).toFixed(2)}</span>
                      </>
                    ) : (
                      <span className="current-price">${Number(item.precio).toFixed(2)}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn home-public-featured-buy-btn"
                    onClick={(e) => handleQuickBuy(e, item)}
                    disabled={addingToCart}
                  >
                    {addingToCart ? 'Agregando...' : 'Comprar'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </MainLayout>
  )
}
