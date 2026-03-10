function formatMoney(value) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
  }).format(Number(value || 0))
}

export function ProductsTable({ products, loading, onEdit, onRemove }) {
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
                <th>Color</th>
                <th>Precio</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.producto_id}>
                  <td>{product.nombre}</td>
                  <td>{product.categoria || `ID ${product.categoria_id}`}</td>
                  <td>{product.Size || `ID ${product.size_id || '-'}`}</td>
                  <td>{product.tela || `ID ${product.tela_id || '-'}`}</td>
                  <td>{formatMoney(product.precio)}</td>
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
                        Dar de baja
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
