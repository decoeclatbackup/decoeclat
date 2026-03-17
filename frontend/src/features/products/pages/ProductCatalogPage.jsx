import { MainLayout } from '../../../layouts/layouts'
import { CatalogProductGrid, CatalogSidebar } from '../components/components'
import { useProductCatalog } from '../hooks/useProductCatalog'

export function ProductCatalogPage() {
  const {
    products,
    categoryLinks,
    currentCategory,
    selectedCategoryId,
    filters,
    loading,
    message,
    handleFilterChange,
    handleSearch,
    handleClearFilters,
    sortOrder,
    setSortOrder,
  } = useProductCatalog()

  const pageTitle = currentCategory
    ? `Catalogo: ${currentCategory.nombre}`
    : 'Catalogo de Productos'

  const pageSubtitle = 'Explora productos activos por categoria o nombre'

  return (
    <MainLayout
      title={pageTitle}
      subtitle={pageSubtitle}
    >
      {message ? <p className="alert">{message}</p> : null}

      <section className="card catalog-search-bar">
        <label className="field">
          <span>Buscar por nombre</span>
          <input
            type="text"
            name="name"
            value={filters.name}
            onChange={handleFilterChange}
            placeholder="Buscar productos..."
          />
        </label>
        <div className="actions">
          <button type="button" className="btn" onClick={() => handleSearch()}>
            Buscar
          </button>
        </div>
      </section>

      <section className="catalog-layout">
        <CatalogSidebar
          categoryLinks={categoryLinks}
          selectedCategoryId={selectedCategoryId}
          sortOrder={sortOrder}
          onSortChange={setSortOrder}
          onClear={handleClearFilters}
        />

        <CatalogProductGrid products={products} loading={loading} />
      </section>
    </MainLayout>
  )
}
