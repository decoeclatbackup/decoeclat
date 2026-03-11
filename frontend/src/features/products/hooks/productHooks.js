import { useCallback, useEffect, useMemo, useState } from 'react'
import { productServices } from '../services/productServices'

const emptyFilters = {
	name: '',
	categoryId: '',
}

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
	const [products, setProducts] = useState([])
	const [categories, setCategories] = useState([])
	const [telas, setTelas] = useState([])
	const [sizes, setSizes] = useState([])
	const [filters, setFilters] = useState(emptyFilters)
	const [form, setForm] = useState(emptyForm)
	const [loading, setLoading] = useState(false)
	const [message, setMessage] = useState('')

	const isEditing = useMemo(() => Boolean(form.productId), [form.productId])

	const loadProducts = useCallback(async (searchFilters = emptyFilters) => {
		try {
			setLoading(true)
			const data = await productServices.list(searchFilters)
			setProducts(data)
		} catch (error) {
			setMessage(`No se pudo cargar el catalogo: ${error.message}`)
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		loadProducts(filters)
		// Solo carga inicial del catalogo.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [loadProducts])

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
				setMessage(`No se pudieron cargar catalogos: ${error.message}`)
			}
		}

		loadCatalogs()
	}, [])

	function handleFilterChange(event) {
		const { name, value } = event.target
		setFilters((prev) => ({ ...prev, [name]: value }))
	}

	function handleFormChange(event) {
		const { name, value, type, checked } = event.target
		setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
	}

	async function submitForm() {
		try {
			setMessage('')

			if (isEditing) {
				await productServices.update(form)
				setMessage('Producto actualizado correctamente')
			} else {
				await productServices.create(form)
				setMessage('Producto registrado correctamente')
			}

			setForm(emptyForm)
			await loadProducts()
		} catch (error) {
			setMessage(`Operacion no realizada: ${error.message}`)
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
	}

	async function removeProduct(product) {
		const shouldContinue = window.confirm(
			`Se eliminara el producto "${product.nombre}". Queres continuar?`
		)

		if (!shouldContinue) return

		try {
			await productServices.remove(product.producto_id)
			setMessage('Producto eliminado correctamente')
			if (form.productId === product.producto_id) {
				setForm(emptyForm)
			}
			await loadProducts()
		} catch (error) {
			setMessage(`No se pudo dar de baja: ${error.message}`)
		}
	}

	async function toggleProductActive(product) {
		try {
			setMessage('')
			await productServices.setActive(product.producto_id, !product.activo)
			setMessage(`Producto ${!product.activo ? 'activado' : 'desactivado'} correctamente`)
			await loadProducts(filters)
		} catch (error) {
			setMessage(`No se pudo cambiar el estado: ${error.message}`)
		}
	}
	async function handleSearch() {
		await loadProducts(filters)
	}

	async function clearFilters() {
		setFilters(emptyFilters)
		setMessage('')
		await loadProducts(emptyFilters)
	}

	return {
		products,
		categories,
		telas,
		sizes,
		filters,
		form,
		loading,
		message,
		isEditing,
		handleFilterChange,
		handleFormChange,
		handleSearch,
		clearFilters,
		submitForm,
		startEdit,
		cancelEdit,
		removeProduct,
		toggleProductActive,
	}
}
