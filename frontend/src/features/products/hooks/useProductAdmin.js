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

    async function submitForm(images = [], existingImageChanges = null) {
        try {
            setMessage('')
            if (isEditing) {
                await productServices.update({ ...form, images, existingImageChanges })
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
        handleSearch,
        clearFilters: handleClearFilters,
    }
}