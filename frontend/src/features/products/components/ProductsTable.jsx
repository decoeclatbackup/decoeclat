function formatMoney(value) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
  }).format(Number(value || 0))
}

export function ProductsTable({ products, loading, onEdit, onRemove, onToggleActive }) {
  return (
    <section className="card">
      <h2>Listado de Productos</h2>

      {loading ? <p>Cargando productos...</p> : null}

      {!loading && products.length === 0 ? (
        <p>No hay productos para mostrar con los filtros actuales.</p>
      ) : null}

      {!loading && products.length > 0 ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Categoria</th>
                <th>Talle</th>
                <th>Tipo Tela</th>
                <th>Activo</th>
                <th>Precio</th>
                <th>En Oferta</th>
                <th>Precio Oferta</th>
                <th>Stock</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.producto_id}>
                  <td>{product.nombre}</td>
                  <td>{product.categoria || `${product.categoria_id}`}</td>
                  <td>{product.Size || '-'}</td>
                  <td>{product.tela || `${product.tela_id || '-'}`}</td>
                  <td>
                    <div className="accion activo">
                        <button
                          type="button"
                          className={`btn tiny ${product.activo ? 'success' : 'danger'}`}
                          onClick={() => onToggleActive(product)}
                        >
                            {product.activo ? 'Activo' : 'Inactivo'}
                        </button>
                    </div>
                    </td>
                  <td>{formatMoney(product.precio)}</td>
                  <td>{product.enOferta ? 'Si' : 'No'}</td>
                  <td>{product.enOferta ? formatMoney(product.precioOferta) : '-'}</td>
                  <td>{Number(product.stock ?? 0)}</td>
                  <td>
                    <div className="actions compact">
                      <button
                        type="button"
                        className="btn tiny"
                        onClick={() => onEdit(product)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn danger tiny"
                        onClick={() => onRemove(product)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}
