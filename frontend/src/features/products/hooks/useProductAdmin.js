import { useEffect, useMemo, useState } from 'react'
import { productServices } from '../services/productServices'
import { useProducts } from './useProducts'

const emptyFilters = { name: '', categoryId: '' }

const emptyForm = {
    productId: null,
    variantId: null,
    name: '',
    categoryId: '',
    sizeId: '',
    telaId: '',
    precio: '',
    precioOferta: '',
    enOferta: false,
    stock: '',
    description: '',
}

function sortImages(images = []) {
    return [...images].sort((left, right) => {
        const orderDiff = Number(left.orden ?? 0) - Number(right.orden ?? 0)
        if (orderDiff !== 0) return orderDiff

        const principalDiff = Number(Boolean(right.principal)) - Number(Boolean(left.principal))
        if (principalDiff !== 0) return principalDiff

        return Number(left.img_id ?? 0) - Number(right.img_id ?? 0)
    })
}

export function useProductAdmin() {
    const {
        products,
        loading,
        error,
        filters,
        handleFilterChange,
        handleSearch,
        clearFilters,
        reload,
    } = useProducts()

    const [categories, setCategories] = useState([])
    const [telas, setTelas] = useState([])
    const [sizes, setSizes] = useState([])
    const [form, setForm] = useState(emptyForm)
    const [existingImages, setExistingImages] = useState([])
    const [message, setMessage] = useState('')

    const isEditing = useMemo(() => Boolean(form.productId), [form.productId])

    useEffect(() => {
        async function loadCatalogs() {
            try {
                const [categoriesData, telasData, sizesData] = await Promise.all([
                    productServices.listCategories(),
                    productServices.listTelas(),
                    productServices.listSizes(),
                ])
                setCategories(Array.isArray(categoriesData) ? categoriesData : [])
                setTelas(Array.isArray(telasData) ? telasData : [])
                setSizes(Array.isArray(sizesData) ? sizesData : [])
            } catch (error) {
                setMessage(`Error en catálogos: ${error.message}`)
            }
        }
        loadCatalogs()
    }, [])

    useEffect(() => {
        if (error) {
            setMessage(`Error: ${error}`)
        }
    }, [error])

    useEffect(() => {
        let cancelled = false

        async function loadExistingImages() {
            if (!form.productId) {
                setExistingImages([])
                return
            }

            try {
                const images = await productServices.listImagesByProduct(form.productId)
                if (!cancelled) {
                    setExistingImages(sortImages(Array.isArray(images) ? images : []))
                }
            } catch {
                if (!cancelled) {
                    setExistingImages([])
                }
            }
        }

        loadExistingImages()

        return () => {
            cancelled = true
        }
    }, [form.productId])

    function handleFormChange(event) {
        const { name, value, type, checked } = event.target
        setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    }

    async function submitForm(images = []) {
        try {
            setMessage('')
            if (isEditing) {
                await productServices.update({ ...form, images })
                setMessage('Producto actualizado correctamente')
            } else {
                await productServices.create({ ...form, images })
                setMessage('Producto registrado correctamente')
            }
            setForm(emptyForm)
            setExistingImages([])
            await reload(filters)
            return true
        } catch (error) {
            setMessage(`Operación fallida: ${error.message}`)
            return false
        }
    }

    function startEdit(product) {
        setMessage('')
        setForm({
            productId: product.producto_id,
            variantId: product.variante_id,
            name: product.nombre || '',
            categoryId: product.categoria_id || '',
            sizeId: product.size_id || '',
            telaId: product.tela_id || '',
            precio: product.precio || '',
            precioOferta: product.precioOferta || '',
            enOferta: product.enOferta || false,
            stock: product.stock || '',
            description: product.descripcion || '',
        })
    }

    function cancelEdit() {
        setForm(emptyForm)
        setExistingImages([])
    }

    async function removeProduct(product) {
        if (!window.confirm(`¿Eliminar "${product.nombre}"?`)) return
        try {
            await productServices.remove(product.producto_id)
            setMessage('Eliminado correctamente')
            if (form.productId === product.producto_id) {
                setForm(emptyForm)
            }
            await reload(filters)
        } catch (error) {
            setMessage(`Error: ${error.message}`)
        }
    }

    async function toggleProductActive(product) {
        try {
            await productServices.setActive(product.producto_id, !product.activo)
            setMessage('Estado actualizado')
            await reload(filters)
        } catch (error) {
            setMessage(`Error: ${error.message}`)
        }
    }

    async function removeExistingImage(imageId) {
        if (!imageId) return

        try {
            await productServices.deleteImage(imageId)
            setExistingImages((prev) => sortImages(prev.filter((image) => image.img_id !== imageId)))
            setMessage('Imagen eliminada correctamente')
            await reload(filters)
        } catch (error) {
            setMessage(`Error al eliminar imagen: ${error.message}`)
        }
    }

    async function updateExistingImageOrder(imageId, orderValue) {
        if (!imageId && imageId !== 0) return

        const parsed = Number(orderValue)
        const normalizedOrder = Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : 0

        try {
            const updatedImage = await productServices.updateImage(imageId, { orden: normalizedOrder })

            setExistingImages((prev) => sortImages(prev.map((image) => {
                if (image.img_id !== imageId) return image
                return {
                    ...image,
                    orden: Number(updatedImage?.orden ?? normalizedOrder),
                }
            })))

            setMessage('Orden de imagen actualizado')
        } catch (error) {
            setMessage(`Error al actualizar orden: ${error.message}`)
        }
    }

    async function reorderExistingImages(nextImages = []) {
        if (!Array.isArray(nextImages) || nextImages.length === 0) return

        const normalizedImages = nextImages.map((image, index) => ({
            ...image,
            orden: index,
        }))

        const previousOrderByImageId = new Map(
            existingImages.map((image) => [image.img_id, Number(image.orden ?? 0)])
        )

        const changedImages = normalizedImages.filter((image) => {
            if (image?.img_id == null) return false
            return previousOrderByImageId.get(image.img_id) !== Number(image.orden ?? 0)
        })

        if (changedImages.length === 0) {
            setExistingImages(sortImages(normalizedImages))
            return
        }

        try {
            await Promise.all(
                changedImages.map((image) =>
                    productServices.updateImage(image.img_id, { orden: Number(image.orden ?? 0) })
                )
            )

            setExistingImages(sortImages(normalizedImages))
            setMessage('Orden de imágenes actualizado')
            await reload(filters)
        } catch (error) {
            setMessage(`Error al reordenar imágenes: ${error.message}`)
        }
    }

    async function handleClearFilters() {
        setMessage('')
        await clearFilters(emptyFilters)
    }

    return {
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
        submitForm,
        startEdit,
        cancelEdit,
        removeProduct,
        toggleProductActive,
        removeExistingImage,
        updateExistingImageOrder,
        reorderExistingImages,
        handleSearch,
        clearFilters: handleClearFilters,
    }
}