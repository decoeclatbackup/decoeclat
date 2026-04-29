import { useState, useEffect, useMemo, useRef } from 'react'
import { MAX_IMAGE_UPLOAD_SIZE_LABEL, getImageUploadError } from '../../../shared/utils/utils'
const PRODUCT_COLOR_OPTIONS = [
  'Beige',
  'Arena',
  'Avellana',
  'Khaki',
  'Blanco',
  'Negro',
  'Gris Perla',
  'Gris Aero',
  'Gris Acero',
  'Azul Aero',
  'Azul Acero',
  'Verde',
  'Rosa',
  'Canela',
  'Amarillo',
  'Chocolate',
]
const PRODUCT_COLOR_HEX = {
  Beige: '#d8c3a5',
  Arena: '#c2b280',
  Avellana: '#8b6f47',
  Khaki: '#bdb76b',
  Blanco: '#f7f7f2',
  Negro: '#1f1f1f',
  'Gris Perla': '#d9d9d9',
  'Gris Aero': '#9aa8b0',
  'Gris Acero': '#6e7b82',
  'Azul Aero': '#7fa6c2',
  'Azul Acero': '#4f6d82',
  Verde: '#6b8f71',
  Rosa: '#d89ca4',
  Canela: '#8b5a3c',
  Amarillo: '#e7c84b',
  Chocolate: '#5a3a29',
}

function buildColorStockDrafts(variants = [], selectedColors = [], fallbackStock = '') {
  const stockByColor = new Map()

  variants.forEach((variant) => {
    const colorName = String(variant?.color || '').trim()
    if (!colorName) return

    const normalizedColor = normalizeColorKey(colorName)
    if (!stockByColor.has(normalizedColor)) {
      stockByColor.set(normalizedColor, String(normalizeStockValue(variant?.stock, 0)))
    }
  })

  return selectedColors.reduce((acc, colorName) => {
    const normalizedColor = normalizeColorKey(colorName)
    acc[colorName] = stockByColor.get(normalizedColor) ?? String(fallbackStock ?? '')
    return acc
  }, {})
}

function shallowEqualColorStocks(left = {}, right = {}) {
  const leftKeys = Object.keys(left)
  const rightKeys = Object.keys(right)

  if (leftKeys.length !== rightKeys.length) return false

  return leftKeys.every((key) => String(left[key] ?? '') === String(right[key] ?? ''))
}

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

function normalizeColorKey(value) {
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
  // Estado para combinaciones medida+color+relleno
  const [sizeColorFillVariants, setSizeColorFillVariants] = useState({})
  const [colorStocks, setColorStocks] = useState({})
  const [draggingExistingImageId, setDraggingExistingImageId] = useState(null)
  const [dragOverExistingImageId, setDragOverExistingImageId] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedSizes, setExpandedSizes] = useState({})
  const [isMobileColorsExpanded, setIsMobileColorsExpanded] = useState(false)
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
    setColorStocks({})
    setSelectedImages((prev) => {
      prev.forEach((image) => {
        if (image.previewUrl) {
          URL.revokeObjectURL(image.previewUrl)
        }
      })
      return []
    })
  }, [form.productId])

  useEffect(() => {
    setIsMobileColorsExpanded(false)
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
  const selectedColors = useMemo(
    () => (Array.isArray(form.selectedColors) ? form.selectedColors.filter(Boolean) : []),
    [form.selectedColors]
  )

  useEffect(() => {
    if (isPillowSizeType || isComboCategory) {
      setColorStocks((prev) => (Object.keys(prev).length === 0 ? prev : {}))
      return
    }

    const nextDrafts = buildColorStockDrafts(
      Array.isArray(form.variantStocks) ? form.variantStocks : [],
      selectedColors,
      form.stock
    )

    setColorStocks((prev) => {
      const nextColorStocks = {}
      
      selectedColors.forEach((colorName) => {
        if (Object.prototype.hasOwnProperty.call(prev, colorName)) {
          nextColorStocks[colorName] = prev[colorName]
        } else {
          nextColorStocks[colorName] = nextDrafts[colorName] ?? String(form.stock ?? '')
        }
      })

      return shallowEqualColorStocks(prev, nextColorStocks) ? prev : nextColorStocks
    })
  }, [form.productId, form.stock, form.variantStocks, isComboCategory, isPillowSizeType, selectedColors])

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
      setSizeColorFillVariants({})
      return
    }

    // Inicializar combinaciones medida+color+relleno
    const variantStocks = Array.isArray(form.variantStocks) ? form.variantStocks : []
    const next = {}
    sizesOfType.forEach((size) => {
      const sizeId = Number(size.size_id)
      next[sizeId] = {}
      selectedColors.forEach((color) => {
        next[sizeId][color] = { sin: {}, con: {} }
        // Sin relleno
        const foundSin = variantStocks.find(
          (v) => Number(v.sizeId ?? v.size_id) === sizeId && String(v.color).toLowerCase() === String(color).toLowerCase() && !v.relleno
        )
        next[sizeId][color].sin = {
          stock: foundSin ? String(foundSin.stock) : '',
          precio: foundSin && foundSin.precio > 0 ? String(foundSin.precio) : (form.precio ? String(form.precio) : ''),
          precioOferta: foundSin && foundSin.enOferta && foundSin.precioOferta > 0 ? String(foundSin.precioOferta) : (form.precioOferta ? String(form.precioOferta) : ''),
          enOferta: foundSin ? Boolean(foundSin.enOferta) : Boolean(form.enOferta),
        }
        // Con relleno
        const foundCon = variantStocks.find(
          (v) => Number(v.sizeId ?? v.size_id) === sizeId && String(v.color).toLowerCase() === String(color).toLowerCase() && !!v.relleno
        )
        next[sizeId][color].con = {
          stock: foundCon ? String(foundCon.stock) : '',
          precio: foundCon && foundCon.precio > 0 ? String(foundCon.precio) : (form.precio ? String(form.precio) : ''),
          precioOferta: foundCon && foundCon.enOferta && foundCon.precioOferta > 0 ? String(foundCon.precioOferta) : (form.precioOferta ? String(form.precioOferta) : ''),
          enOferta: foundCon ? Boolean(foundCon.enOferta) : Boolean(form.enOferta),
        }
      })
    })
    setSizeColorFillVariants(next)
  }, [form.precio, form.precioOferta, form.productId, form.variantStocks, isPillowSizeType, sizesOfType, selectedColors, form.enOferta])

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

  function handleColorToggle(colorName) {
    const colorKey = normalizeColorKey(colorName)
    const exists = selectedColors.some((currentColor) => normalizeColorKey(currentColor) === colorKey)
    const nextColors = exists
      ? selectedColors.filter((currentColor) => normalizeColorKey(currentColor) !== colorKey)
      : [...selectedColors, colorName]

    onChange({ target: { name: 'selectedColors', value: nextColors } })

    if (!exists) {
      setColorStocks((prev) => {
        if (Object.prototype.hasOwnProperty.call(prev, colorName)) return prev
        return {
          ...prev,
          [colorName]: String(form.stock ?? ''),
        }
      })
    }
  }

  function handleColorStockChange(colorName, value) {
    setColorStocks((prev) => ({
      ...prev,
      [colorName]: value,
    }))
  }

  function toggleMobileColors() {
    setIsMobileColorsExpanded((prev) => !prev)
  }

  function buildVariantStocksPayload() {
    if (isComboCategory) {
      // ...sin cambios para combos...
      // ...existing code...
    }

    if (!isPillowSizeType) return []

    // NUEVO: generar combinaciones medida + color + relleno
    const variants = []
    sizesOfType.forEach((size) => {
      const sizeId = Number(size.size_id)
      if (!sizeColorFillVariants[sizeId]) return
      selectedColors.forEach((color) => {
        // Sin relleno
        const rowSin = sizeColorFillVariants[sizeId][color]?.sin || {}
        const precioSin = normalizePriceValue(rowSin.precio, 0)
        if (precioSin > 0) {
          variants.push({
            sizeId,
            color,
            relleno: false,
            stock: normalizeStockValue(rowSin.stock, 0),
            precio: precioSin,
            precioOferta: rowSin.enOferta ? normalizePriceValue(rowSin.precioOferta, 0) : null,
            enOferta: Boolean(rowSin.enOferta),
          })
        }
        // Con relleno
        const rowCon = sizeColorFillVariants[sizeId][color]?.con || {}
        const precioCon = normalizePriceValue(rowCon.precio, 0)
        if (precioCon > 0) {
          variants.push({
            sizeId,
            color,
            relleno: true,
            stock: normalizeStockValue(rowCon.stock, 0),
            precio: precioCon,
            precioOferta: rowCon.enOferta ? normalizePriceValue(rowCon.precioOferta, 0) : null,
            enOferta: Boolean(rowCon.enOferta),
          })
        }
      })
    })
    return variants
  }

  function handleImagesChange(event) {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    const invalidFile = files.find((file) => getImageUploadError(file))

    if (invalidFile) {
      setImageError(getImageUploadError(invalidFile))
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

      {/* Responsive combinaciones: tabla desktop y acordeón mobile, reutilizando inputs */}
      {isPillowSizeType && selectedColors.length > 0 && (
        <div className="variant-table-wrapper">
          <h3>Combinaciones de Medida, Color y Relleno</h3>
          {/* Tabla desktop */}
          <table className="variant-table">
            <thead>
              <tr>
                <th>Medida</th>
                <th>Color</th>
                <th colSpan="5">Opciones</th>
              </tr>
            </thead>
            <tbody>
              {sizesOfType.flatMap((size) =>
                selectedColors.map((color) => (
                  <tr key={`${size.size_id}-${color}-row`}>
                    <td>{formatSizeLabel(size.valor)}</td>
                    <td>
                      <span style={{ background: PRODUCT_COLOR_HEX[color], padding: '0.2em 0.8em', borderRadius: 4 }}>{color}</span>
                    </td>
                    <td colSpan="5">
                      <details>
                        <summary style={{cursor:'pointer',fontWeight:500}}>Ver opciones de relleno</summary>
                        <div style={{display:'flex',gap:24,marginTop:8}}>
                          {[['sin','Sin relleno'],['con','Con relleno']].map(([key, rellenoLabel]) => (
                            <div key={key} style={{border:'1px solid #eee',borderRadius:8,padding:12,minWidth:220}}>
                              <div style={{fontWeight:600,marginBottom:8}}>{rellenoLabel}</div>
                              <div style={{display:'flex',alignItems:'center',marginBottom:8}}>
                                <span style={{width:70}}>Stock</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={sizeColorFillVariants[size.size_id]?.[color]?.[key]?.stock || ''}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setSizeColorFillVariants(prev => ({
                                      ...prev,
                                      [size.size_id]: {
                                        ...prev[size.size_id],
                                        [color]: {
                                          ...prev[size.size_id]?.[color],
                                          [key]: {
                                            ...prev[size.size_id]?.[color]?.[key],
                                            stock: val
                                          },
                                          [key === 'sin' ? 'con' : 'sin']: { ...prev[size.size_id]?.[color]?.[key === 'sin' ? 'con' : 'sin'] }
                                        }
                                      }
                                    }));
                                  }}
                                  style={{ width: 60 }}
                                />
                              </div>
                              <div style={{display:'flex',alignItems:'center',marginBottom:8}}>
                                <span style={{width:70}}>Precio</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={sizeColorFillVariants[size.size_id]?.[color]?.[key]?.precio || ''}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setSizeColorFillVariants(prev => ({
                                      ...prev,
                                      [size.size_id]: {
                                        ...prev[size.size_id],
                                        [color]: {
                                          ...prev[size.size_id]?.[color],
                                          [key]: {
                                            ...prev[size.size_id]?.[color]?.[key],
                                            precio: val
                                          },
                                          [key === 'sin' ? 'con' : 'sin']: { ...prev[size.size_id]?.[color]?.[key === 'sin' ? 'con' : 'sin'] }
                                        }
                                      }
                                    }));
                                  }}
                                  style={{ width: 80 }}
                                />
                              </div>
                              <div style={{display:'flex',alignItems:'center',marginBottom:8}}>
                                <span style={{width:70}}>Oferta</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={sizeColorFillVariants[size.size_id]?.[color]?.[key]?.precioOferta || ''}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setSizeColorFillVariants(prev => ({
                                      ...prev,
                                      [size.size_id]: {
                                        ...prev[size.size_id],
                                        [color]: {
                                          ...prev[size.size_id]?.[color],
                                          [key]: {
                                            ...prev[size.size_id]?.[color]?.[key],
                                            precioOferta: val
                                          },
                                          [key === 'sin' ? 'con' : 'sin']: { ...prev[size.size_id]?.[color]?.[key === 'sin' ? 'con' : 'sin'] }
                                        }
                                      }
                                    }));
                                  }}
                                  style={{ width: 80 }}
                                />
                              </div>
                              <div style={{display:'flex',alignItems:'center'}}>
                                <input
                                  type="checkbox"
                                  checked={!!sizeColorFillVariants[size.size_id]?.[color]?.[key]?.enOferta}
                                  onChange={e => {
                                    const checked = e.target.checked;
                                    setSizeColorFillVariants(prev => ({
                                      ...prev,
                                      [size.size_id]: {
                                        ...prev[size.size_id],
                                        [color]: {
                                          ...prev[size.size_id]?.[color],
                                          [key]: {
                                            ...prev[size.size_id]?.[color]?.[key],
                                            enOferta: checked
                                          },
                                          [key === 'sin' ? 'con' : 'sin']: { ...prev[size.size_id]?.[color]?.[key === 'sin' ? 'con' : 'sin'] }
                                        }
                                      }
                                    }));
                                  }}
                                /> <span style={{marginLeft:8}}>En oferta</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {/* Mobile: acordeón */}
          <div className="variant-mobile-list">
            {sizesOfType.map((size) => (
              selectedColors.map((color) => (
                <details key={`${size.size_id}-${color}`} className="variant-mobile-item">
                  <summary>
                    <span style={{fontWeight:600}}>{formatSizeLabel(size.valor)}</span> - 
                    <span style={{ background: PRODUCT_COLOR_HEX[color], padding: '0.2em 0.8em', borderRadius: 4 }}>{color}</span>
                  </summary>
                  <div className="variant-mobile-fields">
                    {[{ relleno: false, label: 'Sin relleno', key: 'sin' }, { relleno: true, label: 'Con relleno', key: 'con' }].map(({relleno, label, key}) => (
                      <div key={key} className="variant-mobile-row">
                        <div className="variant-mobile-row-label">{label}</div>
                        <input
                          type="number"
                          min="0"
                          value={sizeColorFillVariants[size.size_id]?.[color]?.[key]?.stock || ''}
                          onChange={e => {
                            const val = e.target.value
                            setSizeColorFillVariants(prev => ({
                              ...prev,
                              [size.size_id]: {
                                ...prev[size.size_id],
                                [color]: {
                                  ...prev[size.size_id]?.[color],
                                  [key]: {
                                    ...prev[size.size_id]?.[color]?.[key],
                                    stock: val
                                  },
                                  [key === 'sin' ? 'con' : 'sin']: {...prev[size.size_id]?.[color]?.[key === 'sin' ? 'con' : 'sin']}
                                }
                              }
                            }))
                          }}
                          placeholder="Stock"
                          style={{ width: 70, marginRight: 8 }}
                        />
                        <input
                          type="number"
                          min="0"
                          value={sizeColorFillVariants[size.size_id]?.[color]?.[key]?.precio || ''}
                          onChange={e => {
                            const val = e.target.value
                            setSizeColorFillVariants(prev => ({
                              ...prev,
                              [size.size_id]: {
                                ...prev[size.size_id],
                                [color]: {
                                  ...prev[size.size_id]?.[color],
                                  [key]: {
                                    ...prev[size.size_id]?.[color]?.[key],
                                    precio: val
                                  },
                                  [key === 'sin' ? 'con' : 'sin']: {...prev[size.size_id]?.[color]?.[key === 'sin' ? 'con' : 'sin']}
                                }
                              }
                            }))
                          }}
                          placeholder={`Precio ${relleno ? '(con relleno)' : '(sin relleno)'}`}
                          style={{ width: 110, marginRight: 8 }}
                        />
                        <input
                          type="number"
                          min="0"
                          value={sizeColorFillVariants[size.size_id]?.[color]?.[key]?.precioOferta || ''}
                          onChange={e => {
                            const val = e.target.value
                            setSizeColorFillVariants(prev => ({
                              ...prev,
                              [size.size_id]: {
                                ...prev[size.size_id],
                                [color]: {
                                  ...prev[size.size_id]?.[color],
                                  [key]: {
                                    ...prev[size.size_id]?.[color]?.[key],
                                    precioOferta: val
                                  },
                                  [key === 'sin' ? 'con' : 'sin']: {...prev[size.size_id]?.[color]?.[key === 'sin' ? 'con' : 'sin']}
                                }
                              }
                            }))
                          }}
                          placeholder={`Precio oferta ${relleno ? '(con relleno)' : '(sin relleno)'}`}
                          style={{ width: 130, marginRight: 8 }}
                        />
                        <label style={{marginLeft: 8}}>
                          <input
                            type="checkbox"
                            checked={!!sizeColorFillVariants[size.size_id]?.[color]?.[key]?.enOferta}
                            onChange={e => {
                              const checked = e.target.checked
                              setSizeColorFillVariants(prev => ({
                                ...prev,
                                [size.size_id]: {
                                  ...prev[size.size_id],
                                  [color]: {
                                    ...prev[size.size_id]?.[color],
                                    [key]: {
                                      ...prev[size.size_id]?.[color]?.[key],
                                      enOferta: checked
                                    },
                                    [key === 'sin' ? 'con' : 'sin']: {...prev[size.size_id]?.[color]?.[key === 'sin' ? 'con' : 'sin']}
                                  }
                                }
                              }))
                            }}
                          /> Oferta
                        </label>
                      </div>
                    ))}
                  </div>
                </details>
              ))
            ))}
          </div>
          <style>{`
            .variant-table { border-collapse: collapse; width: 100%; font-size: 0.95em; }
            .variant-table th, .variant-table td { border: 1px solid #ddd; padding: 6px; text-align: center; }
            .variant-table th { background: #f5f5f5; }
            .variant-mobile-list { display: none; }
            @media (max-width: 700px) {
              .variant-table { display: none !important; }
              .variant-mobile-list { display: block; }
              .variant-mobile-item { margin-bottom: 1.2em; border: 1px solid #eee; border-radius: 8px; background: #fafafa; }
              .variant-mobile-item summary { cursor: pointer; padding: 10px 14px; font-size: 1.1em; }
              .variant-mobile-fields { padding: 10px 16px 10px 16px; }
              .variant-mobile-row { display: flex; align-items: center; margin-bottom: 10px; flex-wrap: wrap; }
              .variant-mobile-row-label { min-width: 90px; font-weight: 500; margin-right: 10px; }
            }
          `}</style>
        </div>
      )}

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
                selectedColors,
                colorStocks,
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

        <div className="field full-width product-form-color-field">
          <div className="product-form-color-header">
            <span>Colores</span>
            <button
              type="button"
              className="product-form-color-toggle"
              onClick={toggleMobileColors}
              aria-expanded={isMobileColorsExpanded}
              aria-label={`${isMobileColorsExpanded ? 'Ocultar' : 'Mostrar'} colores`}
            >
              <span className={`product-form-color-toggle-arrow ${isMobileColorsExpanded ? 'expanded' : ''}`} aria-hidden="true">
                ▾
              </span>
            </button>
          </div>

          <div
            className={`product-form-color-collapsible ${isMobileColorsExpanded ? 'expanded' : 'collapsed'}`}
          >
            <div className="product-form-color-options" role="group" aria-label="Seleccion de colores disponibles">
            {PRODUCT_COLOR_OPTIONS.map((colorName) => {
              const checked = selectedColors.some((selectedColor) => normalizeColorKey(selectedColor) === normalizeColorKey(colorName))

              return (
                <label
                  key={colorName}
                  className={`product-form-color-option ${checked ? 'active' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleColorToggle(colorName)}
                    disabled={isSubmitting}
                  />
                  <span
                    className="product-color-swatch"
                    style={{ backgroundColor: PRODUCT_COLOR_HEX[colorName] || '#cccccc' }}
                    aria-hidden="true"
                  />
                  <span>{colorName}</span>
                </label>
              )
            })}
            </div>
          </div>
          <small>Si no elegis colores, el producto se guarda sin variante de color.</small>
        </div>

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
          selectedColors.length > 0 ? (
            <div className="field full-width product-form-color-stock-field">
              <span>Stock por color</span>
              <div className="product-form-color-stock-grid">
                {selectedColors.map((colorName) => (
                  <label key={colorName} className="product-form-color-stock-card">
                    <span className="product-form-color-stock-label">
                      <span
                        className="product-color-swatch"
                        style={{ backgroundColor: PRODUCT_COLOR_HEX[colorName] || '#cccccc' }}
                        aria-hidden="true"
                      />
                      <span>{colorName}</span>
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={colorStocks[colorName] ?? ''}
                      onChange={(event) => handleColorStockChange(colorName, event.target.value)}
                      placeholder="Ej: 20"
                      disabled={isSubmitting}
                    />
                  </label>
                ))}
              </div>
              <small>Cada color se guarda como una variante independiente con su propio stock.</small>
            </div>
          ) : (
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
          )
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
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={handleImagesChange}
            disabled={isSubmitting}
          />
          <small>Formatos permitidos: JPG, PNG, WEBP. Tamaño máximo: {MAX_IMAGE_UPLOAD_SIZE_LABEL}</small>
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
