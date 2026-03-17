import { Link } from 'react-router-dom'

export function CatalogSidebar({
  categoryLinks,
  selectedCategoryId,
  sortOrder,
  onSortChange,
  onClear,
}) {
  return (
    <aside className="catalog-sidebar">
      <h3>Filtros</h3>

      <div className="catalog-filter-block">
        <p className="catalog-filter-label">Categoria</p>
        <div className="catalog-category-list">
          <Link
            to="/catalogo"
            className={`catalog-chip ${selectedCategoryId ? '' : 'active'}`}
          >
            Todas
          </Link>
          {categoryLinks.map((category) => (
            <Link
              key={category.id}
              to={`/categoria/${category.id}`}
              className={`catalog-chip ${selectedCategoryId === category.id ? 'active' : ''}`}
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="catalog-filter-block">
        <p className="catalog-filter-label">Ordenar por precio</p>
        <select value={sortOrder} onChange={(event) => onSortChange(event.target.value)}>
          <option value="none">Sin orden</option>
          <option value="price-asc">Menor a mayor</option>
          <option value="price-desc">Mayor a menor</option>
        </select>
      </div>

      <button type="button" className="btn ghost" onClick={onClear}>
        Limpiar filtros
      </button>
    </aside>
  )
}
