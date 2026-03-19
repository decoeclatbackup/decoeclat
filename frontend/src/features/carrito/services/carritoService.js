import { request } from './http'

function toInt(value, fieldName) {
	const parsed = Number(value)
	if (!Number.isInteger(parsed) || parsed <= 0) {
		throw new Error(`${fieldName} debe ser un entero mayor a 0`)
	}
	return parsed
}

export const carritoServices = {
	async getCarrito(clienteId) {
		if (!clienteId) return null

		return request('/api/carrito', {}, {
			clienteId: toInt(clienteId, 'clienteId'),
		})
	},

   	async agregarItem({ clienteId, varianteId, cantidad }) {
		return request('/api/carrito/agregar', {
			method: 'POST',
			body: JSON.stringify({
				clienteId: toInt(clienteId, 'clienteId'),
				varianteId: toInt(varianteId, 'varianteId'),
				cantidad: toInt(cantidad, 'cantidad'),
			}),
		})
	},

	async actualizarItem({ clienteId, varianteId, cantidad }) {
		return request('/api/carrito/item', {
			method: 'PUT',
			body: JSON.stringify({
				clienteId: toInt(clienteId, 'clienteId'),
				varianteId: toInt(varianteId, 'varianteId'),
				cantidad: toInt(cantidad, 'cantidad'),
			}),
		})
	},

	async eliminarItem({ clienteId, varianteId }) {
		return request('/api/carrito/item', {
			method: 'DELETE',
			body: JSON.stringify({
				clienteId: toInt(clienteId, 'clienteId'),
				varianteId: toInt(varianteId, 'varianteId'),
			}),
		})
	},

	async vaciarCarrito(clienteId) {
		return request('/api/carrito/vaciar', {
			method: 'DELETE',
			body: JSON.stringify({
				clienteId: toInt(clienteId, 'clienteId'),
			}),
		})
	},


};

