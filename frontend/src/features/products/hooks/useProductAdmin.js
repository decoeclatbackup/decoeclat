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
    variantStocks: [],
}

function normalizeVariantStocks(variants = []) {
    return [...variants]
        .map((variant) => ({
            varianteId: Number(variant?.variante_id),
            sizeId: Number(variant?.size_id),
            relleno: Boolean(variant?.relleno),
            stock: Number(variant?.stock ?? 0),
            precio: Number(variant?.precio ?? 0),
            precioOferta: Number(variant?.precio_oferta ?? 0),
            enOferta: Boolean(variant?.en_oferta),
        }))
        .filter((variant) => Number.isInteger(variant.sizeId) && variant.sizeId > 0)
        .sort((left, right) => left.sizeId - right.sizeId)
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
    const [statusMessage, setStatusMessage] = useState('')

    const message = useMemo(() => {
        if (statusMessage) return statusMessage
        if (error) return `Error: ${error}`
        return ''
    }, [error, statusMessage])

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
                setStatusMessage(`Error en catálogos: ${error.message}`)
            }
        }
        loadCatalogs()
    }, [])

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

    async function submitForm(images = [], existingImageChanges = null, variantConfig = null) {
        try {
            setStatusMessage('')
            const variantStocks = Array.isArray(variantConfig?.variantStocks)
                ? variantConfig.variantStocks
                : []

            if (isEditing) {
                await productServices.update({ ...form, images, existingImageChanges, variantStocks })
                setStatusMessage('Producto actualizado correctamente')
            } else {
                await productServices.create({ ...form, images, variantStocks })
                setStatusMessage('Producto registrado correctamente')
            }
            setForm(emptyForm)
            setExistingImages([])
            await reload(filters)
            return true
        } catch (error) {
            setStatusMessage(`Operación fallida: ${error.message}`)
            return false
        }
    }

    async function startEdit(product) {
        setStatusMessage('')
        try {
            const variants = await productServices.listVariantsByProduct(product.producto_id)
            const safeVariants = Array.isArray(variants) ? variants : []
            const activeVariant = safeVariants.find(
                (variant) => Number(variant.variante_id) === Number(product.variante_id)
            ) || safeVariants[0] || null

            setForm({
                productId: product.producto_id,
                variantId: activeVariant?.variante_id || product.variante_id || null,
                name: product.nombre || '',
                categoryId: product.categoria_id || '',
                sizeId: activeVariant?.size_id || product.size_id || '',
                telaId: activeVariant?.tela_id || product.tela_id || '',
                precio: activeVariant?.precio || product.precio || '',
                precioOferta: activeVariant?.precio_oferta ?? product.precioOferta ?? '',
                enOferta: activeVariant?.en_oferta ?? product.enOferta ?? false,
                stock: activeVariant?.stock ?? product.stock ?? '',
                description: product.descripcion || '',
                variantStocks: normalizeVariantStocks(safeVariants),
            })
        } catch (error) {
            setMessage(`No se pudieron cargar las medidas del producto: ${error.message}`)
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
                variantStocks: [],
            })
        }
    }

    function cancelEdit() {
        setForm(emptyForm)
        setExistingImages([])
    }

    async function removeProduct(product) {
        if (!window.confirm(`¿Eliminar "${product.nombre}"?`)) return
        try {
            await productServices.remove(product.producto_id)
            setStatusMessage('Eliminado correctamente')
            if (form.productId === product.producto_id) {
                setForm(emptyForm)
            }
            await reload(filters)
        } catch (error) {
            setStatusMessage(`Error: ${error.message}`)
        }
    }

    async function toggleProductActive(product) {
        try {
            await productServices.setActive(product.producto_id, !product.activo)
            setStatusMessage('Estado actualizado')
            await reload(filters)
        } catch (error) {
            setStatusMessage(`Error: ${error.message}`)
        }
    }

    async function handleClearFilters() {
        setStatusMessage('')
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
        handleSearch,
        clearFilters: handleClearFilters,
    }
}