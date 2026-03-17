function formatMoney(value) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
  }).format(Number(value || 0))
}

function resolveImage(product) {
  return (
    product.imagen_principal ||
    product.imagenPrincipal ||
    product.imageUrl ||
    product.url ||
    null
  )
}

export function CatalogProductGrid({ products, loading }) {
  if (loading) {
    return <p>Cargando productos...</p>
  }

  if (!loading && products.length === 0) {
    return <p>No hay productos para mostrar con los filtros actuales.</p>
  }

  return (
    <section className="catalog-grid">
      {products.map((product) => {
        const productImage = resolveImage(product)
        return (
          <article key={product.producto_id} className="catalog-card">
            {productImage ? (
              <img src={productImage} alt={product.nombre} className="catalog-card-image" />
            ) : (
              <div className="catalog-card-image placeholder">Sin imagen</div>
            )}

            <div className="catalog-card-body">
              <h3>{product.nombre}</h3>
              <p className="catalog-card-category">{product.categoria || 'Categoria general'}</p>
              <div className="catalog-card-price">
                {product.enOferta && product.precioOferta ? (
                  <div className="price-discount">
                    <span className="price-original">{formatMoney(product.precio)}</span>
                    <span className="price-current">{formatMoney(product.precioOferta)}</span>
                  </div>
                ) : (
                  <span className="price-current">{formatMoney(product.precio)}</span>
                )}
              </div>
            </div>
          </article>
        )
      })}
    </section>
  )
}
