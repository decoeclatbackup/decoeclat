import { formatCurrency } from '../../../shared/utils/utils'

export function ProductsTable({
  products,
  loading,
  onEdit,
  onRemove,
  onToggleActive,
  isClient = false,
}) {
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
                <th>Medida</th>
                <th>Tipo Tela</th>
                {!isClient ? <th>Activo</th> : null}
                <th>Precio</th>
                <th>En Oferta</th>
                <th>Precio Oferta</th>
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
      ) : null}
    </section>
  )
}
