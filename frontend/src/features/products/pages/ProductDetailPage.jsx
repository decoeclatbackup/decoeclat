import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MainLayout } from '../../../layouts/layouts'
import { productServices } from '../services/productServices'
import { sortVariantsForDisplay } from '../services/productServices'
import { useCarrito } from '../../carrito/hooks/useCarrito'
import HomePublicNavbar from '../../../shared/components/HomePublicNavbar'
import { formatCurrency } from '../../../shared/utils/utils'
import { optimizeCloudinaryImageUrl } from '../../../shared/utils/cloudinary'

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function getVariantSizeLabel(variant) {
  const label = variant?.size || variant?.Size || variant?.valor || `${variant?.size_id || '-'}`
  return normalizeText(label) === 'talle unico' ? 'Medida única' : label
}

function resolveImage(product) {
  return (
    product?.imagen_principal ||
    product?.imagenPrincipal ||
    product?.imageUrl ||
    product?.url ||
    null
  )
}

export function ProductDetailPage() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { handleAddToCart } = useCarrito()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cartMessage, setCartMessage] = useState('')
  const [cartError, setCartError] = useState('')
  const [addingToCart, setAddingToCart] = useState(false)
  const [product, setProduct] = useState(null)
  const [categories, setCategories] = useState([])
  const [variants, setVariants] = useState([])
  const [images, setImages] = useState([])
  const [recommendedProducts, setRecommendedProducts] = useState([])
  const [loadingRecommended, setLoadingRecommended] = useState(false)

  const [selectedVariantId, setSelectedVariantId] = useState(null)
  const [selectedSizeId, setSelectedSizeId] = useState(null)
  const [selectedRelleno, setSelectedRelleno] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState(null)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    let cancelled = false

    async function loadDetail() {
      try {
        setLoading(true)
        setError('')

        const [productData, categoriesData, variantsData, imagesData] = await Promise.all([
          productServices.getById(productId),
          productServices.listCategories(),
          productServices.listVariantsByProduct(productId),
          productServices.listImagesByProduct(productId),
        ])

        if (cancelled) return

        const safeCategories = Array.isArray(categoriesData) ? categoriesData : []
        const safeVariants = sortVariantsForDisplay(Array.isArray(variantsData) ? variantsData : [])
        const safeImages = (Array.isArray(imagesData) ? imagesData : []).sort((left, right) => {
          const principalDiff = Number(Boolean(right.principal)) - Number(Boolean(left.principal))
          if (principalDiff !== 0) return principalDiff
          const orderDiff = Number(left.orden ?? 0) - Number(right.orden ?? 0)
          if (orderDiff !== 0) return orderDiff
          return Number(left.img_id ?? 0) - Number(right.img_id ?? 0)
        })

        setProduct(productData || null)
        setCategories(safeCategories)
        setVariants(safeVariants)
        setImages(safeImages)

        const defaultVariant = safeVariants[0] || null
        const defaultVariantId = defaultVariant?.variante_id || null
        setSelectedVariantId(defaultVariantId)
        setSelectedSizeId(defaultVariant?.size_id || null)
        setSelectedRelleno(Boolean(defaultVariant?.relleno))

        const variantImages = defaultVariantId
          ? safeImages.filter((image) => Number(image.variante_id) === Number(defaultVariantId))
          : []

        const imagePool = variantImages.length > 0 ? variantImages : safeImages
        const defaultImage = imagePool.find((image) => Boolean(image.principal)) || imagePool[0] || null
        setSelectedImageUrl(defaultImage?.url || null)
        setQuantity(1)
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'No se pudo cargar el producto')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadDetail()

    return () => {
      cancelled = true
    }
  }, [productId])

  const selectedVariant = useMemo(
    () => variants.find((variant) => Number(variant.variante_id) === Number(selectedVariantId)) || null,
    [variants, selectedVariantId]
  )

  const sizeOptions = useMemo(() => {
    const bySizeId = new Map()
    variants.forEach((variant) => {
      const sizeId = Number(variant?.size_id)
      if (!Number.isInteger(sizeId) || bySizeId.has(sizeId)) return
      bySizeId.set(sizeId, {
        sizeId,
        label: getVariantSizeLabel(variant),
      })
    })
    return Array.from(bySizeId.values())
  }, [variants])

  const rellenoOptions = useMemo(() => {
    if (!selectedSizeId) return []
    const options = new Set()
    variants
      .filter((variant) => Number(variant?.size_id) === Number(selectedSizeId))
      .forEach((variant) => options.add(Boolean(variant?.relleno)))
    return Array.from(options.values())
  }, [selectedSizeId, variants])

  useEffect(() => {
    if (!selectedVariant) return
    setSelectedSizeId(selectedVariant.size_id || null)
    setSelectedRelleno(Boolean(selectedVariant.relleno))
  }, [selectedVariant])

  function selectVariantByAttributes(nextSizeId, nextRelleno) {
    const exactVariant = variants.find(
      (variant) => Number(variant?.size_id) === Number(nextSizeId) && Boolean(variant?.relleno) === Boolean(nextRelleno)
    )

    if (exactVariant) {
      setSelectedVariantId(exactVariant.variante_id)
      setSelectedSizeId(nextSizeId)
      setSelectedRelleno(Boolean(nextRelleno))
      return
    }

    const sameSizeVariant = variants.find((variant) => Number(variant?.size_id) === Number(nextSizeId))
    if (sameSizeVariant) {
      setSelectedVariantId(sameSizeVariant.variante_id)
      setSelectedSizeId(nextSizeId)
      setSelectedRelleno(Boolean(sameSizeVariant.relleno))
    }
  }

  const visibleImages = useMemo(() => {
    if (!selectedVariantId) return images
    const byVariant = images.filter((image) => Number(image.variante_id) === Number(selectedVariantId))
    return byVariant.length > 0 ? byVariant : images
  }, [images, selectedVariantId])

  const selectedImageIndex = useMemo(
    () => visibleImages.findIndex((image) => image.url === selectedImageUrl),
    [visibleImages, selectedImageUrl]
  )

  useEffect(() => {
    if (visibleImages.length === 0) {
      setSelectedImageUrl(null)
      setIsLightboxOpen(false)
      return
    }

    const exists = visibleImages.some((image) => image.url === selectedImageUrl)
    if (exists) return

    const nextImage = visibleImages.find((image) => Boolean(image.principal)) || visibleImages[0]
    setSelectedImageUrl(nextImage?.url || null)
  }, [visibleImages, selectedImageUrl])

  useEffect(() => {
    if (!isLightboxOpen) return undefined

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setIsLightboxOpen(false)
        return
      }

      if (visibleImages.length <= 1) return

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        setSelectedImageUrl((prevUrl) => {
          const currentIndex = visibleImages.findIndex((image) => image.url === prevUrl)
          const safeIndex = currentIndex >= 0 ? currentIndex : 0
          const nextIndex = (safeIndex + 1) % visibleImages.length
          return visibleImages[nextIndex]?.url || prevUrl
        })
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        setSelectedImageUrl((prevUrl) => {
          const currentIndex = visibleImages.findIndex((image) => image.url === prevUrl)
          const safeIndex = currentIndex >= 0 ? currentIndex : 0
          const nextIndex = (safeIndex - 1 + visibleImages.length) % visibleImages.length
          return visibleImages[nextIndex]?.url || prevUrl
        })
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isLightboxOpen, visibleImages])

  function openLightbox() {
    if (!selectedImageUrl) return
    setIsLightboxOpen(true)
  }

  function closeLightbox() {
    setIsLightboxOpen(false)
  }

  function goToPrevImage() {
    if (visibleImages.length <= 1) return
    setSelectedImageUrl((prevUrl) => {
      const currentIndex = visibleImages.findIndex((image) => image.url === prevUrl)
      const safeIndex = currentIndex >= 0 ? currentIndex : 0
      const nextIndex = (safeIndex - 1 + visibleImages.length) % visibleImages.length
      return visibleImages[nextIndex]?.url || prevUrl
    })
  }

  function goToNextImage() {
    if (visibleImages.length <= 1) return
    setSelectedImageUrl((prevUrl) => {
      const currentIndex = visibleImages.findIndex((image) => image.url === prevUrl)
      const safeIndex = currentIndex >= 0 ? currentIndex : 0
      const nextIndex = (safeIndex + 1) % visibleImages.length
      return visibleImages[nextIndex]?.url || prevUrl
    })
  }

  const stock = Number(selectedVariant?.stock ?? 0)
  const hasStock = stock > 0

  useEffect(() => {
    if (!hasStock) {
      setQuantity(1)
      return
    }

    setQuantity((prev) => {
      if (prev < 1) return 1
      if (prev > stock) return stock
      return prev
    })
  }, [stock, hasStock])

  const basePrice = Number(selectedVariant?.precio ?? 0)
  const offerPrice = Number(selectedVariant?.precio_oferta ?? 0)
  const isOnOffer = Boolean(selectedVariant?.en_oferta) && offerPrice > 0
  const productDescription = String(product?.descripcion || '').trim()
  const seoTitle = product?.nombre
    ? `${product.nombre} | ${product.categoria || 'Producto'}`
    : 'Detalle de producto'
  const seoDescription = productDescription
    ? productDescription.slice(0, 160)
    : `Compra ${String(product?.nombre || 'este producto')} en DECOECLAT. Encontra medidas, disenos y precios actualizados.`
  const seoImage = optimizeCloudinaryImageUrl(selectedImageUrl || resolveImage(product) || null, { width: 800 })

  async function onAddToCartClick() {
    if (!selectedVariantId || !hasStock) return

    try {
      setAddingToCart(true)
      setCartMessage('')
      setCartError('')

      await handleAddToCart(selectedVariantId, quantity)
      setCartMessage('Producto agregado al carrito.')
    } catch (err) {
      setCartError(err?.message || 'No se pudo agregar el producto al carrito')
    } finally {
      setAddingToCart(false)
    }
  }

  function handleNavbarSearch(searchValue) {
    const query = new URLSearchParams()
    if (searchValue?.trim()) {
      query.set('name', searchValue.trim())
    }
    navigate(`/catalogo${query.toString() ? `?${query.toString()}` : ''}`)
  }

  useEffect(() => {
    let cancelled = false

    async function loadRecommendedProducts() {
      const categoryId = Number(product?.categoria_id)
      const currentProductId = Number(product?.producto_id)

      if (!Number.isInteger(categoryId) || categoryId <= 0 || !Number.isInteger(currentProductId)) {
        setRecommendedProducts([])
        return
      }

      try {
        setLoadingRecommended(true)

        const categoryProducts = await productServices.list({ categoryId })
        if (cancelled) return

        const related = (Array.isArray(categoryProducts) ? categoryProducts : [])
          .filter((item) => Number(item?.producto_id) !== currentProductId)
          .filter((item) => Boolean(item?.activo))
          .slice(0, 4)

        setRecommendedProducts(related)
      } catch {
        if (!cancelled) {
          setRecommendedProducts([])
        }
      } finally {
        if (!cancelled) {
          setLoadingRecommended(false)
        }
      }
    }

    loadRecommendedProducts()

    return () => {
      cancelled = true
    }
  }, [product?.categoria_id, product?.producto_id])

  return (
    <MainLayout
      title={seoTitle}
      description={seoDescription}
      image={seoImage}
      navbar={(
        <HomePublicNavbar
          categories={categories}
          searchValue=""
          onSearchSubmit={handleNavbarSearch}
        />
      )}
    >
      {loading ? <p>Cargando producto...</p> : null}
      {!loading && error ? <p className="alert">Error: {error}</p> : null}

      {!loading && !error && product ? (
        <>
          <section className="product-detail-shell">
            <article className="product-detail-card">
              <section className="product-detail-gallery">
              <div className="product-detail-main-media">
                {selectedImageUrl ? (
                  <button
                    type="button"
                    className="product-detail-main-image-button"
                    onClick={openLightbox}
                    aria-label="Ver imagen ampliada"
                  >
                    <img
                      src={optimizeCloudinaryImageUrl(selectedImageUrl, { width: 800 })}
                      alt={product.nombre}
                      className="product-detail-main-image"
                      loading="eager"
                      fetchPriority="high"
                      decoding="async"
                    />
                  </button>
                ) : (
                  <div className="product-detail-main-placeholder">Sin imagen</div>
                )}
              </div>

                {visibleImages.length > 0 ? (
                  <div className="product-detail-thumbnails" role="list">
                    {visibleImages.map((image) => (
                      <button
                        key={image.img_id}
                        type="button"
                        className={`product-thumb-btn ${selectedImageUrl === image.url ? 'active' : ''}`}
                        onClick={() => setSelectedImageUrl(image.url)}
                        aria-label="Ver imagen"
                      >
                        <img
                          src={optimizeCloudinaryImageUrl(image.url, { width: 120 })}
                          alt={product.nombre}
                          className="product-thumb-img"
                          loading="lazy"
                          decoding="async"
                        />
                      </button>
                    ))}
                  </div>
                ) : null}
              </section>

              <section className="product-detail-info">
              <h1>{String(product.nombre || '')}</h1>
              <span className="product-detail-tag">{String(product.categoria || 'Producto').toUpperCase()}</span>

              <div className="product-detail-price-block">
                {isOnOffer ? (
                  <div className="product-detail-price-offer">
                    <span className="product-detail-price-current">{formatCurrency(offerPrice)}</span>
                    <span className="product-detail-price-base">{formatCurrency(basePrice)}</span>
                  </div>
                ) : (
                  <span className="product-detail-price-current">{formatCurrency(basePrice)}</span>
                )}
              </div>

              <section className="product-detail-box">
                <p className="product-detail-box-title">Medidas disponibles:</p>
                <div className="product-detail-sizes">
                  {sizeOptions.map((sizeOption) => (
                    <button
                      key={sizeOption.sizeId}
                      type="button"
                      className={`product-size-btn ${Number(selectedSizeId) === Number(sizeOption.sizeId) ? 'active' : ''}`}
                      onClick={() => selectVariantByAttributes(sizeOption.sizeId, selectedRelleno)}
                    >
                      {sizeOption.label}
                    </button>
                  ))}
                </div>

                {rellenoOptions.length > 1 ? (
                  <>
                    <p className="product-detail-box-title">Relleno:</p>
                    <div className="product-detail-sizes">
                      {rellenoOptions.includes(false) ? (
                        <button
                          type="button"
                          className={`product-size-btn ${selectedRelleno === false ? 'active' : ''}`}
                          onClick={() => selectVariantByAttributes(selectedSizeId, false)}
                        >
                          Sin relleno
                        </button>
                      ) : null}

                      {rellenoOptions.includes(true) ? (
                        <button
                          type="button"
                          className={`product-size-btn ${selectedRelleno === true ? 'active' : ''}`}
                          onClick={() => selectVariantByAttributes(selectedSizeId, true)}
                        >
                          Con relleno
                        </button>
                      ) : null}
                    </div>
                  </>
                ) : null}

                <small className="product-detail-stock">
                  Stock disponible: {hasStock ? `${stock} unidades` : 'Sin stock'}
                </small>
              </section>

              <section className="product-detail-box">
                <p className="product-detail-box-title">Cantidad:</p>
                <div className="product-detail-qty-controls">
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    disabled={!hasStock || quantity <= 1}
                  >
                    −
                  </button>
                  <span className="qty-value">{quantity}</span>
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => setQuantity((prev) => Math.min(stock, prev + 1))}
                    disabled={!hasStock || quantity >= stock}
                  >
                    +
                  </button>
                </div>
              </section>

              <button
                type="button"
                className="product-detail-add-btn"
                onClick={onAddToCartClick}
                disabled={!hasStock || addingToCart}
              >
                {addingToCart ? 'Agregando...' : 'Agregar al carrito'}
              </button>

              {productDescription ? (
                <section className="product-detail-box">
                  <p className="product-detail-box-title">Descripción:</p>
                  <p className="product-detail-description-text">{productDescription}</p>
                </section>
              ) : null}

              

              {cartMessage ? <p className="product-detail-feedback success">{cartMessage}</p> : null}
              {cartError ? <p className="product-detail-feedback error">{cartError}</p> : null}
              </section>
            </article>
          </section>

          {loadingRecommended || recommendedProducts.length > 0 ? (
            <section className="product-detail-related">
              <div className="home-public-section-heading">
                <h2>Productos recomendados</h2>
              </div>

              {loadingRecommended ? (
                <p>Cargando recomendados...</p>
              ) : (
                <div className="product-detail-related-grid">
                  {recommendedProducts.map((relatedProduct) => {
                    const imageUrl = resolveImage(relatedProduct)
                    const price = Number(
                      relatedProduct?.enOferta && relatedProduct?.precioOferta
                        ? relatedProduct.precioOferta
                        : relatedProduct?.precio || 0
                    )

                    return (
                      <Link
                        key={relatedProduct.producto_id}
                        to={`/producto/${relatedProduct.producto_id}`}
                        className="product-detail-related-card"
                      >
                        <div className="product-detail-related-image-wrap">
                          {imageUrl ? (
                            <img
                              src={optimizeCloudinaryImageUrl(imageUrl, { width: 360 })}
                              alt={relatedProduct.nombre}
                              className="product-detail-related-image"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <div className="product-detail-related-placeholder">Sin imagen</div>
                          )}
                        </div>

                        <div className="product-detail-related-body">
                          <h3>{relatedProduct.nombre}</h3>
                          <p>{formatCurrency(price)}</p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </section>
          ) : null}

          {isLightboxOpen && selectedImageUrl ? (
            <div
              className="product-detail-lightbox"
              role="dialog"
              aria-modal="true"
              aria-label="Visor de imagenes del producto"
              onClick={closeLightbox}
            >
              <button
                type="button"
                className="product-detail-lightbox-close"
                aria-label="Cerrar visor"
                onClick={closeLightbox}
              >
                <span className="product-detail-lightbox-icon">×</span>
              </button>

              {visibleImages.length > 1 ? (
                <>
                  <button
                    type="button"
                    className="product-detail-lightbox-nav prev"
                    aria-label="Imagen anterior"
                    onClick={(event) => {
                      event.stopPropagation()
                      goToPrevImage()
                    }}
                  >
                    <span className="product-detail-lightbox-icon">{'<'}</span>
                  </button>

                  <button
                    type="button"
                    className="product-detail-lightbox-nav next"
                    aria-label="Imagen siguiente"
                    onClick={(event) => {
                      event.stopPropagation()
                      goToNextImage()
                    }}
                  >
                    <span className="product-detail-lightbox-icon">{'>'}</span>
                  </button>
                </>
              ) : null}

              <div className="product-detail-lightbox-body" onClick={(event) => event.stopPropagation()}>
                <img
                  src={optimizeCloudinaryImageUrl(selectedImageUrl, { width: 800 })}
                  alt={product.nombre}
                  className="product-detail-lightbox-image"
                  loading="eager"
                  decoding="async"
                />
                {visibleImages.length > 1 && selectedImageIndex >= 0 ? (
                  <p className="product-detail-lightbox-counter">
                    {selectedImageIndex + 1} / {visibleImages.length}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </MainLayout>
  )
}
