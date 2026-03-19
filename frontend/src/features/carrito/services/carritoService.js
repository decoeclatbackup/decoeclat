export const carritoServices = {
	async getCarrito(clienteId) {
		if (!clienteId) return null

		return request('/api/carrito', {}, {
			clienteId: clienteId,
		})
	},

   	async agregarItem({ clienteId, varianteId, cantidad }) {
		try {
			return await request('/api/carrito/agregar', {
				method: 'POST',
				body: JSON.stringify({
					clienteId,
					varianteId: Number(varianteId),
					cantidad: Number(cantidad),
				}),
			})
		} catch (error) {
			console.error(error)
			throw error
		}
	},


};

