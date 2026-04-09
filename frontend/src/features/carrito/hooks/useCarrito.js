import { useState } from 'react'
import { carritoServices } from '../services/carritoService'
import { clienteService } from '../services/clienteService'

const EMPTY_CARRITO = {
	items: [],
	total: 0,
}

const CART_UPDATED_EVENT = 'decoeclat:cart-updated'
const CART_ITEM_ADDED_EVENT = 'decoeclat:cart-item-added'

function getItemsCount(carrito) {
	const items = Array.isArray(carrito?.items) ? carrito.items : []
	if (!items.length) return 0

	return items.reduce((acc, item) => acc + (Number(item?.cantidad) || 0), 0)
}

function emitCartUpdated(carrito) {
	if (typeof window === 'undefined') return

	window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT, {
		detail: {
			itemsCount: getItemsCount(carrito),
		},
	}))
}

function emitCartItemAdded() {
	if (typeof window === 'undefined') return

	window.dispatchEvent(new CustomEvent(CART_ITEM_ADDED_EVENT, {
		detail: {
			message: 'Producto agregado al carrito',
		},
	}))
}

function normalizeCarrito(carrito) {
	if (!carrito) return EMPTY_CARRITO

	return {
		...carrito,
		items: Array.isArray(carrito.items) ? carrito.items : [],
		total: Number(carrito.total) || 0,
	}
}

export const useCarrito = () => {
	const [carrito, setCarrito] = useState(EMPTY_CARRITO)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState(null)

	const getClienteTemporalId = () => localStorage.getItem('clienteId')

	const isTemporalClient = (cliente) => {
		const nombre = String(cliente?.nombre || '').trim().toLowerCase()
		const email = String(cliente?.email || '').trim().toLowerCase()
		return nombre === 'invitado' || email.startsWith('temp_')
	}

	const clearClienteTemporalId = () => {
		if (typeof window === 'undefined') return
		localStorage.removeItem('clienteId')
	}

	const getOrCreateClienteTemporalId = async () => {
		let clienteId = getClienteTemporalId()
		setError(null)

		if (clienteId) {
			try {
				const clienteExistente = await clienteService.obtenerClientePorId(clienteId)
				if (clienteExistente && !isTemporalClient(clienteExistente)) {
					clearClienteTemporalId()
					clienteId = null
				}
			} catch {
				clearClienteTemporalId()
				clienteId = null
			}
		}

		if (!clienteId) {
			const cliente = await clienteService.crearclienteTemporal()
			clienteId = String(cliente.cliente_id)
			localStorage.setItem('clienteId', clienteId)
		}

		return clienteId
	}

	const completarDatosClienteTemporal = async ({ nombre, email, telefono }) => {
		setError(null)
		setLoading(true)

		try {
			const clienteId = getClienteTemporalId()
			console.log('Completando cliente temporal:', { clienteId, nombre, email })
			
			if (!clienteId) {
				throw new Error('No hay cliente temporal activo para completar')
			}

			const clienteActualizado = await clienteService.completarClienteTemporal(clienteId, {
				nombre,
				email,
				telefono,
			})

			console.log('Cliente actualizado:', clienteActualizado)
			return clienteActualizado
		} catch (err) {
			console.error('Error completar cliente:', err?.message || err)
			setError(err?.message || 'Error al completar datos del cliente')
			throw err
		} finally {
			setLoading(false)
		}
	}

	const handleAddToCart = async (varianteId, cantidad) => {
		setError(null)
		setLoading(true)

		try {
			if (!Number.isInteger(Number(cantidad)) || Number(cantidad) <= 0) {
				throw new Error('La cantidad debe ser mayor a 0')
			}

			const clienteId = await getOrCreateClienteTemporalId()
			const carrito = await carritoServices.agregarItem({
				clienteId,
				varianteId,
				cantidad,
			})
			const normalized = normalizeCarrito(carrito)
			setCarrito(normalized)
			emitCartUpdated(normalized)
			emitCartItemAdded()

			console.log('Producto agregado al carrito')
			return carrito

		} catch (err) {
			setError(err?.message || 'Error al agregar producto al carrito')
			throw err
		} finally {
			setLoading(false)
		}

	}

	const handleUpdateCantidad = async (varianteId, cantidad) => {
		setError(null)
		setLoading(true)
		try {
			if (!Number.isInteger(Number(cantidad)) || Number(cantidad) <= 0) {
				throw new Error('La cantidad debe ser mayor a 0')
			}

			const clienteId = getClienteTemporalId()
			if (!clienteId) {
				throw new Error('No hay cliente temporal activo')
			}

			const carrito = await carritoServices.actualizarItem({
				clienteId,
				varianteId,
				cantidad,
			})
			const normalized = normalizeCarrito(carrito)
			setCarrito(normalized)
			emitCartUpdated(normalized)

			console.log('Cantidad actualizada en el carrito')
			return carrito

		} catch (err) {
			setError(err?.message || 'Error al actualizar cantidad')
			throw err
		} finally {
			setLoading(false)
		}
	}

	const handleEliminarItem = async (varianteId) => {
		setError(null)
		setLoading(true)
		try {
			const clienteId = getClienteTemporalId()
			if (!clienteId) {
				throw new Error('No hay cliente temporal activo')
			}

			const carrito = await carritoServices.eliminarItem({
				clienteId,
				varianteId,
			})
			const normalized = normalizeCarrito(carrito)
			setCarrito(normalized)
			emitCartUpdated(normalized)

			console.log('Producto eliminado del carrito')
			return carrito

		} catch (err) {
			setError(err?.message || 'Error al eliminar producto del carrito')
			throw err
		} finally {
			setLoading(false)
		}
	}

	const handleVaciarCarrito = async () => {
		setError(null)
		setLoading(true)
		try {
			const clienteId = getClienteTemporalId()
			if (!clienteId) {
				throw new Error('No hay cliente temporal activo')
			}
			
			const carrito = await carritoServices.vaciarCarrito(clienteId)
			const normalized = normalizeCarrito(carrito)
			setCarrito(normalized)
			emitCartUpdated(normalized)
			console.log('Carrito vaciado')
			return carrito

		} catch (err) {
			setError(err?.message || 'Error al vaciar carrito')
			throw err
		} finally {
			setLoading(false)
		}
	}

	const handleGetCarrito = async () => {
		setError(null)
		setLoading(true)

		try {
			const clienteId = getClienteTemporalId()
			if (!clienteId) {
				setCarrito(EMPTY_CARRITO)
				emitCartUpdated(EMPTY_CARRITO)
				return EMPTY_CARRITO
			}

			const data = await carritoServices.getCarrito(clienteId)
			const normalized = normalizeCarrito(data)
			setCarrito(normalized)
			emitCartUpdated(normalized)
			return normalized
		} catch (err) {
			setError(err?.message || 'Error al obtener carrito')
			throw err
		} finally {
			setLoading(false)
		}
	}

	const items = carrito.items || []
	const total = carrito.total || 0

	return {
		error,
		carrito,
		items,
		total,
		loading,
		getClienteTemporalId,
		clearClienteTemporalId,
		getOrCreateClienteTemporalId,
		completarDatosClienteTemporal,
		handleGetCarrito,
		handleAddToCart,
		handleUpdateCantidad,
		handleEliminarItem,
		handleVaciarCarrito,
	
	}
}