import { MainLayout } from '../../../layouts/layouts'
import { CatalogProductGrid, CatalogSidebar } from '../components/components'
import { useProductCatalog } from '../hooks/useProductCatalog'
import HomePublicNavbar from '../../../shared/components/HomePublicNavbar'

export function ProductCatalogPage() {
  const {
    products,
    categories,
    sizes,
    telas,
    isFundasCategory,
    currentCategory,
    selectedCategoryId,
    filters,
    loading,
    message,
    handleFilterChange,
    handleNavbarSearch,
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
      navbar={(
        <HomePublicNavbar
          categories={categories}
          searchValue={filters.name}
          onSearchSubmit={handleNavbarSearch}
        />
      )}
    >
      {message ? <p className="alert">{message}</p> : null}

      <section className="catalog-layout">
        <CatalogSidebar
          filters={filters}
          sizes={sizes}
          telas={telas}
          isFundasCategory={isFundasCategory}
          onFilterChange={handleFilterChange}
          onClear={handleClearFilters}
        />

        <section className="catalog-results">
          <div className="catalog-results-toolbar">
            <label className="catalog-sort-control">
              <span>Ordenar por precio</span>
              <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
                <option value="none">Sin orden</option>
                <option value="price-asc">Menor a mayor</option>
                <option value="price-desc">Mayor a menor</option>
              </select>
            </label>
          </div>

          <CatalogProductGrid products={products} loading={loading} />
        </section>
      </section>
    </MainLayout>
  )
}
