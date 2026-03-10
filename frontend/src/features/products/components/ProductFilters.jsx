export function ProductFilters({ filters, onFilterChange, onSearch, onClear }) {
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
            placeholder="Ej: Sillon Oslo"
          />
        </label>

        <label className="field">
          <span>Categoria ID</span>
          <input
            type="number"
            min="1"
            name="categoryId"
            value={filters.categoryId}
            onChange={onFilterChange}
            placeholder="Ej: 2"
          />
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
