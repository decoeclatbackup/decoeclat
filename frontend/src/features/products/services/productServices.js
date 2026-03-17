const API_BASE_URL = import.meta.env.VITE_API_URL || ''

function buildUrl(path, query = {}) {
	const params = new URLSearchParams()

	Object.entries(query).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== '') {
			// Si es un array, convertir a cadena separada por comas
			const paramValue = Array.isArray(value) ? value.join(',') : value
			params.append(key, paramValue)
		}
	})

	const qs = params.toString()
	return `${API_BASE_URL}${path}${qs ? `?${qs}` : ''}`
}

async function request(path, options = {}, query) {
	const isFormData = options.body instanceof FormData
	const response = await fetch(buildUrl(path, query), {
		headers: {
			...(isFormData ? {} : { 'Content-Type': 'application/json' }),
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

async function uploadProductImages(variantId, images = []) {
	if (!Array.isArray(images) || images.length === 0) return []

	const orderedImages = [...images].sort((left, right) => Number(left.orden ?? 0) - Number(right.orden ?? 0))
	const uploaded = []

	for (const image of orderedImages) {
		const formData = new FormData()
		formData.append('variante_id', String(variantId))
		formData.append('principal', String(Boolean(image.principal)))
		formData.append('orden', String(Number(image.orden ?? 0)))
		formData.append('url', image.file)

		uploaded.push(
			await request('/api/imagenes', {
				method: 'POST',
				body: formData,
			})
		)
	}

	return uploaded
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
	async listImagesByProduct(productId) {
		if (!productId) return []
		return request(`/api/imagenes/producto/${productId}`)
	},

	async updateImage(imageId, updates = {}) {
		if (!imageId) return null
		return request(`/api/imagenes/${imageId}`, {
			method: 'PUT',
			body: JSON.stringify(updates),
		})
	},

	async deleteImage(imageId) {
		if (!imageId) return null
		return request(`/api/imagenes/${imageId}`, {
			method: 'DELETE',
		})
	},

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
			sizeId: filters.sizeId,
			sizeTypeId: filters.sizeTypeId,
			telaId: filters.telaId,
		})

		if (!Array.isArray(products) || products.length === 0) return []
		return Promise.all(products.map(attachFirstVariant))
	},

	async create(payload) {
		let created = null

		try {
			created = await request('/api/products', {
				method: 'POST',
				body: JSON.stringify({
					name: payload.name,
					categoryId: Number(payload.categoryId),
					description: payload.description || null,
				}),
			})

			const createdVariant = await request('/api/variantes', {
				method: 'POST',
				body: JSON.stringify({
					productoId: created.producto_id,
					telaId: Number(payload.telaId),
					sizeId: Number(payload.sizeId),
                    stock: Number(payload.stock) || 0,
					precio: Number(payload.precio),
					precioOferta: Number(payload.precioOferta) || null,
					enOferta: Boolean(payload.enOferta) || false,
				}),
			})

			await uploadProductImages(createdVariant.variante_id, payload.images)
			return created
		} catch (error) {
			if (created?.producto_id) {
				try {
					await request(`/api/products/${created.producto_id}`, {
						method: 'DELETE',
					})
				} catch {
					// Si falla la limpieza, devolvemos igual el error original.
				}
			}
			throw error
		}
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

		const existingImageChanges = payload.existingImageChanges || {}
		const removedImageIds = Array.isArray(existingImageChanges.removedImageIds)
			? [...new Set(existingImageChanges.removedImageIds)].filter(Boolean)
			: []

		if (removedImageIds.length > 0) {
			await Promise.all(
				removedImageIds.map((imageId) =>
					request(`/api/imagenes/${imageId}`, {
						method: 'DELETE',
					})
				)
			)
		}

		const existingImages = Array.isArray(existingImageChanges.existingImages)
			? existingImageChanges.existingImages
			: []

		if (existingImages.length > 0) {
			await Promise.all(
				existingImages
					.filter((image) => image?.img_id != null)
					.map((image, index) =>
						request(`/api/imagenes/${image.img_id}`, {
							method: 'PUT',
							body: JSON.stringify({
								orden: Number(image.orden ?? index),
							}),
						})
					)
			)
		}

		await uploadProductImages(payload.variantId, payload.images)
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
