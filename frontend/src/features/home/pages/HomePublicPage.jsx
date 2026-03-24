import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MainLayout } from '../../../layouts/layouts'
import HomePublicNavbar from '../../../shared/components/HomePublicNavbar'
import { useHomePublic } from '../hooks/useHomePublic'

function buildBannerTarget(banner) {
  if (banner?.producto_id) return `/producto/${banner.producto_id}`
  if (banner?.categoria_id) return `/categoria/${banner.categoria_id}`
  return '/catalogo'
}

export function HomePublicPage() {
  const navigate = useNavigate()
  const { banners, featuredProducts, categories, loading, error } = useHomePublic()
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

      <section className="home-public-hero card">
        <div className="home-public-hero-copy">
          <p className="kicker">Decoeclat</p>
          <h1>Textiles y disenio para transformar tus espacios</h1>
          <p>
            Descubre nuevas colecciones, productos destacados y combina telas con estilos pensados
            para tu hogar.
          </p>
          <div className="actions">
            <Link to="/catalogo" className="btn home-public-link-btn">Ver catalogo</Link>
            <Link to="/carrito" className="btn ghost home-public-link-btn">Ir al carrito</Link>
          </div>
        </div>

        <div className="home-public-banner-shell">
          {loading ? <p>Cargando home...</p> : null}

          {!loading && activeBanner ? (
            <Link className="home-public-banner" to={buildBannerTarget(activeBanner)}>
              <img
                src={activeBanner.imageUrl}
                alt={activeBanner.producto_nombre || activeBanner.categoria_nombre || 'Banner principal'}
              />
            </Link>
          ) : null}

          {!loading && !activeBanner ? (
            <div className="home-public-banner empty">
              <p>No hay banners activos por el momento.</p>
            </div>
          ) : null}

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

      <section className="card home-public-featured">
        <div className="home-public-section-heading">
          <h2>Productos destacados</h2>
          <Link to="/catalogo" className="home-public-see-all">Ver todos</Link>
        </div>

        {featuredProducts.length === 0 ? (
          <p>No hay productos destacados activos por ahora.</p>
        ) : (
          <div className="home-public-featured-grid">
            {featuredProducts.map((item) => (
              <article key={item.home_id} className="home-public-featured-card">
                <Link to={`/producto/${item.producto_id}`} className="home-public-featured-media">
                  {item.imagenPrincipal ? (
                    <img src={item.imagenPrincipal} alt={item.nombre} />
                  ) : (
                    <div className="home-public-featured-placeholder">Sin imagen</div>
                  )}
                </Link>
                <div className="home-public-featured-body">
                  <h3>{item.nombre}</h3>
                  <p>{item.descripcion || 'Disenio seleccionado para destacar en esta temporada.'}</p>
                  <Link to={`/producto/${item.producto_id}`} className="btn home-public-link-btn">Ver detalle</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section id="contacto" className="card home-public-contact">
        <h2>Contacto</h2>
        <p>Escribenos para asesorarte sobre medidas, telas y combinaciones para tu espacio.</p>
        <div className="actions">
          <Link to="/carrito" className="btn home-public-link-btn">Continuar compra</Link>
          <Link to="/catalogo" className="btn ghost home-public-link-btn">Explorar productos</Link>
        </div>
      </section>
    </MainLayout>
  )
}
