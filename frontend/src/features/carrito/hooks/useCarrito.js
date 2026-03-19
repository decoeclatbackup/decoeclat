import { carritoServices } from '../services/carritoService'
import { clienteService } from '../services/clienteService'

export const useCarrito = () => {

	const handleAddToCart = async (varianteId, cantidad) => {
		try {
			let clienteId = localStorage.getItem('clienteId')

			// 🧠 crear cliente si no existe
			if (!clienteId) {
				const cliente = await clienteService.crearclienteTemporal()
				clienteId = cliente.cliente_id
				localStorage.setItem('clienteId', clienteId)
			}

			// 🛒 agregar item
			await carritoServices.agregarItem({
				clienteId,
				varianteId,
				cantidad,
			})

			console.log('Producto agregado al carrito')

		} catch (error) {
			console.error(error)
		}
	}

	return {
		handleAddToCart,
	}
}