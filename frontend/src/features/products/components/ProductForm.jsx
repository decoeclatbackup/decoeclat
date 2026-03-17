import { useState, useEffect, useRef } from 'react'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const initialFieldErrors = {
  name: '',
  categoryId: '',
  sizeId: '',
  telaId: '',
  precio: '',
  precioOferta: '',
  enOferta: '',
  stock: '',
}

function validate(form) {
  const errors = { ...initialFieldErrors }

  if (!form.name.trim()) errors.name = 'El nombre es obligatorio'
  if (!form.categoryId) errors.categoryId = 'La categoria es obligatoria'
  return errors
}

export function ProductForm({
  form,
  isEditing,
  onChange,
  onSubmit,
  onCancel,
  categories = [],
  telas = [],
  sizes = [],
  existingImages = [],
  onRemoveExistingImage,
}) {
  const errors = validate(form)
  const hasErrors = Object.values(errors).some(Boolean)

  const parentCategories = categories.filter((category) => category.parent_id == null)
  const childCategories = categories.filter((category) => category.parent_id != null)

  const [localParentId, setLocalParentId] = useState('')
  const [localSizeTypeId, setLocalSizeTypeId] = useState('')
  const [selectedImages, setSelectedImages] = useState([])
  const [imageError, setImageError] = useState('')
  const selectedImagesRef = useRef([])

  useEffect(() => {
    selectedImagesRef.current = selectedImages
  }, [selectedImages])

  useEffect(() => {
    return () => {
      selectedImagesRef.current.forEach((image) => {
        if (image.previewUrl) {
          URL.revokeObjectURL(image.previewUrl)
        }
      })
    }
  }, [])

  useEffect(() => {
    setImageError('')
    setSelectedImages((prev) => {
      prev.forEach((image) => {
        if (image.previewUrl) {
          URL.revokeObjectURL(image.previewUrl)
        }
      })
      return []
    })
  }, [form.productId])

  // Sincronizar el select padre cuando se carga una edicion o cambian las categorias
  useEffect(() => {
    if (!form.categoryId || categories.length === 0) return
    const cat = categories.find((c) => c.categoria_id == form.categoryId)
    if (!cat) return
    const pid = cat.parent_id != null ? cat.parent_id : cat.categoria_id
    setLocalParentId(String(pid))
  }, [form.categoryId, categories])

  useEffect(() => {
    if (!form.sizeId || sizes.length === 0) return
    const size = sizes.find((s) => s.size_id == form.sizeId)
    if (!size) return
    setLocalSizeTypeId(String(size.type_id))
  }, [form.sizeId, sizes])

  const childrenOfParent = childCategories.filter((c) => c.parent_id == localParentId)
  const sizeTypes = Array.from(
    new Map(sizes.map((size) => [String(size.type_id), size.type_nombre])).entries()
  ).map(([type_id, type_nombre]) => ({ type_id, type_nombre }))
  const sizesOfType = sizes.filter((size) => String(size.type_id) === localSizeTypeId)

  function handleParentChange(e) {
    const pid = e.target.value
    setLocalParentId(pid)
    const children = childCategories.filter((c) => c.parent_id == pid)
    if (children.length === 0) {
      // Categoria padre sin subcategorias: ella misma es la categoria final
      onChange({ target: { name: 'categoryId', value: pid } })
    } else {
      // Tiene subcategorias: esperar que el usuario elija
      onChange({ target: { name: 'categoryId', value: '' } })
    }
  }

  function handleSizeTypeChange(e) {
    const selectedTypeId = e.target.value
    setLocalSizeTypeId(selectedTypeId)
    onChange({ target: { name: 'sizeId', value: '' } })
  }

  function handleImagesChange(event) {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    const invalidFile = files.find(
      (file) => !ALLOWED_IMAGE_TYPES.includes(file.type) || file.size > MAX_IMAGE_SIZE
    )

    if (invalidFile) {
      setImageError('Solo se permiten imágenes JPG, PNG o WEBP de hasta 5MB')
      event.target.value = ''
      return
    }

    setImageError('')
    setSelectedImages((prev) => {
      const nextOrderBase = prev.length
      const nextImages = files.map((file, index) => ({
        id: `${file.name}-${file.lastModified}-${index}`,
        file,
        name: file.name,
        previewUrl: URL.createObjectURL(file),
        principal: prev.length === 0 && index === 0,
        orden: nextOrderBase + index,
      }))
      return [...prev, ...nextImages]
    })

    event.target.value = ''
  }

  function updateImageField(imageId, field, value) {
    setSelectedImages((prev) =>
      prev.map((image) => {
        if (field === 'principal') {
          return { ...image, principal: image.id === imageId }
        }
        return image.id === imageId ? { ...image, [field]: value } : image
      })
    )
  }

  function removeSelectedImage(imageId) {
    setSelectedImages((prev) => {
      const imageToRemove = prev.find((image) => image.id === imageId)
      if (imageToRemove?.previewUrl) {
        URL.revokeObjectURL(imageToRemove.previewUrl)
      }

      const nextImages = prev.filter((image) => image.id !== imageId)
      if (nextImages.length > 0 && !nextImages.some((image) => image.principal)) {
        nextImages[0] = { ...nextImages[0], principal: true }
      }
      return [...nextImages]
    })
  }

  return (
    <section className="card">
      <h2>{isEditing ? 'Modificar Producto' : 'Registrar Producto'}</h2>

      <form
        className="grid three"
        onSubmit={(event) => {
          event.preventDefault()
          if (!hasErrors) {
            onSubmit(
              selectedImages.map((image) => ({
                file: image.file,
                principal: image.principal,
                orden: Number(image.orden ?? 0),
              }))
            ).then((submitted) => {
              if (submitted) {
                selectedImages.forEach((image) => {
                  if (image.previewUrl) {
                    URL.revokeObjectURL(image.previewUrl)
                  }
                })
                setSelectedImages([])
                setImageError('')
              }
            })
          }
        }}
      >
        <label className="field">
          <span>Nombre</span>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={onChange}
            placeholder="Ej: Almohadón"
            required
          />
          {errors.name ? <small className="error">{errors.name}</small> : null}
        </label>

        <label className="field">
          <span>Categoria</span>
          <select value={localParentId} onChange={handleParentChange} required>
            <option value="">Seleccionar categoria</option>
            {parentCategories.map((parent) => (
              <option key={parent.categoria_id} value={parent.categoria_id}>
                {parent.nombre}
              </option>
            ))}
          </select>
          {errors.categoryId && !localParentId ? (
            <small className="error">{errors.categoryId}</small>
          ) : null}
        </label>

        {childrenOfParent.length > 0 && (
          <label className="field">
            <span>Subcategoria</span>
            <select
              name="categoryId"
              value={form.categoryId}
              onChange={onChange}
              required
            >
              <option value="">Seleccionar subcategoria</option>
              {childrenOfParent.map((child) => (
                <option key={child.categoria_id} value={child.categoria_id}>
                  {child.nombre}
                </option>
              ))}
            </select>
            {errors.categoryId ? <small className="error">{errors.categoryId}</small> : null}
          </label>
        )}

        <label className="field">
          <span>Tipo de Medida</span>
          <select value={localSizeTypeId} onChange={handleSizeTypeChange} required>
            <option value="">Seleccionar tipo</option>
            {sizeTypes.map((type) => (
              <option key={type.type_id} value={type.type_id}>
                {type.type_nombre}
              </option>
            ))}
          </select>
          {errors.sizeId && !localSizeTypeId ? <small className="error">{errors.sizeId}</small> : null}
        </label>

        {sizesOfType.length > 0 && (
          <label className="field">
            <span>Medida</span>
            <select name="sizeId" value={form.sizeId} onChange={onChange} required>
              <option value="">Seleccionar medida</option>
              {sizesOfType.map((size) => (
                <option key={size.size_id} value={size.size_id}>
                  {size.valor}
                </option>
              ))}
            </select>
            {errors.sizeId ? <small className="error">{errors.sizeId}</small> : null}
          </label>
        )}

        <label className="field">
          <span>Tipo Tela</span>
          <select name="telaId" value={form.telaId} onChange={onChange} required>
            <option value="">Seleccionar tela</option>
            {telas.map((tela) => (
              <option key={tela.tela_id} value={tela.tela_id}>
                {tela.nombre}
              </option>
            ))}
          </select>
          {errors.telaId ? <small className="error">{errors.telaId}</small> : null}
        </label>

        <label className="field">
          <span>Precio</span>
          <input
            type="number"
            min="0"
            name="precio"
            value={form.precio}
            onChange={onChange}
            placeholder="Ej: 15000"
            required
          />
          {errors.precio ? <small className="error">{errors.precio}</small> : null}
        </label>

        <label className="field">
          <span>Stock</span>
          <input
            type="number"
            min="0"
            name="stock"
            value={form.stock}
            onChange={onChange}
            placeholder="Ej: 20"
          />
          {errors.stock ? <small className="error">{errors.stock}</small> : null}
        </label>

        <label className="field">
          <span>Descripción</span>
          <input
            type="text"
            name="description"
            value={form.description}
            onChange={onChange}
            placeholder="Opcional"
          />
        </label>

        <label className="field">
          <span>En Oferta</span>
          <input
            type="checkbox"
            name="enOferta"
            checked={form.enOferta}
            onChange={onChange}
          />
        </label>

        {form.enOferta && (
          <label className="field">
            <span>Precio Oferta</span>
            <input
              type="number"
              min="0"
              name="precioOferta"
              value={form.precioOferta}
              onChange={onChange}
              placeholder="Ej: 12000"
            />
            {errors.precioOferta ? <small className="error">{errors.precioOferta}</small> : null}
          </label>
        )}

        {isEditing && existingImages.length > 0 ? (
          <div className="field full-width">
            <span>Imágenes actuales</span>
            <div className="image-preview-grid">
              {existingImages.map((image, index) => (
                <article key={image.img_id || `${image.url}-${index}`} className="image-preview-card">
                  <img
                    src={image.url}
                    alt={`Imagen actual ${index + 1}`}
                    className="image-preview-thumb"
                  />
                  <div className="image-preview-meta">
                    <strong>{image.principal ? 'Imagen principal' : `Imagen ${index + 1}`}</strong>
                    <small>Orden: {Number(image.orden ?? 0)}</small>
                    <button
                      type="button"
                      className="btn ghost tiny"
                      onClick={() => {
                        if (!image.img_id) return
                        if (!window.confirm('¿Eliminar esta imagen del producto?')) return
                        onRemoveExistingImage?.(image.img_id)
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        <div className="field full-width">
          <span>Imágenes del producto</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleImagesChange}
          />
          <small>Formatos permitidos: JPG, PNG, WEBP. Tamaño máximo: 5MB.</small>
          {imageError ? <small className="error">{imageError}</small> : null}
        </div>

        {selectedImages.length > 0 ? (
          <div className="full-width image-preview-grid">
            {selectedImages.map((image, index) => (
              <article key={image.id} className="image-preview-card">
                <img src={image.previewUrl} alt={`Preview ${index + 1}`} className="image-preview-thumb" />
                <div className="image-preview-meta">
                  <strong>{image.name}</strong>
                  <label className="field image-order-field">
                    <span>Orden</span>
                    <input
                      type="number"
                      min="0"
                      value={image.orden}
                      onChange={(event) => updateImageField(image.id, 'orden', event.target.value)}
                    />
                  </label>
                  <label className="image-principal-toggle">
                    <input
                      type="radio"
                      name="principalImage"
                      checked={image.principal}
                      onChange={() => updateImageField(image.id, 'principal', true)}
                    />
                    Imagen principal
                  </label>
                  <button
                    type="button"
                    className="btn ghost tiny"
                    onClick={() => removeSelectedImage(image.id)}
                  >
                    Quitar
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        <div className="actions full-width">
          <button type="submit" className="btn" disabled={hasErrors}>
            {isEditing ? 'Guardar cambios' : 'Registrar'}
          </button>
          {isEditing ? (
            <button type="button" className="btn ghost" onClick={onCancel}>
              Cancelar edicion
            </button>
          ) : null}
        </div>
      </form>
    </section>
  )
}
