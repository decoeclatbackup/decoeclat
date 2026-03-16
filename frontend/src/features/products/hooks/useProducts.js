import { useCallback, useEffect, useState } from 'react'
import { productServices } from '../services/productServices'

export function useProducts(initialFilters = {}) {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const loadProducts = useCallback(async (filters) => {
        try {
            setLoading(true)
            const data = await productServices.list(filters)
            setProducts(Array.isArray(data) ? data : [])
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadProducts(initialFilters)
    }, [JSON.stringify(initialFilters), loadProducts])

    return { 
        products, 
        loading, 
        error, 
        reload: () => loadProducts(initialFilters) 
    }
}