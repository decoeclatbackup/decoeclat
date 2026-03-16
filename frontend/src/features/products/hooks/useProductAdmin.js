import { useCallback, useEffect, useMemo, useState } from 'react'
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

export function useProductCatalog() {
    // 1. Reutilizamos la lógica de listado
    const [filters, setFilters] = useState(emptyFilters)
    const { products, loading, reload } = useProducts(filters)

    // 2. Estados de datos auxiliares y formulario
    const [categories, setCategories] = useState([])
    const [telas, setTelas] = useState([])
    const [sizes, setSizes] = useState([])
    const [form, setForm] = useState(emptyForm)
    const [message, setMessage] = useState('')

    const isEditing = useMemo(() => Boolean(form.productId), [form.productId])

    // Carga de selectores (Categorías, talles, etc)
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

    // Funciones de gestión
    function handleFilterChange(event) {
        const { name, value } = event.target
        setFilters((prev) => ({ ...prev, [name]: value }))
    }

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
            await reload()
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

    function cancelEdit() { setForm(emptyForm) }

    async function removeProduct(product) {
        if (!window.confirm(`¿Eliminar "${product.nombre}"?`)) return
        try {
            await productServices.remove(product.producto_id)
            setMessage('Eliminado correctamente')
            await reload()
        } catch (error) {
            setMessage(`Error: ${error.message}`)
        }
    }

    async function toggleProductActive(product) {
        try {
            await productServices.setActive(product.producto_id, !product.activo)
            setMessage('Estado actualizado')
            await reload()
        } catch (error) {
            setMessage(`Error: ${error.message}`)
        }
    }

    return {
        products, categories, telas, sizes, filters, form, loading, message, isEditing,
        handleFilterChange, handleFormChange, submitForm, startEdit, cancelEdit,
        removeProduct, toggleProductActive, 
        handleSearch: reload,
        clearFilters: () => { setFilters(emptyFilters); reload(); }
    }
}