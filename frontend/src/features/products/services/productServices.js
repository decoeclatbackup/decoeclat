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
	const token = typeof window !== 'undefined'
		? localStorage.getItem('authToken') || localStorage.getItem('token')
		: null
	const hasAuthorizationHeader = Boolean(
		options.headers && (options.headers.Authorization || options.headers.authorization)
	)
	const response = await fetch(buildUrl(path, query), {
		headers: {
			...(isFormData ? {} : { 'Content-Type': 'application/json' }),
			...(!hasAuthorizationHeader && token ? { Authorization: `Bearer ${token}` } : {}),
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
	if (!variantId || !Array.isArray(images) || images.length === 0) return []

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

function normalizeStockValue(rawValue, fallback = 0) {
	const parsed = Number(rawValue)
	if (!Number.isFinite(parsed) || parsed < 0) {
		return Math.max(0, Math.trunc(Number(fallback) || 0))
	}
	return Math.trunc(parsed)
}

function normalizeVariantStocks(variantStocks = []) {
	if (!Array.isArray(variantStocks)) return []

	return variantStocks
		.map((variant) => ({
			sizeId: Number(variant?.sizeId ?? variant?.size_id),
			relleno: Boolean(variant?.relleno),
			stock: normalizeStockValue(variant?.stock, 0),
			precio: Number(variant?.precio ?? variant?.price ?? 0),
			precioOferta: Number(variant?.precioOferta ?? variant?.precio_oferta ?? 0),
			enOferta: Boolean(variant?.enOferta ?? variant?.en_oferta),
		}))
		.filter((variant) => Number.isInteger(variant.sizeId) && variant.sizeId > 0)
}

export function sortVariantsForDisplay(variants = []) {
	if (!Array.isArray(variants)) return []

	return [...variants].sort((left, right) => {
		const leftRelleno = Number(Boolean(left?.relleno))
		const rightRelleno = Number(Boolean(right?.relleno))
		if (leftRelleno !== rightRelleno) return leftRelleno - rightRelleno

		const leftVariantId = Number(left?.variante_id ?? 0)
		const rightVariantId = Number(right?.variante_id ?? 0)
		if (leftVariantId !== rightVariantId) return leftVariantId - rightVariantId

		const leftSizeId = Number(left?.size_id ?? 0)
		const rightSizeId = Number(right?.size_id ?? 0)
		if (leftSizeId !== rightSizeId) return leftSizeId - rightSizeId

		return 0
	})
}

async function attachFirstVariant(product) {
	const variants = await request('/api/variantes', {}, { productoId: product.producto_id })
	const first = sortVariantsForDisplay(variants)[0] || null

	return {
		...product,
		variante_id: first?.variante_id || null,
		size_id: first?.size_id || null,
		tela_id: first?.tela_id || null,
		relleno: Boolean(first?.relleno),
		stock: first?.stock ?? 0,
		precio: first?.precio || 0,
        precioOferta: first?.precio_oferta || null,
        enOferta: first?.en_oferta || false,
		Size: first?.size || first?.Size || null,
		tela: first?.tela || null,
	}
}

export const productServices = {
	async getById(productId) {
		if (!productId) return null
		return request(`/api/products/${productId}`)
	},

	async listVariantsByProduct(productId) {
		if (!productId) return []
		return request('/api/variantes', {}, { productoId: productId })
	},

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

			const normalizedVariantStocks = normalizeVariantStocks(payload.variantStocks)
			const commonVariantPayload = {
				productoId: created.producto_id,
				telaId: Number(payload.telaId),
				precio: Number(payload.precio),
				precioOferta: Number(payload.precioOferta) || null,
				enOferta: Boolean(payload.enOferta) || false,
			}

			let uploadVariantId = null

			if (normalizedVariantStocks.length > 0) {
				for (const variantStock of normalizedVariantStocks) {
					const variantPrice = Number(variantStock.precio || payload.precio)
					const createdVariant = await request('/api/variantes', {
						method: 'POST',
						body: JSON.stringify({
							...commonVariantPayload,
							sizeId: variantStock.sizeId,
							relleno: variantStock.relleno,
							stock: variantStock.stock,
							precio: variantPrice,
							precioOferta: variantStock.enOferta
								? (Number(variantStock.precioOferta) || Number(payload.precioOferta) || null)
								: null,
							enOferta: variantStock.enOferta || Boolean(payload.enOferta),
						}),
					})

					if (!uploadVariantId || variantStock.stock > 0) {
						uploadVariantId = createdVariant.variante_id
					}
				}
			} else {
				const createdVariant = await request('/api/variantes', {
					method: 'POST',
					body: JSON.stringify({
						...commonVariantPayload,
						sizeId: Number(payload.sizeId),
						stock: normalizeStockValue(payload.stock, 0),
					}),
				})

				uploadVariantId = createdVariant.variante_id
			}

			await uploadProductImages(uploadVariantId, payload.images)
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


		const normalizedVariantStocks = normalizeVariantStocks(payload.variantStocks)
		const commonVariantUpdate = {
			telaId: Number(payload.telaId),
			precio: Number(payload.precio),
			precioOferta: Number(payload.precioOferta) || null,
			enOferta: Boolean(payload.enOferta) || false,
		}

		let uploadVariantId = payload.variantId || null

		if (normalizedVariantStocks.length > 0) {
			const existingVariants = await request('/api/variantes', {}, { productoId: payload.productId })
			const existingBySizeAndRelleno = new Map(
				(Array.isArray(existingVariants) ? existingVariants : []).map((variant) => [
					`${Number(variant.size_id)}-${Boolean(variant.relleno)}`,
					variant,
				])
			)

			for (const variantStock of normalizedVariantStocks) {
				const existingVariant = existingBySizeAndRelleno.get(`${variantStock.sizeId}-${Boolean(variantStock.relleno)}`)
				const variantPrice = Number(variantStock.precio || payload.precio)
				const variantOfferEnabled = variantStock.enOferta || Boolean(payload.enOferta)
				const variantOfferPrice = variantOfferEnabled
					? (Number(variantStock.precioOferta) || Number(payload.precioOferta) || null)
					: null

				if (existingVariant?.variante_id) {
					await request(`/api/variantes/${existingVariant.variante_id}`, {
						method: 'PUT',
						body: JSON.stringify({
							telaId: Number(payload.telaId),
							relleno: variantStock.relleno,
							precio: variantPrice,
							precioOferta: variantOfferPrice,
							enOferta: variantOfferEnabled,
							stock: variantStock.stock,
						}),
					})

					if (!uploadVariantId || variantStock.stock > 0) {
						uploadVariantId = existingVariant.variante_id
					}
					continue
				}

				const createdVariant = await request('/api/variantes', {
					method: 'POST',
					body: JSON.stringify({
						productoId: Number(payload.productId),
						sizeId: variantStock.sizeId,
						relleno: variantStock.relleno,
						stock: variantStock.stock,
						telaId: Number(payload.telaId),
						precio: variantPrice,
						precioOferta: variantOfferPrice,
						enOferta: variantOfferEnabled,
					}),
				})

				if (!uploadVariantId || variantStock.stock > 0) {
					uploadVariantId = createdVariant.variante_id
				}
			}
		} else if (payload.variantId) {
			await request(`/api/variantes/${payload.variantId}`, {
				method: 'PUT',
				body: JSON.stringify({
					...commonVariantUpdate,
					sizeId: Number(payload.sizeId),
					stock: normalizeStockValue(payload.stock, 0),
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

		await uploadProductImages(uploadVariantId, payload.images)
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
