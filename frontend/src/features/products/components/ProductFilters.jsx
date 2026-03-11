export function ProductFilters({ filters, categories = [], onFilterChange, onSearch, onClear }) {
  return (
    <section className="card">
      <h2>Consultar Producto</h2>
      <div className="grid two">
        <label className="field">
          <span>Nombre</span>
          <input
            type="text"
            name="name"
            value={filters.name}
            onChange={onFilterChange}
            placeholder="Ej: Almohadón"
          />
        </label>

        <label className="field">
          <span>Categoría</span>
          <select
            name="categoryId"
            value={filters.categoryId}
            onChange={onFilterChange}
          >
            <option value="">Todas</option>
            {categories.map((category) => (
              <option key={category.categoria_id} value={category.categoria_id}>
                {category.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="actions">
        <button type="button" className="btn" onClick={onSearch}>
          Buscar
        </button>
        <button type="button" className="btn ghost" onClick={onClear}>
          Limpiar filtros
        </button>
      </div>
    </section>
  )
}
