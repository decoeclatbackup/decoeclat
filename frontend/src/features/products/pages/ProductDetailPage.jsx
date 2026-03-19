import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { MainLayout } from '../../../layouts/layouts'
import { productServices } from '../services/productServices'
import { useCarrito } from '../../carrito/hooks/useCarrito'
import Navbar from '../../../shared/components/Navbar'

function formatMoney(value) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

function getVariantSizeLabel(variant) {
  return variant?.size || variant?.Size || variant?.valor || `${variant?.size_id || '-'}`
}

export function ProductDetailPage() {
  const { productId } = useParams()
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

  const [selectedVariantId, setSelectedVariantId] = useState(null)
  const [selectedImageUrl, setSelectedImageUrl] = useState(null)
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
        const safeVariants = Array.isArray(variantsData) ? variantsData : []
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

        const defaultVariant = safeVariants.find((variant) => Number(variant.stock ?? 0) > 0) || safeVariants[0] || null
        const defaultVariantId = defaultVariant?.variante_id || null
        setSelectedVariantId(defaultVariantId)

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

  const visibleImages = useMemo(() => {
    if (!selectedVariantId) return images
    const byVariant = images.filter((image) => Number(image.variante_id) === Number(selectedVariantId))
    return byVariant.length > 0 ? byVariant : images
  }, [images, selectedVariantId])

  useEffect(() => {
    if (visibleImages.length === 0) {
      setSelectedImageUrl(null)
      return
    }

    const exists = visibleImages.some((image) => image.url === selectedImageUrl)
    if (exists) return

    const nextImage = visibleImages.find((image) => Boolean(image.principal)) || visibleImages[0]
    setSelectedImageUrl(nextImage?.url || null)
  }, [visibleImages, selectedImageUrl])

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

  return (
    <MainLayout
      navbar={(
        <Navbar
          categories={categories}
          selectedCategoryId={product?.categoria_id || ''}
          searchValue=""
          onSearchSubmit={() => {}}
        />
      )}
    >
      {loading ? <p>Cargando producto...</p> : null}
      {!loading && error ? <p className="alert">Error: {error}</p> : null}

      {!loading && !error && product ? (
        <section className="product-detail-shell">
          <article className="product-detail-card">
            <section className="product-detail-gallery">
              <div className="product-detail-main-media">
                {selectedImageUrl ? (
                  <img src={selectedImageUrl} alt={product.nombre} className="product-detail-main-image" />
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
                      <img src={image.url} alt={product.nombre} className="product-thumb-img" />
                    </button>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="product-detail-info">
              <h1>{String(product.nombre || '').toUpperCase()}</h1>
              <span className="product-detail-tag">{String(product.categoria || 'Producto').toUpperCase()}</span>

              <div className="product-detail-price-block">
                {isOnOffer ? (
                  <div className="product-detail-price-offer">
                    <span className="product-detail-price-current">{formatMoney(offerPrice)}</span>
                    <span className="product-detail-price-base">{formatMoney(basePrice)}</span>
                  </div>
                ) : (
                  <span className="product-detail-price-current">{formatMoney(basePrice)}</span>
                )}
              </div>

              {productDescription ? (
                <section className="product-detail-box">
                  <p className="product-detail-box-title">Descripción:</p>
                  <p className="product-detail-description-text">{productDescription}</p>
                </section>
              ) : null}

              <section className="product-detail-box">
                <p className="product-detail-box-title">Medidas disponibles:</p>
                <div className="product-detail-sizes">
                  {variants.map((variant) => (
                    <button
                      key={variant.variante_id}
                      type="button"
                      className={`product-size-btn ${Number(selectedVariantId) === Number(variant.variante_id) ? 'active' : ''}`}
                      onClick={() => setSelectedVariantId(variant.variante_id)}
                    >
                      {getVariantSizeLabel(variant)}
                    </button>
                  ))}
                </div>
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

              {cartMessage ? <p className="product-detail-feedback success">{cartMessage}</p> : null}
              {cartError ? <p className="product-detail-feedback error">{cartError}</p> : null}
            </section>
          </article>
        </section>
      ) : null}
    </MainLayout>
  )
}
