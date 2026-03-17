import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { productServices } from '../services/productServices'
import { useProducts } from './useProducts'

const emptyFilters = {
    name: '',
    categoryId: '',
}

export function useProductCatalog() {
    const { categoryId: routeCategoryId } = useParams()
    const selectedCategoryId = routeCategoryId || ''
    const [categories, setCategories] = useState([])
    const [sortOrder, setSortOrder] = useState('none')

    const {
        products,
        loading,
        error,
        filters,
        setFilters,
        handleFilterChange,
        handleSearch,
        clearFilters,
    } = useProducts({
        initialFilters: { ...emptyFilters, categoryId: selectedCategoryId },
        onlyActive: true,
    })

    useEffect(() => {
        async function loadCategories() {
            try {
                const categoriesData = await productServices.listCategories()
                setCategories(Array.isArray(categoriesData) ? categoriesData : [])
            } catch {
                setCategories([])
            }
        }

        loadCategories()
    }, [setCategories])

    useEffect(() => {
        setFilters((prev) => {
            const next = {
                name: prev?.name || '',
                categoryId: selectedCategoryId,
            }

            if (
                String(prev?.name || '') === String(next.name || '') &&
                String(prev?.categoryId || '') === String(next.categoryId || '')
            ) {
                return prev
            }

            return next
        })
    }, [selectedCategoryId, setFilters])

    const categoryLinks = useMemo(() => {
        const parentCategories = categories.filter((category) => category.parent_id == null)
        const source = parentCategories.length > 0 ? parentCategories : categories

        return source.map((category) => ({
            id: String(category.categoria_id),
            name: category.nombre,
        }))
    }, [categories])

    const currentCategory = useMemo(
        () => categories.find((category) => String(category.categoria_id) === String(selectedCategoryId)),
        [categories, selectedCategoryId]
    )

    const sortedProducts = useMemo(() => {
        if (sortOrder === 'none') return products

        const items = [...products]
        items.sort((left, right) => {
            const leftPrice = Number(left.enOferta && left.precioOferta ? left.precioOferta : left.precio || 0)
            const rightPrice = Number(right.enOferta && right.precioOferta ? right.precioOferta : right.precio || 0)
            if (sortOrder === 'price-asc') return leftPrice - rightPrice
            return rightPrice - leftPrice
        })

        return items
    }, [products, sortOrder])

    async function handleClearFilters() {
        await clearFilters({
            ...emptyFilters,
            categoryId: selectedCategoryId,
        })
    }

    return {
        products: sortedProducts,
        categories,
        categoryLinks,
        currentCategory,
        selectedCategoryId,
        filters,
        loading,
        sortOrder,
        setSortOrder,
        message: error ? `Error: ${error}` : '',
        handleFilterChange,
        handleSearch,
        handleClearFilters,
    }
}
