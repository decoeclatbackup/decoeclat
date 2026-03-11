const API_BASE_URL = import.meta.env.VITE_API_URL || ''

function buildUrl(path, query = {}) {
	const params = new URLSearchParams()

	Object.entries(query).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== '') {
			params.append(key, value)
		}
	})

	const qs = params.toString()
	return `${API_BASE_URL}${path}${qs ? `?${qs}` : ''}`
}

async function request(path, options = {}, query) {
	const response = await fetch(buildUrl(path, query), {
		headers: {
			'Content-Type': 'application/json',
			...(options.headers || {}),
		},
		...options,
	})

	if (!response.ok) {
		let message = 'Error de red'
		try {
			const body = await response.json()
			message = body.error || message
		} catch {
			message = response.statusText || message
		}
		throw new Error(message)
	}

	if (response.status === 204) return null
	return response.json()
}

async function attachFirstVariant(product) {
	const variants = await request('/api/variantes', {}, { productoId: product.producto_id })
	const first = Array.isArray(variants) ? variants[0] : null

	return {
		...product,
		variante_id: first?.variante_id || null,
		size_id: first?.size_id || null,
		tela_id: first?.tela_id || null,
		stock: first?.stock ?? 0,
		precio: first?.precio || 0,
        precioOferta: first?.precio_oferta || null,
        enOferta: first?.en_oferta || false,
		Size: first?.size || first?.Size || null,
		tela: first?.tela || null,
	}
}

export const productServices = {
	async listCategories() {
		return request('/api/categorias')
	},

	async listTelas() {
		return request('/api/telas')
	},

	async listSizes() {
		return request('/api/sizes')
	},

	async list(filters) {
		const products = await request('/api/products', {}, {
			name: filters.name,
			categoryId: filters.categoryId,
		})

		if (!Array.isArray(products) || products.length === 0) return []
		return Promise.all(products.map(attachFirstVariant))
	},

	async create(payload) {
		const created = await request('/api/products', {
			method: 'POST',
			body: JSON.stringify({
				name: payload.name,
				categoryId: Number(payload.categoryId),
				description: payload.description || null,
			}),
		})

		await request('/api/variantes', {
			method: 'POST',
			body: JSON.stringify({
				productoId: created.producto_id,
				telaId: Number(payload.telaId),
				sizeId: Number(payload.sizeId),
                stock: 0,
				precio: Number(payload.precio),
				precioOferta: Number(payload.precioOferta) || null,
				enOferta: Boolean(payload.enOferta) || false,
			}),
		})

		return created
	},

	async update(payload) {
		await request(`/api/products/${payload.productId}`, {
			method: 'PUT',
			body: JSON.stringify({
				name: payload.name,
				categoryId: Number(payload.categoryId),
				description: payload.description || null,
			}),
		})

		if (payload.variantId) {
			await request(`/api/variantes/${payload.variantId}`, {
				method: 'PUT',
				body: JSON.stringify({
                    telaId: Number(payload.telaId),
					sizeId: Number(payload.sizeId),
                    stock: Number(payload.stock),
					precio: Number(payload.precio),
					precioOferta: Number(payload.precioOferta) || null,
					enOferta: Boolean(payload.enOferta) || false,
				}),
			})
		}
	},

	async remove(productId) {
		await request(`/api/products/${productId}`, {
			method: 'DELETE',
		})
	},

	async setActive(productId, active) {
		return request(`/api/products/${productId}`, {
			method: 'PUT',
			body: JSON.stringify({ activo: Boolean(active) }),
		})
	},
}
