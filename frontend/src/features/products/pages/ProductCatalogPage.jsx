import { MainLayout } from '../../../layouts/layouts'
import { ProductFilters, ProductForm, ProductsTable } from '../components/components'
import { useProductCatalog } from '../hooks/productHooks'

export function ProductCatalogPage() {
  const {
    products,
    categories,
    telas,
    sizes,
    filters,
    form,
    loading,
    message,
    isEditing,
    handleFilterChange,
    handleFormChange,
    handleSearch,
    clearFilters,
    submitForm,
    startEdit,
    cancelEdit,
    removeProduct,
    toggleProductActive,
  } = useProductCatalog()

  return (
    <MainLayout
      title="Gestionar Catalogo de Productos (RG)"
      subtitle="Modelo base para registrar, consultar, modificar y dar de baja productos"
    >
      {message ? <p className="alert">{message}</p> : null}

      <ProductForm
        form={form}
        isEditing={isEditing}
        onChange={handleFormChange}
        onSubmit={submitForm}
        onCancel={cancelEdit}
        categories={categories}
        telas={telas}
        sizes={sizes}
      />

      <ProductFilters
        filters={filters}
        categories={categories}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        onClear={clearFilters}
      />

      <ProductsTable
        products={products}
        loading={loading}
        onEdit={startEdit}
        onRemove={removeProduct}
        onToggleActive={toggleProductActive}
      />
    </MainLayout>
  )
}
