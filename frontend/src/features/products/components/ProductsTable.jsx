import { useState } from 'react'
import { formatCurrency } from '../../../shared/utils/utils'

export function ProductsTable({
  products,
  loading,
  onEdit,
  onRemove,
  onToggleActive,
  isClient = false,
}) {
  const [expandedProducts, setExpandedProducts] = useState({})

  function toggleProductDetails(productId) {
    setExpandedProducts((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }))
  }

  return (
    <section className="card">
      <h2>Listado de Productos</h2>

      {loading ? <p>Cargando productos...</p> : null}

      {!loading && products.length === 0 ? (
        <p>No hay productos para mostrar con los filtros actuales.</p>
      ) : null}

      {!loading && products.length > 0 ? (
        <>
          <div className="table-wrap products-desktop-table">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Categoria</th>
                <th>Medida</th>
                <th>Tipo Tela</th>
                {!isClient ? <th>Activo</th> : null}
                <th>Precio</th>
                <th>En Oferta</th>
                <th>Precio Oferta</th>
                <th>Color</th>
                <th>Stock</th>
                {!isClient ? <th>Acciones</th> : null}
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.producto_id}>
                  <td>{product.nombre}</td>
                  <td>{product.categoria || `${product.categoria_id}`}</td>
                  <td>{product.Size || '-'}</td>
                  <td>{product.tela || `${product.tela_id || '-'}`}</td>
                  {!isClient ? (
                    <td>
                      <div className="accion activo">
                        <button
                          type="button"
                          className={`btn tiny ${product.activo ? 'success' : 'danger'}`}
                          onClick={() => onToggleActive?.(product)}
                        >
                          {product.activo ? 'Activo' : 'Inactivo'}
                        </button>
                      </div>
                    </td>
                  ) : null}
                  <td>{formatCurrency(product.precio)}</td>
                  <td>{product.enOferta ? 'Si' : 'No'}</td>
                  <td>{product.enOferta ? formatCurrency(product.precioOferta) : '-'}</td>
                  <td>{product.color || '-'}</td>
                  <td>{Number(product.stock ?? 0)}</td>
                  {!isClient ? (
                    <td>
                      <div className="actions compact">
                        <button
                          type="button"
                          className="btn tiny"
                          onClick={() => onEdit?.(product)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn danger tiny"
                          onClick={() => onRemove?.(product)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          <div className="products-mobile-list">
            {products.map((product) => (
              <article className="products-mobile-card" key={`mobile-${product.producto_id}`}>
                <header className="products-mobile-header">
                  <h3>{product.nombre}</h3>
                  <p className="products-mobile-price">{formatCurrency(product.precio)}</p>
                </header>

                {!isClient ? (
                  <div className="products-mobile-actions">
                    <button
                      type="button"
                      className={`btn tiny ${product.activo ? 'success' : 'danger'}`}
                      onClick={() => onToggleActive?.(product)}
                    >
                      {product.activo ? 'Activo' : 'Inactivo'}
                    </button>
                    <button
                      type="button"
                      className="btn tiny"
                      onClick={() => onEdit?.(product)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn danger tiny"
                      onClick={() => onRemove?.(product)}
                    >
                      Eliminar
                    </button>
                    <button
                      type="button"
                      className="btn ghost tiny"
                      onClick={() => toggleProductDetails(product.producto_id)}
                      aria-expanded={Boolean(expandedProducts[product.producto_id])}
                    >
                      {expandedProducts[product.producto_id] ? 'Ocultar detalles' : 'Ver detalles'}
                    </button>
                  </div>
                ) : null}

                {expandedProducts[product.producto_id] ? (
                  <div className="products-mobile-meta">
                    <div className="products-mobile-row">
                      <span>Categoria</span>
                      <strong>{product.categoria || `${product.categoria_id}`}</strong>
                    </div>
                    <div className="products-mobile-row">
                      <span>Medida</span>
                      <strong>{product.Size || '-'}</strong>
                    </div>
                    <div className="products-mobile-row">
                      <span>Tipo tela</span>
                      <strong>{product.tela || `${product.tela_id || '-'}`}</strong>
                    </div>
                    <div className="products-mobile-row">
                      <span>Color</span>
                      <strong>{product.color || '-'}</strong>
                    </div>
                    <div className="products-mobile-row">
                      <span>Stock</span>
                      <strong>{Number(product.stock ?? 0)}</strong>
                    </div>
                    <div className="products-mobile-row">
                      <span>En oferta</span>
                      <strong>{product.enOferta ? 'Si' : 'No'}</strong>
                    </div>
                    <div className="products-mobile-row">
                      <span>Precio oferta</span>
                      <strong>{product.enOferta ? formatCurrency(product.precioOferta) : '-'}</strong>
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </>
      ) : null}
    </section>
  )
}
