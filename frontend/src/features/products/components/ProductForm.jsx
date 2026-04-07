import { useState, useEffect, useMemo, useRef } from 'react'

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

function normalizeStockValue(rawValue, fallback = 0) {
  const parsed = Number(rawValue)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return Math.max(0, Math.trunc(Number(fallback) || 0))
  }
  return Math.trunc(parsed)
}

function normalizePriceValue(rawValue, fallback = 0) {
  const parsed = Number(rawValue)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return Math.max(0, Number(fallback) || 0)
  }
  return parsed
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function formatSizeLabel(value) {
  const rawLabel = String(value || '').trim()
  if (normalizeText(rawLabel) === 'talle unico') return 'Medida única'
  return rawLabel
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
}) {
  const errors = validate(form)
  const hasErrors = Object.values(errors).some(Boolean)
  const title = isEditing ? `Editar producto #${form.productId}` : 'Registrar producto'

  const parentCategories = categories.filter((category) => category.parent_id == null)
  const childCategories = categories.filter((category) => category.parent_id != null)

  const [localParentId, setLocalParentId] = useState('')
  const [localSizeTypeId, setLocalSizeTypeId] = useState('')
  const [selectedImages, setSelectedImages] = useState([])
  const [imageError, setImageError] = useState('')
  const [existingImagesDraft, setExistingImagesDraft] = useState([])
  const [removedExistingImageIds, setRemovedExistingImageIds] = useState([])
  const [existingOrderDrafts, setExistingOrderDrafts] = useState({})
  const [multiSizeVariants, setMultiSizeVariants] = useState({})
  const [draggingExistingImageId, setDraggingExistingImageId] = useState(null)
  const [dragOverExistingImageId, setDragOverExistingImageId] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedSizes, setExpandedSizes] = useState({})
  const [comboPriceMode, setComboPriceMode] = useState('single')
  const [comboVariants, setComboVariants] = useState({
    sinRellenoStock: '',
    sinRellenoPrecio: '',
    sinRellenoPrecioOferta: '',
    conRellenoStock: '',
    conRellenoPrecio: '',
    conRellenoPrecioOferta: '',
  })
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
    setExistingOrderDrafts({})
    setExistingImagesDraft([])
    setRemovedExistingImageIds([])
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

  useEffect(() => {
    const sortedImages = [...existingImages].sort(
      (left, right) => Number(left.orden ?? 0) - Number(right.orden ?? 0)
    )

    setExistingImagesDraft(sortedImages)

    const nextDrafts = {}
    sortedImages.forEach((image) => {
      if (image?.img_id != null) {
        nextDrafts[image.img_id] = String(Number(image.orden ?? 0))
      }
    })
    setExistingOrderDrafts(nextDrafts)
  }, [existingImages])

  const childrenOfParent = childCategories.filter((c) => c.parent_id == localParentId)
  const selectedSubcategoryValue = childrenOfParent.some(
    (child) => String(child.categoria_id) === String(form.categoryId)
  )
    ? String(form.categoryId)
    : ''

  const sortedExistingImages = [...existingImagesDraft].sort(
    (left, right) => Number(left.orden ?? 0) - Number(right.orden ?? 0)
  )

  const sortedSelectedImages = [...selectedImages].sort(
    (left, right) => Number(left.orden ?? 0) - Number(right.orden ?? 0)
  )

  const sizeTypes = useMemo(
    () => Array.from(
      new Map(sizes.map((size) => [String(size.type_id), size.type_nombre])).entries()
    ).map(([type_id, type_nombre]) => ({ type_id, type_nombre })),
    [sizes]
  )

  const sizesOfType = useMemo(
    () => sizes.filter((size) => String(size.type_id) === localSizeTypeId),
    [sizes, localSizeTypeId]
  )
  const selectedSizeType = sizeTypes.find((type) => String(type.type_id) === String(localSizeTypeId))
  const isPillowSizeType = String(selectedSizeType?.type_nombre || '').toLowerCase().includes('almohad')
  const selectedCategory = categories.find((category) => String(category.categoria_id) === String(form.categoryId))
  const isComboCategory = normalizeText(selectedCategory?.nombre).includes('combo')

  const comboDefaultSize = useMemo(() => {
    if (!Array.isArray(sizes) || sizes.length === 0) return null

    const byUniqueName = sizes.find((size) => normalizeText(size?.valor).includes('unico'))
    if (byUniqueName) return byUniqueName

    const byUniqueType = sizes.find((size) => normalizeText(size?.type_nombre).includes('unico'))
    if (byUniqueType) return byUniqueType

    return sizes[0]
  }, [sizes])

  useEffect(() => {
    if (!isPillowSizeType) {
      setMultiSizeVariants({})
      return
    }

    const variantStocks = Array.isArray(form.variantStocks) ? form.variantStocks : []
    const variantBySizeAndFill = new Map(
      variantStocks
        .map((item) => ({
          sizeId: Number(item?.sizeId ?? item?.size_id),
          relleno: Boolean(item?.relleno),
          stock: normalizeStockValue(item?.stock, 0),
          precio: normalizePriceValue(item?.precio, 0),
          precioOferta: normalizePriceValue(item?.precioOferta ?? item?.precio_oferta, 0),
          enOferta: Boolean(item?.enOferta ?? item?.en_oferta),
        }))
        .filter((item) => Number.isInteger(item.sizeId) && item.sizeId > 0)
        .map((item) => [`${item.sizeId}-${item.relleno}`, item])
    )

    const nextVariants = {}
    sizesOfType.forEach((size) => {
      const sizeId = Number(size.size_id)
      const sinRelleno = variantBySizeAndFill.get(`${sizeId}-false`)
      const conRelleno = variantBySizeAndFill.get(`${sizeId}-true`)

      nextVariants[size.size_id] = {
        sinRellenoStock: sinRelleno ? String(sinRelleno.stock) : '',
        sinRellenoPrecio: sinRelleno && sinRelleno.precio > 0
          ? String(sinRelleno.precio)
          : (form.precio ? String(form.precio) : ''),
        sinRellenoPrecioOferta: sinRelleno && sinRelleno.enOferta && sinRelleno.precioOferta > 0
          ? String(sinRelleno.precioOferta)
          : (form.precioOferta ? String(form.precioOferta) : ''),
        conRellenoStock: conRelleno ? String(conRelleno.stock) : '',
        conRellenoPrecio: conRelleno && conRelleno.precio > 0 ? String(conRelleno.precio) : '',
        conRellenoPrecioOferta: conRelleno && conRelleno.enOferta && conRelleno.precioOferta > 0
          ? String(conRelleno.precioOferta)
          : '',
      }
    })

    setMultiSizeVariants(nextVariants)
  }, [form.precio, form.productId, form.variantStocks, isPillowSizeType, sizesOfType])

  useEffect(() => {
    if (!isComboCategory) {
      setComboPriceMode('single')
      setComboVariants({
        sinRellenoStock: '',
        sinRellenoPrecio: '',
        sinRellenoPrecioOferta: '',
        conRellenoStock: '',
        conRellenoPrecio: '',
        conRellenoPrecioOferta: '',
      })
      return
    }

    if (comboDefaultSize?.type_id != null) {
      const nextTypeId = String(comboDefaultSize.type_id)
      if (String(localSizeTypeId) !== nextTypeId) {
        setLocalSizeTypeId(nextTypeId)
      }
    }

    if (comboDefaultSize?.size_id != null && String(form.sizeId || '') !== String(comboDefaultSize.size_id)) {
      onChange({ target: { name: 'sizeId', value: String(comboDefaultSize.size_id) } })
    }

    const variantStocks = Array.isArray(form.variantStocks) ? form.variantStocks : []
    const hasSinRelleno = variantStocks.some((variant) => Boolean(variant?.relleno) === false)
    const hasConRelleno = variantStocks.some((variant) => Boolean(variant?.relleno) === true)
    const nextMode = hasSinRelleno && hasConRelleno ? 'fill-options' : 'single'
    setComboPriceMode(nextMode)

    const sinRelleno = variantStocks.find((variant) => Boolean(variant?.relleno) === false)
    const conRelleno = variantStocks.find((variant) => Boolean(variant?.relleno) === true)

    setComboVariants({
      sinRellenoStock: sinRelleno ? String(normalizeStockValue(sinRelleno.stock, 0)) : '',
      sinRellenoPrecio: sinRelleno && Number(sinRelleno.precio) > 0
        ? String(normalizePriceValue(sinRelleno.precio, 0))
        : '',
      sinRellenoPrecioOferta: sinRelleno && Boolean(sinRelleno.enOferta) && Number(sinRelleno.precioOferta) > 0
        ? String(normalizePriceValue(sinRelleno.precioOferta, 0))
        : '',
      conRellenoStock: conRelleno ? String(normalizeStockValue(conRelleno.stock, 0)) : '',
      conRellenoPrecio: conRelleno && Number(conRelleno.precio) > 0
        ? String(normalizePriceValue(conRelleno.precio, 0))
        : '',
      conRellenoPrecioOferta: conRelleno && Boolean(conRelleno.enOferta) && Number(conRelleno.precioOferta) > 0
        ? String(normalizePriceValue(conRelleno.precioOferta, 0))
        : '',
    })
  }, [
    comboDefaultSize,
    form.sizeId,
    form.variantStocks,
    isComboCategory,
    localSizeTypeId,
  ])

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
    onChange({ target: { name: 'stock', value: '' } })
  }

  function handleMultiSizeVariantChange(sizeId, field, value) {
    setMultiSizeVariants((prev) => ({
      ...prev,
      [sizeId]: {
        ...(prev[sizeId] || {}),
        [field]: value,
      },
    }))
  }

  function handleComboVariantChange(field, value) {
    setComboVariants((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  function toggleExpandedSize(sizeId) {
    setExpandedSizes((prev) => ({
      ...prev,
      [sizeId]: !prev[sizeId],
    }))
  }

  function buildVariantStocksPayload() {
    if (isComboCategory) {
      const comboSizeId = Number(comboDefaultSize?.size_id || form.sizeId)
      if (!Number.isInteger(comboSizeId) || comboSizeId <= 0) return []

      if (comboPriceMode === 'single') {
        const singlePrice = normalizePriceValue(form.precio, 0)
        if (singlePrice <= 0) return []

        return [{
          sizeId: comboSizeId,
          relleno: false,
          stock: normalizeStockValue(form.stock, 0),
          precio: singlePrice,
          precioOferta: form.enOferta ? normalizePriceValue(form.precioOferta, 0) : null,
          enOferta: Boolean(form.enOferta),
        }]
      }

      const variants = []

      const sinPriceRaw = String(comboVariants.sinRellenoPrecio ?? '').trim()
      if (sinPriceRaw !== '') {
        const sinPrice = normalizePriceValue(sinPriceRaw, 0)
        if (sinPrice > 0) {
          variants.push({
            sizeId: comboSizeId,
            relleno: false,
            stock: normalizeStockValue(comboVariants.sinRellenoStock, 0),
            precio: sinPrice,
            precioOferta: form.enOferta ? normalizePriceValue(comboVariants.sinRellenoPrecioOferta, 0) : null,
            enOferta: Boolean(form.enOferta),
          })
        }
      }

      const conPriceRaw = String(comboVariants.conRellenoPrecio ?? '').trim()
      if (conPriceRaw !== '') {
        const conPrice = normalizePriceValue(conPriceRaw, 0)
        if (conPrice > 0) {
          variants.push({
            sizeId: comboSizeId,
            relleno: true,
            stock: normalizeStockValue(comboVariants.conRellenoStock, 0),
            precio: conPrice,
            precioOferta: form.enOferta ? normalizePriceValue(comboVariants.conRellenoPrecioOferta, 0) : null,
            enOferta: Boolean(form.enOferta),
          })
        }
      }

      return variants
    }

    if (!isPillowSizeType) return []

    return sizesOfType
      .map((size) => {
        const sizeId = Number(size.size_id)
        const row = multiSizeVariants[size.size_id] || {}
        const variants = []

        const sinPriceRaw = String(row.sinRellenoPrecio ?? '').trim()
        if (sinPriceRaw !== '') {
          const sinPrice = normalizePriceValue(sinPriceRaw, 0)
          if (sinPrice > 0) {
            variants.push({
              sizeId,
              relleno: false,
              stock: normalizeStockValue(row.sinRellenoStock, 0),
              precio: sinPrice,
              precioOferta: form.enOferta ? normalizePriceValue(row.sinRellenoPrecioOferta, 0) : null,
              enOferta: Boolean(form.enOferta),
            })
          }
        }

        const conPriceRaw = String(row.conRellenoPrecio ?? '').trim()
        if (conPriceRaw !== '') {
          const conPrice = normalizePriceValue(conPriceRaw, 0)
          if (conPrice > 0) {
            variants.push({
              sizeId,
              relleno: true,
              stock: normalizeStockValue(row.conRellenoStock, 0),
              precio: conPrice,
              precioOferta: form.enOferta ? normalizePriceValue(row.conRellenoPrecioOferta, 0) : null,
              enOferta: Boolean(form.enOferta),
            })
          }
        }

        return variants
      })
      .flat()
      .filter(Boolean)
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

  function handleExistingOrderInputChange(imageId, value) {
    setExistingOrderDrafts((prev) => ({
      ...prev,
      [imageId]: value,
    }))
  }

  function commitExistingOrder(image) {
    if (!image?.img_id) return

    const currentOrder = Number(image.orden ?? 0)
    const rawValue = existingOrderDrafts[image.img_id]
    const parsedValue = Number(rawValue)
    const normalizedOrder = Number.isFinite(parsedValue) && parsedValue >= 0
      ? Math.trunc(parsedValue)
      : currentOrder

    setExistingOrderDrafts((prev) => ({
      ...prev,
      [image.img_id]: String(normalizedOrder),
    }))

    if (normalizedOrder === currentOrder) return
    setExistingImagesDraft((prev) => prev.map((item) => {
      if (item.img_id !== image.img_id) return item
      return {
        ...item,
        orden: normalizedOrder,
      }
    }))
  }

  function persistExistingImagesOrder(reorderedImages = []) {
    const normalizedImages = reorderedImages.map((image, index) => ({
      ...image,
      orden: index,
    }))

    const nextDrafts = normalizedImages.reduce((acc, image) => {
      if (image?.img_id != null) {
        acc[image.img_id] = String(Number(image.orden ?? 0))
      }
      return acc
    }, {})

    setExistingOrderDrafts(nextDrafts)
    setExistingImagesDraft(normalizedImages)
  }

  function handleExistingImageDragStart(event, imageId) {
    if (!imageId) return
    setDraggingExistingImageId(imageId)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(imageId))
  }

  function handleExistingImageDragOver(event, imageId) {
    if (!draggingExistingImageId || draggingExistingImageId === imageId) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    if (dragOverExistingImageId !== imageId) {
      setDragOverExistingImageId(imageId)
    }
  }

  function handleExistingImageDrop(event, targetImageId) {
    event.preventDefault()

    const sourceImageId = draggingExistingImageId || Number(event.dataTransfer.getData('text/plain'))
    if (!sourceImageId || sourceImageId === targetImageId) {
      setDraggingExistingImageId(null)
      setDragOverExistingImageId(null)
      return
    }

    const sourceIndex = sortedExistingImages.findIndex((image) => image.img_id === sourceImageId)
    const targetIndex = sortedExistingImages.findIndex((image) => image.img_id === targetImageId)

    if (sourceIndex < 0 || targetIndex < 0) {
      setDraggingExistingImageId(null)
      setDragOverExistingImageId(null)
      return
    }

    const reordered = [...sortedExistingImages]
    const [movedImage] = reordered.splice(sourceIndex, 1)
    reordered.splice(targetIndex, 0, movedImage)

    setDragOverExistingImageId(null)
    setDraggingExistingImageId(null)
    persistExistingImagesOrder(reordered)
  }

  function handleExistingImageDragEnd() {
    setDraggingExistingImageId(null)
    setDragOverExistingImageId(null)
  }

  function moveExistingImage(imageId, direction) {

    const currentIndex = sortedExistingImages.findIndex((image) => image.img_id === imageId)
    const targetIndex = currentIndex + direction

    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= sortedExistingImages.length) return

    const reordered = [...sortedExistingImages]
    const [movedImage] = reordered.splice(currentIndex, 1)
    reordered.splice(targetIndex, 0, movedImage)

    persistExistingImagesOrder(reordered)
  }

  function removeExistingImage(image) {
    if (!image?.img_id) return

    setExistingImagesDraft((prev) => prev.filter((item) => item.img_id !== image.img_id))
    setRemovedExistingImageIds((prev) => {
      if (prev.includes(image.img_id)) return prev
      return [...prev, image.img_id]
    })
    setExistingOrderDrafts((prev) => {
      const next = { ...prev }
      delete next[image.img_id]
      return next
    })
  }

  function normalizeExistingImagesForSave(images = []) {
    return images
      .filter((image) => image?.img_id != null)
      .map((image, index) => ({
        img_id: image.img_id,
        orden: index,
      }))
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
    <section className="card product-form-card">
      <h2 className="product-form-title">{title}</h2>

      <form
        className={`grid three product-form-grid ${isEditing ? 'is-editing' : ''}`}
        onSubmit={async (event) => {
          event.preventDefault()
          if (hasErrors || isSubmitting) return

          setIsSubmitting(true)

          try {
            const variantStocks = buildVariantStocksPayload()
            const submitted = await onSubmit(
              selectedImages.map((image) => ({
                file: image.file,
                principal: image.principal,
                orden: Number(image.orden ?? 0),
              })),
              {
                existingImages: normalizeExistingImagesForSave(sortedExistingImages),
                removedImageIds: [...removedExistingImageIds],
              },
              {
                variantStocks,
              }
            )

            if (submitted) {
              selectedImages.forEach((image) => {
                if (image.previewUrl) {
                  URL.revokeObjectURL(image.previewUrl)
                }
              })
              setSelectedImages([])
              setImageError('')
              setRemovedExistingImageIds([])
            }
          } finally {
            setIsSubmitting(false)
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
              key={localParentId || 'no-parent'}
              name="categoryId"
              value={selectedSubcategoryValue}
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

        <label className="field full-width">
          <span>Descripción</span>
          <textarea
            name="description"
            value={form.description}
            onChange={onChange}
            placeholder="Opcional"
            rows={4}
          />
        </label>

        {!isComboCategory ? (
          <label className="field">
            <span>Tipo de medida</span>
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
        ) : null}

        {sizesOfType.length > 0 && !isPillowSizeType && !isComboCategory ? (
          <label className="field">
            <span>Medida</span>
            <select name="sizeId" value={form.sizeId} onChange={onChange} required>
              <option value="">Seleccionar medida</option>
              {sizesOfType.map((size) => (
                <option key={size.size_id} value={size.size_id}>
                  {formatSizeLabel(size.valor)}
                </option>
              ))}
            </select>
            {errors.sizeId ? <small className="error">{errors.sizeId}</small> : null}
          </label>
        ) : null}

        {sizesOfType.length > 0 && isPillowSizeType && !isComboCategory ? (
          <div className="field full-width">
            <span>Medidas, stock y precio (con o sin relleno)</span>
            <div className="size-stock-grid">
              {sizesOfType.map((size) => (
                <div key={size.size_id} className={`size-stock-item ${expandedSizes[size.size_id] ? 'expanded' : ''}`}>
                  <button
                    type="button"
                    className="size-stock-toggle"
                    onClick={() => toggleExpandedSize(size.size_id)}
                    aria-expanded={expandedSizes[size.size_id]}
                    aria-label={`${expandedSizes[size.size_id] ? 'Contraer' : 'Expandir'} medida ${formatSizeLabel(size.valor)}`}
                  >
                    <span className="size-stock-toggle-text">{formatSizeLabel(size.valor)}</span>
                    <span className="size-stock-toggle-icon" aria-hidden="true">
                      {expandedSizes[size.size_id] ? '▾' : '▸'}
                    </span>
                  </button>

                  {expandedSizes[size.size_id] ? (
                    <div className="size-stock-fields">
                      <small>Sin relleno</small>
                      <input
                        type="number"
                        min="0"
                        value={multiSizeVariants[size.size_id]?.sinRellenoStock ?? ''}
                        onChange={(event) => handleMultiSizeVariantChange(size.size_id, 'sinRellenoStock', event.target.value)}
                        placeholder="Stock sin relleno"
                        disabled={isSubmitting}
                      />
                      <input
                        type="number"
                        min="0"
                        value={multiSizeVariants[size.size_id]?.sinRellenoPrecio ?? ''}
                        onChange={(event) => handleMultiSizeVariantChange(size.size_id, 'sinRellenoPrecio', event.target.value)}
                        placeholder="Precio sin relleno"
                        disabled={isSubmitting}
                      />
                      {form.enOferta ? (
                        <input
                          type="number"
                          min="0"
                          value={multiSizeVariants[size.size_id]?.sinRellenoPrecioOferta ?? ''}
                          onChange={(event) => handleMultiSizeVariantChange(size.size_id, 'sinRellenoPrecioOferta', event.target.value)}
                          placeholder="Oferta sin relleno"
                          disabled={isSubmitting}
                        />
                      ) : null}

                      <small>Con relleno</small>
                      <input
                        type="number"
                        min="0"
                        value={multiSizeVariants[size.size_id]?.conRellenoStock ?? ''}
                        onChange={(event) => handleMultiSizeVariantChange(size.size_id, 'conRellenoStock', event.target.value)}
                        placeholder="Stock con relleno"
                        disabled={isSubmitting}
                      />
                      <input
                        type="number"
                        min="0"
                        value={multiSizeVariants[size.size_id]?.conRellenoPrecio ?? ''}
                        onChange={(event) => handleMultiSizeVariantChange(size.size_id, 'conRellenoPrecio', event.target.value)}
                        placeholder="Precio con relleno"
                        disabled={isSubmitting}
                      />
                      {form.enOferta ? (
                        <input
                          type="number"
                          min="0"
                          value={multiSizeVariants[size.size_id]?.conRellenoPrecioOferta ?? ''}
                          onChange={(event) => handleMultiSizeVariantChange(size.size_id, 'conRellenoPrecioOferta', event.target.value)}
                          placeholder="Oferta con relleno"
                          disabled={isSubmitting}
                        />
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <label className="field">
          <span>Tipo de tela</span>
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

        {isComboCategory ? (
          <div className="field full-width product-form-combo-mode">
            <span className="product-form-combo-title">Precio para combos</span>
            <div className="product-form-combo-mode-options" role="radiogroup" aria-label="Modo de precio para combos">
              <label className={`product-form-combo-option ${comboPriceMode === 'single' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="comboPriceMode"
                  checked={comboPriceMode === 'single'}
                  onChange={() => setComboPriceMode('single')}
                  disabled={isSubmitting}
                />
                <span>Precio solo</span>
              </label>

              <label className={`product-form-combo-option ${comboPriceMode === 'fill-options' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="comboPriceMode"
                  checked={comboPriceMode === 'fill-options'}
                  onChange={() => setComboPriceMode('fill-options')}
                  disabled={isSubmitting}
                />
                <span>Con relleno / Sin relleno</span>
              </label>
            </div>
          </div>
        ) : null}

        {!isPillowSizeType && (!isComboCategory || comboPriceMode === 'single') ? (
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
        ) : null}

        {!isPillowSizeType && (!isComboCategory || comboPriceMode === 'single') ? (
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
        ) : null}

        {isComboCategory && comboPriceMode === 'fill-options' ? (
          <div className="field full-width product-form-combo-variants">
            <span className="product-form-combo-title">Stock y precio por opción de relleno</span>
            <div className="product-form-combo-variants-grid">
              <div className="product-form-combo-variant-card">
                <small className="product-form-combo-variant-heading">Sin relleno</small>
                <input
                  type="number"
                  min="0"
                  value={comboVariants.sinRellenoStock}
                  onChange={(event) => handleComboVariantChange('sinRellenoStock', event.target.value)}
                  placeholder="Stock sin relleno"
                  disabled={isSubmitting}
                />
                <input
                  type="number"
                  min="0"
                  value={comboVariants.sinRellenoPrecio}
                  onChange={(event) => handleComboVariantChange('sinRellenoPrecio', event.target.value)}
                  placeholder="Precio sin relleno"
                  disabled={isSubmitting}
                />
                {form.enOferta ? (
                  <input
                    type="number"
                    min="0"
                    value={comboVariants.sinRellenoPrecioOferta}
                    onChange={(event) => handleComboVariantChange('sinRellenoPrecioOferta', event.target.value)}
                    placeholder="Oferta sin relleno"
                    disabled={isSubmitting}
                  />
                ) : null}
              </div>

              <div className="product-form-combo-variant-card">
                <small className="product-form-combo-variant-heading">Con relleno</small>
                <input
                  type="number"
                  min="0"
                  value={comboVariants.conRellenoStock}
                  onChange={(event) => handleComboVariantChange('conRellenoStock', event.target.value)}
                  placeholder="Stock con relleno"
                  disabled={isSubmitting}
                />
                <input
                  type="number"
                  min="0"
                  value={comboVariants.conRellenoPrecio}
                  onChange={(event) => handleComboVariantChange('conRellenoPrecio', event.target.value)}
                  placeholder="Precio con relleno"
                  disabled={isSubmitting}
                />
                {form.enOferta ? (
                  <input
                    type="number"
                    min="0"
                    value={comboVariants.conRellenoPrecioOferta}
                    onChange={(event) => handleComboVariantChange('conRellenoPrecioOferta', event.target.value)}
                    placeholder="Oferta con relleno"
                    disabled={isSubmitting}
                  />
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <div className="field" style={{ gap: '0.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontWeight: 500, color: '#20363b' }}>
            <input
              type="checkbox"
              name="enOferta"
              checked={form.enOferta}
              onChange={onChange}
            />
            <span>En Oferta</span>
          </label>
        </div>

        {form.enOferta && !isPillowSizeType && (!isComboCategory || comboPriceMode === 'single') ? (
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
        ) : null}

        {isEditing && sortedExistingImages.length > 0 ? (
          <div className="field full-width">
            <span>Imágenes actuales</span>
            <div className="image-preview-grid">
              {sortedExistingImages.map((image, index) => (
                <article
                  key={image.img_id || `${image.url}-${index}`}
                  className={`image-preview-card draggable-image-card ${draggingExistingImageId === image.img_id ? 'dragging' : ''} ${dragOverExistingImageId === image.img_id ? 'drag-over' : ''}`}
                  draggable={Boolean(image.img_id) && !isSubmitting}
                  onDragStart={(event) => handleExistingImageDragStart(event, image.img_id)}
                  onDragOver={(event) => handleExistingImageDragOver(event, image.img_id)}
                  onDrop={(event) => handleExistingImageDrop(event, image.img_id)}
                  onDragEnd={handleExistingImageDragEnd}
                >
                  <img
                    src={image.url}
                    alt={`Imagen actual ${index + 1}`}
                    className="image-preview-thumb"
                  />
                  <div className="image-preview-meta">
                    <small>Arrastrar para reordenar</small>
                    <strong>{image.principal ? 'Imagen principal' : `Imagen ${index + 1}`}</strong>
                    <label className="field image-order-field">
                      <span>Orden</span>
                      <input
                        type="number"
                        min="0"
                        value={existingOrderDrafts[image.img_id] ?? String(Number(image.orden ?? 0))}
                        onChange={(event) => handleExistingOrderInputChange(image.img_id, event.target.value)}
                        onBlur={() => commitExistingOrder(image)}
                        disabled={isSubmitting}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.currentTarget.blur()
                          }
                        }}
                      />
                    </label>
                    <div className="image-order-actions">
                      <button
                        type="button"
                        className="btn ghost tiny"
                        onClick={() => moveExistingImage(image.img_id, -1)}
                        disabled={index === 0 || isSubmitting}
                        aria-label="Mover imagen hacia arriba"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="btn ghost tiny"
                        onClick={() => moveExistingImage(image.img_id, 1)}
                        disabled={index === sortedExistingImages.length - 1 || isSubmitting}
                        aria-label="Mover imagen hacia abajo"
                      >
                        ↓
                      </button>
                    </div>
                    <button
                      type="button"
                      className="btn ghost tiny"
                      disabled={isSubmitting}
                      onClick={() => {
                        if (!image.img_id) return
                        if (!window.confirm('¿Eliminar esta imagen del producto?')) return
                        removeExistingImage(image)
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
          <span>Agregar nuevas imágenes</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleImagesChange}
            disabled={isSubmitting}
          />
          <small>Formatos permitidos: JPG, PNG, WEBP. Tamaño máximo: 5MB.</small>
          {imageError ? <small className="error">{imageError}</small> : null}
        </div>

        {sortedSelectedImages.length > 0 ? (
          <div className="full-width image-preview-grid">
            {sortedSelectedImages.map((image, index) => (
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
                      disabled={isSubmitting}
                    />
                  </label>
                  <label className="image-principal-toggle">
                    <input
                      type="radio"
                      name="principalImage"
                      checked={image.principal}
                      onChange={() => updateImageField(image.id, 'principal', true)}
                      disabled={isSubmitting}
                    />
                    Imagen principal
                  </label>
                  <button
                    type="button"
                    className="btn ghost tiny"
                    disabled={isSubmitting}
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
          <button type="submit" className="btn" disabled={hasErrors || isSubmitting}>
            {isSubmitting ? (isEditing ? 'Guardando...' : 'Registrando...') : (isEditing ? 'Guardar cambios' : 'Registrar')}
          </button>
          {isEditing ? (
            <button type="button" className="btn ghost" onClick={onCancel} disabled={isSubmitting}>
              Cancelar edicion
            </button>
          ) : null}
        </div>
      </form>
    </section>
  )
}
