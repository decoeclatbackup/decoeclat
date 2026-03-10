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
	description: '',
}

export function useProductCatalog() {
	const [products, setProducts] = useState([])
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

	function handleFilterChange(event) {
		const { name, value } = event.target
		setFilters((prev) => ({ ...prev, [name]: value }))
	}

	function handleFormChange(event) {
		const { name, value } = event.target
		setForm((prev) => ({ ...prev, [name]: value }))
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
			description: product.descripcion || '',
		})
	}

	function cancelEdit() {
		setForm(emptyForm)
	}

	async function removeProduct(product) {
		const shouldContinue = window.confirm(
			`Se dara de baja el producto "${product.nombre}". Queres continuar?`
		)

		if (!shouldContinue) return

		try {
			await productServices.remove(product.producto_id)
			setMessage('Producto dado de baja correctamente')
			if (form.productId === product.producto_id) {
				setForm(emptyForm)
			}
			await loadProducts()
		} catch (error) {
			setMessage(`No se pudo dar de baja: ${error.message}`)
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
	}
}
