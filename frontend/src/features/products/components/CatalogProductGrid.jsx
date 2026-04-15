import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatCurrency } from '../../../shared/utils/utils'
import { useCarrito } from '../../carrito/hooks/useCarrito'
import { buildCloudinarySrcSet, optimizeCloudinaryImageUrl } from '../../../shared/utils/cloudinary'
import { productServices } from '../services/productServices'

function pickImageUrl(value) {
  if (!value) return null

  if (typeof value === 'string') return value

  if (Array.isArray(value)) {
    for (const item of value) {
      const nestedUrl = pickImageUrl(item)
      if (nestedUrl) return nestedUrl
    }
    return null
  }

  if (typeof value === 'object') {
    return (
      value.url ||
      value.imageUrl ||
      value.src ||
      value.imagen_principal ||
      value.imagenPrincipal ||
      value.imagen_secundaria ||
      value.imagenSecundaria ||
      value.secondaryImageUrl ||
      value.thumbnail ||
      null
    )
  }

  return null
}

function resolveImage(product) {
  return (
    pickImageUrl(product?.imagen_principal) ||
    pickImageUrl(product?.imagenPrincipal) ||
    pickImageUrl(product?.imageUrl) ||
    pickImageUrl(product?.url) ||
    pickImageUrl(product?.imagen) ||
    pickImageUrl(product?.images) ||
    pickImageUrl(product?.imagenes) ||
    pickImageUrl(product?.variantImages) ||
    pickImageUrl(product?.imagenes_variantes) ||
    null
  )
}

function resolveSecondaryImage(product) {
  return (
    pickImageUrl(product?.imagen_secundaria) ||
    pickImageUrl(product?.imagenSecundaria) ||
    pickImageUrl(product?.secondaryImageUrl) ||
    pickImageUrl(product?.secondaryImage) ||
    pickImageUrl(Array.isArray(product?.images) ? product.images[1] : null) ||
    pickImageUrl(Array.isArray(product?.imagenes) ? product.imagenes[1] : null) ||
    pickImageUrl(Array.isArray(product?.variantImages) ? product.variantImages[1] : null) ||
    pickImageUrl(Array.isArray(product?.imagenes_variantes) ? product.imagenes_variantes[1] : null) ||
    null
  )
}

export function CatalogProductGrid({ products, loading, onProductNavigate }) {
  const { handleAddToCart } = useCarrito()
  const [addingProductId, setAddingProductId] = useState(null)
  const [productImageFallbacks, setProductImageFallbacks] = useState({})
  const [touchPreviewProductId, setTouchPreviewProductId] = useState(null)

  const productImageCandidates = useMemo(
    () =>
      products
        .map((product) => ({
          productId: Number(product?.producto_id),
          hasPrimaryImage: Boolean(resolveImage(product)),
        }))
        .filter((item) => Number.isInteger(item.productId) && item.productId > 0 && !item.hasPrimaryImage),
    [products]
  )

  useEffect(() => {
    let cancelled = false

    async function loadFallbackImages() {
      if (productImageCandidates.length === 0) {
        setProductImageFallbacks({})
        return
      }

      const results = await Promise.allSettled(
        productImageCandidates.map(async ({ productId }) => {
          const images = await productServices.listImagesByProduct(productId)
          const safeImages = Array.isArray(images) ? images : []
          const sortedImages = [...safeImages].sort((left, right) => {
            const principalDiff = Number(Boolean(right.principal)) - Number(Boolean(left.principal))
            if (principalDiff !== 0) return principalDiff
            const orderDiff = Number(left.orden ?? 0) - Number(right.orden ?? 0)
            if (orderDiff !== 0) return orderDiff
            return Number(left.img_id ?? 0) - Number(right.img_id ?? 0)
          })

          return {
            productId,
            imageUrl: sortedImages[0]?.url || null,
            secondaryImageUrl: sortedImages[1]?.url || null,
          }
        })
      )

      if (cancelled) return

      const nextFallbacks = results.reduce((acc, result) => {
        if (result.status !== 'fulfilled') return acc

        const { productId, imageUrl, secondaryImageUrl } = result.value || {}
        if (!Number.isInteger(Number(productId))) return acc

        acc[productId] = {
          imageUrl: imageUrl || null,
          secondaryImageUrl: secondaryImageUrl || null,
        }
        return acc
      }, {})

      setProductImageFallbacks(nextFallbacks)
    }

    loadFallbackImages()

    return () => {
      cancelled = true
    }
  }, [productImageCandidates])

  if (loading) {
    return <p>Cargando productos...</p>
  }

  if (!loading && products.length === 0) {
    return <p>No hay productos para mostrar con los filtros actuales.</p>
  }

  async function handleQuickBuy(event, product) {
    event.preventDefault()

    if (!product?.variante_id) {
      alert('No hay variante disponible para este producto')
      return
    }

    try {
      setAddingProductId(product.producto_id)
      await handleAddToCart(product.variante_id, 1)
    } catch (error) {
      console.error('Error al agregar al carrito:', error)
    } finally {
      setAddingProductId(null)
    }
  }

  return (
    <section className="catalog-grid">
      {products.map((product) => {
        const productId = Number(product?.producto_id)
        const fallbackImages = productImageFallbacks[Number(product?.producto_id)] || null
        const productImage = resolveImage(product) || fallbackImages?.imageUrl || null
        const secondaryImage = resolveSecondaryImage(product) || fallbackImages?.secondaryImageUrl || null
        const isTouchPreviewActive = Boolean(secondaryImage) && touchPreviewProductId === productId
        const hasStock = Number(product?.stock ?? 0) > 0
        const basePrice = Number(product?.precio ?? 0)
        const offerPrice = Number(product?.precioOferta ?? 0)
        const hasOffer = Boolean(product?.enOferta) && offerPrice > 0 && basePrice > offerPrice
        const discountPercentage = hasOffer
          ? Math.round(((basePrice - offerPrice) / basePrice) * 100)
          : 0
        const offerBadgeLevelClass = discountPercentage > 30
          ? 'is-high'
          : discountPercentage > 15
            ? 'is-medium'
            : 'is-low'
        const productSrcSet = productImage ? buildCloudinarySrcSet(productImage, [240, 320, 360], { quality: 'auto', format: 'auto' }) : ''
        const secondarySrcSet = secondaryImage ? buildCloudinarySrcSet(secondaryImage, [240, 320, 360], { quality: 'auto', format: 'auto' }) : ''
        return (
          <Link
            key={product.producto_id}
            to={`/producto/${product.producto_id}`}
            className="catalog-card-link"
            data-catalog-product-id={product.producto_id}
            onClick={() => onProductNavigate?.(product.producto_id)}
          >
            <article className={`home-public-featured-card catalog-product-card ${hasOffer ? 'has-offer' : ''}`.trim()}>
              <div
                className={`home-public-featured-media ${secondaryImage ? 'has-secondary' : ''} ${isTouchPreviewActive ? 'is-touch-preview' : ''} ${productImage ? '' : 'catalog-product-media-placeholder'}`}
                onTouchStart={secondaryImage ? () => setTouchPreviewProductId(productId) : undefined}
                onTouchEnd={secondaryImage ? () => setTouchPreviewProductId(null) : undefined}
                onTouchCancel={secondaryImage ? () => setTouchPreviewProductId(null) : undefined}
              >
                {hasOffer ? (
                  <span className={`product-offer-badge ${offerBadgeLevelClass}`}>
                    PROMO{discountPercentage > 0 ? ` -${discountPercentage}%` : ''}
                  </span>
                ) : null}

                {productImage ? (
                  <div className="home-public-featured-media-stack">
                    <img
                      src={optimizeCloudinaryImageUrl(productImage, { width: 360 })}
                      srcSet={productSrcSet || undefined}
                      sizes="(max-width: 575px) 46vw, 260px"
                      alt={product.nombre}
                      className="home-public-featured-media-image primary catalog-product-image"
                      loading="lazy"
                      decoding="async"
                    />
                    {secondaryImage ? (
                      <img
                        src={optimizeCloudinaryImageUrl(secondaryImage, { width: 360 })}
                        srcSet={secondarySrcSet || undefined}
                        sizes="(max-width: 575px) 46vw, 260px"
                        alt={`${product.nombre} vista alternativa`}
                        className="home-public-featured-media-image secondary catalog-product-image"
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
                <h3>{product.nombre}</h3>
                <p className="catalog-product-category">{product.categoria || 'Categoria general'}</p>

                <div className="home-public-featured-footer catalog-product-footer">
                  <div className={`home-public-featured-price catalog-product-price ${hasOffer ? 'has-offer' : ''}`}>
                    {hasOffer ? (
                      <>
                        <span className="original-price">{formatCurrency(product.precio)}</span>
                        <span className="offer-price">{formatCurrency(product.precioOferta)}</span>
                      </>
                    ) : (
                      <>
                        <span className="original-price catalog-price-spacer" aria-hidden="true">
                          {formatCurrency(product.precio)}
                        </span>
                        <span className="current-price">{formatCurrency(product.precio)}</span>
                      </>
                    )}
                  </div>
                  {hasStock ? (
                    <button
                      type="button"
                      className="btn home-public-featured-buy-btn"
                      onClick={(event) => handleQuickBuy(event, product)}
                      disabled={addingProductId === product.producto_id}
                    >
                      {addingProductId === product.producto_id ? 'Agregando...' : 'Comprar'}
                    </button>
                  ) : (
                    <span className="home-public-featured-stock-label">Sin stock</span>
                  )}
                </div>
              </div>
            </article>
          </Link>
        )
      })}
    </section>
  )
}
