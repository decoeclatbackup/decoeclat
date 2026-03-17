import { useCallback, useEffect, useState } from 'react'
import { productServices } from '../services/productServices'

const emptyFilters = {
    name: '',
    categoryId: '',
    sizeTypeId: '',
    sizeId: '',
    telaId: '',
}

export function useProducts(options = {}) {
    const { initialFilters = emptyFilters, onlyActive = false } = options
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [filters, setFilters] = useState(() => ({
        ...emptyFilters,
        ...(initialFilters || {}),
    }))

    const loadProducts = useCallback(async (searchFilters = emptyFilters) => {
        try {
            setLoading(true)
            setError(null)
            const data = await productServices.list(searchFilters)
            const safeData = Array.isArray(data) ? data : []
            setProducts(onlyActive ? safeData.filter((product) => Boolean(product.activo)) : safeData)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [onlyActive])

    useEffect(() => {
        loadProducts(filters)
    }, [filters, loadProducts])

    function handleFilterChange(event) {
        const { name, value } = event.target
        setFilters((prev) => ({ ...prev, [name]: value }))
    }

    async function handleSearch(nextFilters = filters) {
        const mergedFilters = { ...filters, ...nextFilters }
        const hasChanged =
            String(filters.name || '') !== String(mergedFilters.name || '') ||
            String(filters.categoryId || '') !== String(mergedFilters.categoryId || '') ||
            String(filters.sizeTypeId || '') !== String(mergedFilters.sizeTypeId || '') ||
            String(filters.sizeId || '') !== String(mergedFilters.sizeId || '') ||
            String(filters.telaId || '') !== String(mergedFilters.telaId || '')

        if (hasChanged) {
            setFilters(mergedFilters)
            return
        }

        await loadProducts(mergedFilters)
    }

    async function clearFilters(nextFilters = emptyFilters) {
        const normalizedFilters = {
            ...emptyFilters,
            ...(nextFilters || {}),
        }
        setFilters(normalizedFilters)
        setError(null)
        await loadProducts(normalizedFilters)
    }

    return { 
        products, 
        loading, 
        error, 
        filters,
        setFilters,
        handleFilterChange,
        handleSearch,
        clearFilters,
        reload: (nextFilters = filters) => loadProducts(nextFilters),
    }
}