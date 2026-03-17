export function CatalogSidebar({
  filters,
  sizes,
  telas,
  isFundasCategory,
  onFilterChange,
  onClear,
}) {
  function applyFilter(name, value) {
    onFilterChange({
      target: {
        name,
        value,
      },
    })
  }

  return (
    <aside className="catalog-sidebar">
      <h3>Filtros</h3>

      {isFundasCategory ? (
        <div className="catalog-filter-block">
          <p className="catalog-filter-label">Medidas</p>
          <div className="catalog-filter-buttons">
            <button
              type="button"
              className={`catalog-filter-btn ${!filters.sizeId ? 'active' : ''}`}
              onClick={() => applyFilter('sizeId', '')}
            >
              Todos
            </button>
            {sizes.map((size) => (
              <button
                key={size.size_id}
                type="button"
                className={`catalog-filter-btn ${String(filters.sizeId) === String(size.size_id) ? 'active' : ''}`}
                onClick={() => applyFilter('sizeId', String(size.size_id))}
              >
                {size.valor}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="catalog-filter-block">
        <p className="catalog-filter-label">Tipo de tela</p>
        <div className="catalog-filter-buttons">
          <button
            type="button"
            className={`catalog-filter-btn ${!filters.telaId ? 'active' : ''}`}
            onClick={() => applyFilter('telaId', '')}
          >
            Todas
          </button>
          {telas.map((tela) => (
            <button
              key={tela.tela_id}
              type="button"
              className={`catalog-filter-btn ${String(filters.telaId) === String(tela.tela_id) ? 'active' : ''}`}
              onClick={() => applyFilter('telaId', String(tela.tela_id))}
            >
              {tela.nombre}
            </button>
          ))}
        </div>
      </div>

      <button type="button" className="btn ghost" onClick={onClear}>
        Limpiar filtros
      </button>
    </aside>
  )
}
