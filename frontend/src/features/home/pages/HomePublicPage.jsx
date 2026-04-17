import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MainLayout } from '../../../layouts/layouts'
import HomePublicNavbar from '../../../shared/components/HomePublicNavbar'
import { SEO } from '../../../shared/components/SEO'
import { useHomePublic } from '../hooks/useHomePublic'
import { useCarrito } from '../../carrito/hooks/useCarrito'
import { formatCurrency } from '../../../shared/utils/utils'
import { buildCloudinarySrcSet, optimizeCloudinaryImageUrl } from '../../../shared/utils/cloudinary'

const FALLBACK_BANNER_IMAGE = '/deco1.PNG'
const FEATURED_SKELETON_ITEMS = [1, 2, 3, 4]

function buildBannerTarget(banner) {
  if (banner?.producto_id) return `/producto/${banner.producto_id}`
  if (banner?.categoria_id) return `/categoria/${banner.categoria_id}`
  return null
}

function FeaturedCard({ item, className = '', onQuickBuy, isAdding, onNavigate }) {
  const [isTouchPreviewActive, setIsTouchPreviewActive] = useState(false)
  const hasStock = Number(item?.stock ?? 0) > 0
  const basePrice = Number(item?.precio ?? 0)
  const offerPrice = Number(item?.precio_oferta ?? 0)
  const hasOffer = offerPrice > 0 && basePrice > offerPrice
  const discountPercentage = hasOffer
    ? Math.round(((basePrice - offerPrice) / basePrice) * 100)
    : 0
  const offerBadgeLevelClass = discountPercentage > 30
    ? 'is-high'
    : discountPercentage > 15
      ? 'is-medium'
      : 'is-low'

  const handleCardNavigate = () => {
    if (!onNavigate) return
    onNavigate(item.producto_id)
  }

  const handleCardKeyDown = (event) => {
    if (!onNavigate) return
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onNavigate(item.producto_id)
  }

  return (
    <article
      className={`home-public-featured-card ${hasOffer ? 'has-offer' : ''} ${onNavigate ? 'is-clickable' : ''} ${className}`.trim()}
      role={onNavigate ? 'link' : undefined}
      tabIndex={onNavigate ? 0 : undefined}
      onClick={onNavigate ? handleCardNavigate : undefined}
      onKeyDown={onNavigate ? handleCardKeyDown : undefined}
    >
      <div
        className={`home-public-featured-media ${item.imagen_secundaria ? 'has-secondary' : ''} ${isTouchPreviewActive ? 'is-touch-preview' : ''}`.trim()}
        onTouchStart={item.imagen_secundaria ? () => setIsTouchPreviewActive(true) : undefined}
        onTouchEnd={item.imagen_secundaria ? () => setIsTouchPreviewActive(false) : undefined}
        onTouchCancel={item.imagen_secundaria ? () => setIsTouchPreviewActive(false) : undefined}
      >
        {hasOffer ? (
          <span className={`product-offer-badge ${offerBadgeLevelClass}`}>
            PROMO{discountPercentage > 0 ? ` -${discountPercentage}%` : ''}
          </span>
        ) : null}

        {item.imagen_principal ? (
          <div className="home-public-featured-media-stack">
            <img
              className="home-public-featured-media-image primary"
              src={optimizeCloudinaryImageUrl(item.imagen_principal, { width: 420 })}
              srcSet={buildCloudinarySrcSet(item.imagen_principal, [240, 320, 420], { quality: 'auto', format: 'auto' }) || undefined}
              sizes="(max-width: 575px) 46vw, 260px"
              alt={item.nombre}
              loading="lazy"
              decoding="async"
            />
            {item.imagen_secundaria ? (
              <img
                className="home-public-featured-media-image secondary"
                src={optimizeCloudinaryImageUrl(item.imagen_secundaria, { width: 420 })}
                srcSet={buildCloudinarySrcSet(item.imagen_secundaria, [240, 320, 420], { quality: 'auto', format: 'auto' }) || undefined}
                sizes="(max-width: 575px) 46vw, 260px"
                alt={`${item.nombre} vista alternativa`}
                loading="lazy"
                decoding="async"
              />
            ) : null}
          </div>
        ) : (
          <div className="home-public-featured-placeholder">Sin imagen</div>
        )}
      </div>
      <div className="home-public-featured-body">
        <h3>{item.nombre}</h3>
        <div className="home-public-featured-footer">
          <div className={`home-public-featured-price ${hasOffer ? 'has-offer' : ''}`}>
            {hasOffer ? (
              <>
                <span className="original-price">{formatCurrency(item.precio)}</span>
                <span className="offer-price">{formatCurrency(item.precio_oferta)}</span>
              </>
            ) : (
              <>
                <span className="original-price catalog-price-spacer" aria-hidden="true">
                  {formatCurrency(item.precio)}
                </span>
                <span className="current-price">{formatCurrency(item.precio)}</span>
              </>
            )}
          </div>
          {hasStock ? (
            <button
              type="button"
              className="btn home-public-featured-buy-btn"
              onClick={(e) => {
                e.stopPropagation()
                onQuickBuy(e, item)
              }}
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
  const bannerSourceWidth = isMobileFeatured ? 1280 : 1920
  const activeBannerImageUrl = optimizeCloudinaryImageUrl(
    activeBanner?.imageUrl || FALLBACK_BANNER_IMAGE,
    { width: bannerSourceWidth, quality: 'auto:best', format: 'auto' }
  )
  const activeBannerSrcSet = activeBanner?.imageUrl
    ? buildCloudinarySrcSet(activeBanner.imageUrl, isMobileFeatured ? [640, 960, 1280] : [1024, 1440, 1920], {
      quality: 'auto:best',
      format: 'auto',
    })
    : ''

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
    <>
      <SEO
        title="Textiles, fundas y deco para el hogar en DECOECLAT"
        description="Comprá textiles, fundas, accesorios y decoración para renovar tu hogar con estilo. Descubrí promociones, destacados y envíos a todo el país."
        keywords="textiles para el hogar, fundas, deco para el hogar, decoración, compras online"
        image="/d.jpg"
      />
      <MainLayout
        seoDisabled
        navbar={(
          <HomePublicNavbar
            categories={categories}
            searchValue=""
            onSearchSubmit={handleNavbarSearch}
          />
        )}
      >
        <h1
          id="home-public-title"
          style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: 0,
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: 0,
          }}
        >
          Textiles y deco para transformar tu hogar
        </h1>

        {error ? <p className="alert">{error}</p> : null}

        <section className="home-public-hero">
        <div
          className="home-public-banner-shell"
          onTouchStart={handleBannerTouchStart}
          onTouchEnd={handleBannerTouchEnd}
        >
          {activeBanner ? (
            activeBannerTarget ? (
              <Link className="home-public-banner" to={activeBannerTarget} onClickCapture={handleBannerClickCapture}>
                <img
                  src={activeBannerImageUrl}
                  srcSet={activeBannerSrcSet || undefined}
                  sizes="100vw"
                  alt={activeBanner.producto_nombre || activeBanner.categoria_nombre || 'Banner principal'}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  width={isMobileFeatured ? '720' : '1280'}
                  height={isMobileFeatured ? '225' : '400'}
                />
              </Link>
            ) : (
              <div className="home-public-banner" onClickCapture={handleBannerClickCapture}>
                <img
                  src={activeBannerImageUrl}
                  srcSet={activeBannerSrcSet || undefined}
                  sizes="100vw"
                  alt={activeBanner.producto_nombre || activeBanner.categoria_nombre || 'Banner principal'}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  width={isMobileFeatured ? '720' : '1280'}
                  height={isMobileFeatured ? '225' : '400'}
                />
              </div>
            )
          ) : (
            <div className="home-public-banner empty" aria-hidden="true">
              <img
                src={activeBannerImageUrl}
                srcSet={activeBannerSrcSet || undefined}
                sizes="100vw"
                alt="Banner principal"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                width={isMobileFeatured ? '720' : '1280'}
                height={isMobileFeatured ? '225' : '400'}
              />
            </div>
          )}

          {banners.length > 1 ? (
            <div className="home-public-banner-dots" role="tablist" aria-label="Seleccionar banner">
              {banners.map((banner, index) => (
                <button
                  key={banner.carousel_id || index}
                  type="button"
                  className={`home-public-banner-dot ${index === safeActiveBannerIndex ? 'active' : ''}`}
                  onClick={() => setActiveBannerIndex(index)}
                  role="tab"
                  aria-selected={index === safeActiveBannerIndex}
                  tabIndex={index === safeActiveBannerIndex ? 0 : -1}
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

        {loading ? (
          <div className="home-public-featured-grid" aria-hidden="true">
            {FEATURED_SKELETON_ITEMS.map((item) => (
              <article key={`featured-skeleton-${item}`} className="home-public-featured-card home-public-featured-card-skeleton">
                <div className="home-public-featured-media home-public-featured-media-skeleton" />
                <div className="home-public-featured-body home-public-featured-body-skeleton">
                  <div className="skeleton-line skeleton-line-title" />
                  <div className="home-public-featured-footer">
                    <div className="home-public-featured-price">
                      <div className="skeleton-line skeleton-line-price" />
                    </div>
                    <div className="skeleton-chip" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : featuredProducts.length === 0 ? (
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
                            onNavigate={(productId) => navigate(`/producto/${productId}`)}
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
                onNavigate={(productId) => navigate(`/producto/${productId}`)}
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
              Creamos deco con amor y dedicación, pensada para convertir tus espacios en hogar.
            </p>
          </article>

        
          <article className="home-public-value-card">
            <div className="home-public-value-icon" aria-hidden="true">
              <img src="/valores/corazon.webp" alt="" loading="lazy" decoding="async" />
            </div>
            <h3>Familia</h3>
            <p>
              Creemos en el valor de lo personal,
              por eso brindamos atención personalizada
              para que cada pieza sea ideal para vos.
            </p>
          </article>
        </div>
        </section>
      </MainLayout>
    </>
  )
}
