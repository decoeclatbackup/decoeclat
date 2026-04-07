import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MainLayout } from '../../../layouts/layouts'
import HomePublicNavbar from '../../../shared/components/HomePublicNavbar'
import { useHomePublic } from '../hooks/useHomePublic'
import { useCarrito } from '../../carrito/hooks/useCarrito'
import { formatCurrency } from '../../../shared/utils/utils'

function buildBannerTarget(banner) {
  if (banner?.producto_id) return `/producto/${banner.producto_id}`
  if (banner?.categoria_id) return `/categoria/${banner.categoria_id}`
  return null
}

function FeaturedCard({ item, className = '', onQuickBuy, isAdding }) {
  const hasStock = Number(item?.stock ?? 0) > 0

  return (
    <article className={`home-public-featured-card ${className}`.trim()}>
      <Link
        to={`/producto/${item.producto_id}`}
        className={`home-public-featured-media ${item.imagen_secundaria ? 'has-secondary' : ''}`}
      >
        {item.imagen_principal ? (
          <div className="home-public-featured-media-stack">
            <img
              className="home-public-featured-media-image primary"
              src={item.imagen_principal}
              alt={item.nombre}
            />
            {item.imagen_secundaria ? (
              <img
                className="home-public-featured-media-image secondary"
                src={item.imagen_secundaria}
                alt={`${item.nombre} vista alternativa`}
              />
            ) : null}
          </div>
        ) : (
          <div className="home-public-featured-placeholder">Sin imagen</div>
        )}
      </Link>
      <div className="home-public-featured-body">
        <h3>{item.nombre}</h3>
        <div className="home-public-featured-footer">
          <div className="home-public-featured-price">
            {item.precio_oferta ? (
              <>
                <span className="original-price">{formatCurrency(item.precio)}</span>
                <span className="offer-price">{formatCurrency(item.precio_oferta)}</span>
              </>
            ) : (
              <span className="current-price">{formatCurrency(item.precio)}</span>
            )}
          </div>
          {hasStock ? (
            <button
              type="button"
              className="btn home-public-featured-buy-btn"
              onClick={(e) => onQuickBuy(e, item)}
              disabled={isAdding}
            >
              {isAdding ? 'Agregando...' : 'Comprar'}
            </button>
          ) : (
            <span className="home-public-featured-stock-label">Sin stock</span>
          )}
        </div>
      </div>
    </article>
  )
}

export function HomePublicPage() {
  const navigate = useNavigate()
  const { banners, featuredProducts, categories, loading, error } = useHomePublic()
  const { handleAddToCart } = useCarrito()
  const [addingProductId, setAddingProductId] = useState(null)
  const [activeBannerIndex, setActiveBannerIndex] = useState(0)
  const [isMobileFeatured, setIsMobileFeatured] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(max-width: 575px)').matches
  })
  const [featuredCarouselIndex, setFeaturedCarouselIndex] = useState(0)
  const bannerTouchStartXRef = useRef(null)
  const bannerTouchStartYRef = useRef(null)
  const preventBannerClickRef = useRef(false)

  const safeActiveBannerIndex = useMemo(() => {
    if (banners.length === 0) return 0
    return Math.min(activeBannerIndex, banners.length - 1)
  }, [activeBannerIndex, banners.length])

  const activeBanner = banners[safeActiveBannerIndex] || null
  const activeBannerTarget = buildBannerTarget(activeBanner)

  const handleBannerTouchStart = (event) => {
    const touch = event.touches?.[0]
    if (!touch) return
    bannerTouchStartXRef.current = touch.clientX
    bannerTouchStartYRef.current = touch.clientY
    preventBannerClickRef.current = false
  }

  const handleBannerTouchEnd = (event) => {
    if (banners.length <= 1) return

    const touch = event.changedTouches?.[0]
    const startX = bannerTouchStartXRef.current
    const startY = bannerTouchStartYRef.current

    bannerTouchStartXRef.current = null
    bannerTouchStartYRef.current = null

    if (!touch || startX == null || startY == null) return

    const deltaX = touch.clientX - startX
    const deltaY = touch.clientY - startY
    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)

    const SWIPE_THRESHOLD_PX = 40
    if (absDeltaX < SWIPE_THRESHOLD_PX || absDeltaX <= absDeltaY) return

    preventBannerClickRef.current = true

    setActiveBannerIndex((prev) => {
      if (deltaX > 0) {
        return (prev - 1 + banners.length) % banners.length
      }

      return (prev + 1) % banners.length
    })
  }

  const handleBannerClickCapture = (event) => {
    if (!preventBannerClickRef.current) return

    event.preventDefault()
    event.stopPropagation()
    preventBannerClickRef.current = false
  }

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

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const mediaQuery = window.matchMedia('(max-width: 575px)')
    const handleChange = (event) => {
      setIsMobileFeatured(event.matches)
    }

    setIsMobileFeatured(mediaQuery.matches)

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }

    mediaQuery.addListener(handleChange)
    return () => mediaQuery.removeListener(handleChange)
  }, [])

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
      setAddingProductId(item.producto_id)
      await handleAddToCart(item.variante_id, 1)
    } catch (err) {
      console.error('Error al agregar al carrito:', err)
    } finally {
      setAddingProductId(null)
    }
  }

  const featuredSlides = useMemo(() => {
    const slides = []
    for (let i = 0; i < featuredProducts.length; i += 2) {
      slides.push(featuredProducts.slice(i, i + 2))
    }
    return slides
  }, [featuredProducts])

  const isFeaturedCarousel = isMobileFeatured && featuredSlides.length > 0
  const canNavigateFeatured = featuredSlides.length > 1

  useEffect(() => {
    if (featuredSlides.length === 0 || !isMobileFeatured) {
      setFeaturedCarouselIndex(0)
      return
    }

    if (featuredCarouselIndex < featuredSlides.length) return
    setFeaturedCarouselIndex(featuredSlides.length - 1)
  }, [featuredCarouselIndex, featuredSlides.length, isMobileFeatured])

  const handleFeaturedPrev = () => {
    if (!canNavigateFeatured) return
    setFeaturedCarouselIndex((prev) => Math.max(prev - 1, 0))
  }

  const handleFeaturedNext = () => {
    if (!canNavigateFeatured) return
    setFeaturedCarouselIndex((prev) => Math.min(prev + 1, featuredSlides.length - 1))
  }

  return (
    <MainLayout
      title="Inicio | Textiles, fundas y deco"
      description="Descubri textiles, fundas y accesorios deco para cada ambiente. Compra online en DECOECLAT con envios a todo el pais."
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
        <div
          className="home-public-banner-shell"
          onTouchStart={handleBannerTouchStart}
          onTouchEnd={handleBannerTouchEnd}
        >
          {!loading && activeBanner ? (
            activeBannerTarget ? (
              <Link className="home-public-banner" to={activeBannerTarget} onClickCapture={handleBannerClickCapture}>
                <img
                  src={activeBanner.imageUrl}
                  alt={activeBanner.producto_nombre || activeBanner.categoria_nombre || 'Banner principal'}
                />
              </Link>
            ) : (
              <div className="home-public-banner" onClickCapture={handleBannerClickCapture}>
                <img
                  src={activeBanner.imageUrl}
                  alt={activeBanner.producto_nombre || activeBanner.categoria_nombre || 'Banner principal'}
                />
              </div>
            )
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
        ) : isFeaturedCarousel ? (
          <div className="home-public-featured-carousel" aria-label="Carrusel de productos destacados">
            <div className="home-public-featured-carousel-main">
              {!isMobileFeatured && canNavigateFeatured ? (
                <button
                  type="button"
                  className="home-public-featured-nav prev"
                  onClick={handleFeaturedPrev}
                  aria-label="Producto destacado anterior"
                >
                  ‹
                </button>
              ) : null}

              <div className="home-public-featured-viewport">
                <div
                  className="home-public-featured-track"
                  style={{ transform: `translateX(-${featuredCarouselIndex * 100}%)` }}
                >
                  {featuredSlides.map((slide, slideIndex) => (
                    <div key={`featured-slide-${slideIndex}`} className="home-public-featured-carousel-item">
                      <div className="home-public-featured-slide-grid">
                        {slide.map((item) => (
                          <FeaturedCard
                            key={item.home_id}
                            item={item}
                            className="is-carousel-item"
                            onQuickBuy={handleQuickBuy}
                            isAdding={addingProductId === item.producto_id}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {!isMobileFeatured && canNavigateFeatured ? (
                <button
                  type="button"
                  className="home-public-featured-nav next"
                  onClick={handleFeaturedNext}
                  aria-label="Siguiente producto destacado"
                >
                  ›
                </button>
              ) : null}

              {isMobileFeatured && canNavigateFeatured ? (
                <div className="home-public-featured-carousel-controls" aria-label="Navegar productos destacados">
                  <button
                    type="button"
                    className="home-public-featured-nav prev"
                    onClick={handleFeaturedPrev}
                    aria-label="Producto destacado anterior"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="home-public-featured-nav next"
                    onClick={handleFeaturedNext}
                    aria-label="Siguiente producto destacado"
                  >
                    ›
                  </button>
                </div>
              ) : null}
            </div>

            {!isMobileFeatured && canNavigateFeatured ? (
              <div className="home-public-featured-carousel-dots" role="tablist" aria-label="Seleccionar producto destacado">
                {featuredSlides.map((_, index) => (
                  <button
                    key={`featured-dot-${index}`}
                    type="button"
                    className={`home-public-featured-carousel-dot ${index === featuredCarouselIndex ? 'active' : ''}`}
                    onClick={() => setFeaturedCarouselIndex(index)}
                    aria-label={`Slide de productos ${index + 1}`}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="home-public-featured-grid">
            {featuredProducts.map((item) => (
              <FeaturedCard
                key={item.home_id}
                item={item}
                onQuickBuy={handleQuickBuy}
                isAdding={addingProductId === item.producto_id}
              />
            ))}
          </div>
        )}
      </section>

      <section className="home-public-values" aria-label="Valores de la marca">
        <div className="home-public-values-grid">
          <article className="home-public-value-card">
            <div className="home-public-value-icon" aria-hidden="true">
              <img src="/valores/maquina-costura.webp" alt="" loading="lazy" decoding="async" />
            </div>
            <h3>Calidad garantizada</h3>
            <p>
              Seleccionamos textiles y terminaciones que resisten el uso diario, para que cada producto te
              acompañe por mucho tiempo.
            </p>
          </article>

          <article className="home-public-value-card">
            <div className="home-public-value-icon" aria-hidden="true">
              <img src="/valores/manos-corazon.webp" alt="" loading="lazy" decoding="async" />
            </div>
            <h3>Transparencia</h3>
            <p>
              Trabajamos de forma cercana y clara en cada etapa, para que sepas que estas llevando y como fue
              hecho.
            </p>
          </article>

          <article className="home-public-value-card">
            <div className="home-public-value-icon" aria-hidden="true">
              <img src="/valores/corazon.webp" alt="" loading="lazy" decoding="async" />
            </div>
            <h3>Familia</h3>
            <p>
              Somos un proyecto familiar donde cada detalle se piensa con dedicacion, cercania y una mirada
              calida del hogar.
            </p>
          </article>
        </div>
      </section>
    </MainLayout>
  )
}
