import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '../../../layouts/layouts'
import { ProductFilters, ProductForm, ProductsTable } from '../components/components'
import { useProductAdmin } from '../hooks/useProductAdmin'
import AdminNavbar from '../../../shared/components/AdminNavbar'

const PRODUCTS_PAGE_SIZE = 10

export function ProductAdminPage() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PAGE_SIZE)

  const {
    products,
    categories,
    telas,
    sizes,
    existingImages,
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
  } = useProductAdmin()

  const visibleProducts = useMemo(
    () => products.slice(0, visibleCount),
    [products, visibleCount]
  )
  const remainingProducts = Math.max(0, products.length - visibleProducts.length)
  const canLoadMore = remainingProducts > 0

  useEffect(() => {
    setVisibleCount(PRODUCTS_PAGE_SIZE)
  }, [products])

  async function handleSubmit(images, existingImageChanges, variantConfig) {
    const submitted = await submitForm(images, existingImageChanges, variantConfig)
    if (submitted) {
      setShowCreateForm(false)
    }
    return submitted
  }

  function handleAddProductClick() {
    if (isEditing) return
    if (showCreateForm) {
      cancelEdit()
      setShowCreateForm(false)
      return
    }
    setShowCreateForm(true)
  }

  async function handleEdit(product) {
    await startEdit(product)
    setShowCreateForm(true)
  }

  function handleCancelForm() {
    cancelEdit()
    setShowCreateForm(false)
  }

  function handleLoadMore() {
    setVisibleCount((prev) => prev + PRODUCTS_PAGE_SIZE)
  }

  return (
    <MainLayout
      navbar={<AdminNavbar />}
    >
      <div className="product-admin-page">
        {message ? <p className="alert">{message}</p> : null}

        <section className="card section-toolbar">
          <div className="actions">
            <button type="button" className="btn" onClick={handleAddProductClick}>
              {showCreateForm && !isEditing ? 'Ocultar formulario' : '+ Agregar producto'}
            </button>
          </div>
        </section>

        {showCreateForm ? (
          <ProductForm
            form={form}
            isEditing={isEditing}
            onChange={handleFormChange}
            onSubmit={handleSubmit}
            onCancel={handleCancelForm}
            categories={categories}
            telas={telas}
            sizes={sizes}
            existingImages={existingImages}
          />
        ) : (
          <>
            <ProductFilters
              filters={filters}
              categories={categories}
              onFilterChange={handleFilterChange}
              onSearch={handleSearch}
              onClear={clearFilters}
            />

            <ProductsTable
              products={visibleProducts}
              loading={loading}
              onEdit={handleEdit}
              onRemove={removeProduct}
              onToggleActive={toggleProductActive}
            />

            {!loading && products.length > 0 ? (
              <section className="card section-toolbar">
                <p>
                  Mostrando {visibleProducts.length} de {products.length} productos
                </p>
                <div className="actions">
                  {canLoadMore ? (
                    <button type="button" className="btn" onClick={handleLoadMore}>
                      Cargar mas ({remainingProducts} restantes)
                    </button>
                  ) : null}
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
    </MainLayout>
  )
}