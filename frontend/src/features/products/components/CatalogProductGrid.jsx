import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatCurrency } from '../../../shared/utils/utils'
import { useCarrito } from '../../carrito/hooks/useCarrito'

function resolveImage(product) {
  return (
    product.imagen_principal ||
    product.imagenPrincipal ||
    product.imageUrl ||
    product.url ||
    null
  )
}

function resolveSecondaryImage(product) {
  return (
    product.imagen_secundaria ||
    product.imagenSecundaria ||
    product.secondaryImageUrl ||
    null
  )
}

export function CatalogProductGrid({ products, loading, onProductNavigate }) {
  const { handleAddToCart } = useCarrito()
  const [addingProductId, setAddingProductId] = useState(null)

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
        const productImage = resolveImage(product)
        const secondaryImage = resolveSecondaryImage(product)
        const hasStock = Number(product?.stock ?? 0) > 0
        return (
          <Link
            key={product.producto_id}
            to={`/producto/${product.producto_id}`}
            className="catalog-card-link"
            onClick={() => onProductNavigate?.()}
          >
            <article className="home-public-featured-card catalog-product-card">
              <div
                className={`home-public-featured-media ${secondaryImage ? 'has-secondary' : ''} ${productImage ? '' : 'catalog-product-media-placeholder'}`}
              >
                {productImage ? (
                  <div className="home-public-featured-media-stack">
                    <img
                      src={productImage}
                      alt={product.nombre}
                      className="home-public-featured-media-image primary catalog-product-image"
                    />
                    {secondaryImage ? (
                      <img
                        src={secondaryImage}
                        alt={`${product.nombre} vista alternativa`}
                        className="home-public-featured-media-image secondary catalog-product-image"
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
                  <div className="home-public-featured-price catalog-product-price">
                    {product.enOferta && product.precioOferta ? (
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
