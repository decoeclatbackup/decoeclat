import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { productServices } from '../services/productServices'
import { useProducts } from './useProducts'

const emptyFilters = {
    name: '',
    categoryId: '',
    sizeTypeId: '',
    sizeId: '',
    telaId: '',
    color: '',
}

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
    'Verde',
    'Rosa',
    'Canela',
    'Amarillo',
    'Chocolate',
]

export function useProductCatalog() {
    const { categoryId: routeCategoryId } = useParams()
    const selectedCategoryId = routeCategoryId || ''
    const [categories, setCategories] = useState([])
    const [sizes, setSizes] = useState([])
    const [telas, setTelas] = useState([])
    const [sortOrder, setSortOrder] = useState('price-asc')

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
        async function loadCatalogFilters() {
            const [categoriesResult, sizesResult, telasResult] = await Promise.allSettled([
                productServices.listCategories(),
                productServices.listSizes(),
                productServices.listTelas(),
            ])

            const categoriesData = categoriesResult.status === 'fulfilled' ? categoriesResult.value : []
            const sizesData = sizesResult.status === 'fulfilled' ? sizesResult.value : []
            const telasData = telasResult.status === 'fulfilled' ? telasResult.value : []

            setCategories(Array.isArray(categoriesData) ? categoriesData : [])
            setSizes(Array.isArray(sizesData) ? sizesData : [])
            setTelas(Array.isArray(telasData) ? telasData : [])
        }

        loadCatalogFilters()
    }, [])

    useEffect(() => {
        setFilters((prev) => {
            // Calcular los IDs de categoría a incluir
            let categoryIds = selectedCategoryId
            
            if (selectedCategoryId && categories.length > 0) {
                const selected = categories.find(
                    (cat) => String(cat.categoria_id) === String(selectedCategoryId)
                )
                
                if (selected) {
                    // Buscar todas las subcategorías de la categoría actual
                    const children = categories.filter(
                        (cat) => String(cat.parent_id) === String(selected.categoria_id)
                    )
                    
                    // Si hay subcategorías, incluir la categoría padre + todas las hijas
                    if (children.length > 0) {
                        const childIds = children.map((cat) => Number(cat.categoria_id))
                        categoryIds = [Number(selectedCategoryId), ...childIds]
                    }
                }
            }

            const next = {
                name: prev?.name || '',
                categoryId: categoryIds,
                sizeTypeId: prev?.sizeTypeId || '',
                sizeId: prev?.sizeId || '',
                telaId: prev?.telaId || '',
                color: prev?.color || '',
            }

            if (
                String(prev?.name || '') === String(next.name || '') &&
                String(prev?.categoryId?.toString() || '') === String(next.categoryId?.toString() || '') &&
                String(prev?.sizeTypeId || '') === String(next.sizeTypeId || '') &&
                String(prev?.sizeId || '') === String(next.sizeId || '') &&
                String(prev?.telaId || '') === String(next.telaId || '') &&
                String(prev?.color || '') === String(next.color || '')
            ) {
                return prev
            }

            return next
        })
    }, [selectedCategoryId, categories, setFilters])

    const currentCategory = useMemo(
        () => categories.find((category) => String(category.categoria_id) === String(selectedCategoryId)),
        [categories, selectedCategoryId]
    )

    const isFundasCategory = useMemo(() => {
        if (!currentCategory) return false

        const currentName = String(currentCategory.nombre || '').toLowerCase().trim()
        if (currentName !== 'fundas') return false

        if (currentCategory.parent_id == null) return true
        const parentCategory = categories.find(
            (category) => String(category.categoria_id) === String(currentCategory.parent_id)
        )
        const parentName = String(parentCategory?.nombre || '').toLowerCase().trim()
        return parentName === 'textiles'
    }, [categories, currentCategory])

    const fundasSizes = useMemo(() => {
        const withDimensions = sizes.filter((size) => /\d+\s*x\s*\d+/i.test(String(size.valor || '')))
        return withDimensions.length > 0 ? withDimensions : sizes
    }, [sizes])

    const visibleSizes = isFundasCategory ? fundasSizes : []

    useEffect(() => {
        if (isFundasCategory) return
        if (!filters.sizeId && !filters.sizeTypeId) return

        setFilters((prev) => ({
            ...prev,
            sizeId: '',
            sizeTypeId: '',
        }))
    }, [filters.sizeId, filters.sizeTypeId, isFundasCategory, setFilters])

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

    const getCategoryIdsForFilter = (categoryId) => {
        if (!categoryId) return categoryId
        
        const selected = categories.find(
            (cat) => String(cat.categoria_id) === String(categoryId)
        )
        
        if (selected) {
            const children = categories.filter(
                (cat) => String(cat.parent_id) === String(selected.categoria_id)
            )
            
            if (children.length > 0) {
                const childIds = children.map((cat) => Number(cat.categoria_id))
                return [Number(categoryId), ...childIds]
            }
        }
        
        return categoryId
    }

    async function handleClearFilters() {
        const categoryIds = getCategoryIdsForFilter(selectedCategoryId)
        await clearFilters({
            ...emptyFilters,
            categoryId: categoryIds,
        })
    }

    async function handleNavbarSearch(name) {
        await handleSearch({
            ...filters,
            name,
        })
    }

    return {
        products: sortedProducts,
        productColors: PRODUCT_COLOR_OPTIONS,
        categories,
        sizes: visibleSizes,
        telas,
        isFundasCategory,
        currentCategory,
        selectedCategoryId,
        filters,
        setFilters,
        loading,
        sortOrder,
        setSortOrder,
        message: error ? `Error: ${error}` : '',
        handleFilterChange,
        handleNavbarSearch,
        handleSearch,
        handleClearFilters,
    }
}
