import { useState } from 'react'
import { MainLayout } from '../../../layouts/layouts'
import { ProductFilters, ProductForm, ProductsTable } from '../components/components'
import { useProductAdmin } from '../hooks/useProductAdmin'

export function ProductAdminPage() {
  const [showCreateForm, setShowCreateForm] = useState(false)

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
    removeExistingImage,
  } = useProductAdmin()

  async function handleSubmit(images) {
    const submitted = await submitForm(images)
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

  function handleEdit(product) {
    startEdit(product)
    setShowCreateForm(true)
  }

  function handleCancelForm() {
    cancelEdit()
    setShowCreateForm(false)
  }

  return (
    <MainLayout
      title="Gestionar Catalogo de Productos"
      subtitle="Pantalla administrativa para registrar, editar, activar y eliminar productos"
    >
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
          onRemoveExistingImage={removeExistingImage}
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
            products={products}
            loading={loading}
            onEdit={handleEdit}
            onRemove={removeProduct}
            onToggleActive={toggleProductActive}
          />
        </>
      )}
    </MainLayout>
  )
}