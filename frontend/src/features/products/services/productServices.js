const API_BASE_URL = import.meta.env.VITE_API_URL || ''
const ALLOWED_PRODUCT_COLORS = new Map([
	['beige', 'Beige'],
	['arena', 'Arena'],
	['avellana', 'Avellana'],
	['khaki', 'Khaki'],
	['blanco', 'Blanco'],
	['negro', 'Negro'],
	['gris perla', 'Gris Perla'],
	['gris aero', 'Gris Aero'],
	['gris acero', 'Gris Acero'],
	['verde', 'Verde'],
	['rosa', 'Rosa'],
	['canela', 'Canela'],
	['amarillo', 'Amarillo'],
	['chocolate', 'Chocolate'],
])

function normalizeText(value) {
	return String(value || '')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.trim()
		.toLowerCase()
}

function normalizeColor(value) {
	const colorKey = normalizeText(value)
	if (!colorKey) return null
	return ALLOWED_PRODUCT_COLORS.get(colorKey) || null
}

function normalizeSelectedColors(colors = []) {
	if (!Array.isArray(colors)) return []

	const normalized = colors
		.map((color) => normalizeColor(color))
		.filter(Boolean)

	return [...new Set(normalized)]
}

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
	const method = String(options.method || 'GET').toUpperCase()
	const hasBody = options.body != null
	const token = typeof window !== 'undefined'
		? localStorage.getItem('authToken') || localStorage.getItem('token')
		: null
	const hasAuthorizationHeader = Boolean(
		options.headers && (options.headers.Authorization || options.headers.authorization)
	)
	const requestInit = {
		...options,
		headers: {
			...(!isFormData && hasBody ? { 'Content-Type': 'application/json' } : {}),
			...(!hasAuthorizationHeader && token ? { Authorization: `Bearer ${token}` } : {}),
			...(options.headers || {}),
		},
		cache: method === 'GET' ? 'no-store' : options.cache,
	}

	const requestUrl = buildUrl(path, query)
	let response

	try {
		response = await fetch(requestUrl, requestInit)
	} catch {
		if (method !== 'GET' && method !== 'HEAD') {
			throw new Error('Error de conexion con el servidor')
		}

		const retryUrl = buildUrl(path, { ...(query || {}), _cb: Date.now() })
		try {
			response = await fetch(retryUrl, requestInit)
		} catch {
			throw new Error('Error de conexion con el servidor')
		}
	}

	if (response.status === 304 && (method === 'GET' || method === 'HEAD')) {
		const retryUrl = buildUrl(path, { ...(query || {}), _cb: Date.now() })
		response = await fetch(retryUrl, requestInit)
	}

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
	if (response.status === 304) return null
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
			color: normalizeColor(variant?.color),
			relleno: Boolean(variant?.relleno),
			stock: normalizeStockValue(variant?.stock, 0),
			precio: Number(variant?.precio ?? variant?.price ?? 0),
			precioOferta: Number(variant?.precioOferta ?? variant?.precio_oferta ?? 0),
			enOferta: Boolean(variant?.enOferta ?? variant?.en_oferta),
		}))
		.filter((variant) => Number.isInteger(variant.sizeId) && variant.sizeId > 0)
}

function normalizeColorStocks(colorStocks = {}) {
	if (!colorStocks || typeof colorStocks !== 'object' || Array.isArray(colorStocks)) return {}

	return Object.entries(colorStocks).reduce((acc, [colorName, stockValue]) => {
		const normalizedColor = normalizeColor(colorName)
		if (!normalizedColor) return acc

		acc[normalizedColor] = normalizeStockValue(stockValue, 0)
		return acc
	}, {})
}

export function sortVariantsForDisplay(variants = []) {
	if (!Array.isArray(variants)) return []

	return [...variants].sort((left, right) => {
		const leftRelleno = Number(Boolean(left?.relleno))
		const rightRelleno = Number(Boolean(right?.relleno))
		if (leftRelleno !== rightRelleno) return leftRelleno - rightRelleno

		const leftColor = normalizeText(left?.color)
		const rightColor = normalizeText(right?.color)
		if (leftColor !== rightColor) return leftColor.localeCompare(rightColor)

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
		color: first?.color || null,
			colors: Array.isArray(product?.colors) ? product.colors : [],
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

function buildVariantPayloads(payload, normalizedVariantStocks) {
	const selectedColors = normalizeSelectedColors(payload.selectedColors)
	const colorStocks = normalizeColorStocks(payload.colorStocks)
	const hasSizeBasedVariants = normalizedVariantStocks.length > 0

	if (!hasSizeBasedVariants && selectedColors.length > 0) {
		return selectedColors.map((color) => ({
			sizeId: Number(payload.sizeId),
			color,
			relleno: false,
			stock: normalizeStockValue(colorStocks[color] ?? payload.stock, 0),
			precio: Number(payload.precio),
			precioOferta: Number(payload.precioOferta) || null,
			enOferta: Boolean(payload.enOferta) || false,
		}))
	}

	const baseVariantPayloads = hasSizeBasedVariants
		? normalizedVariantStocks.map((variantStock) => {
			const variantPrice = Number(variantStock.precio || payload.precio)
			const variantOfferEnabled = variantStock.enOferta || Boolean(payload.enOferta)
			const variantOfferPrice = variantOfferEnabled
				? (Number(variantStock.precioOferta) || Number(payload.precioOferta) || null)
				: null

			return {
				sizeId: variantStock.sizeId,
				color: normalizeColor(variantStock.color),
				relleno: Boolean(variantStock.relleno),
				stock: variantStock.stock,
				precio: variantPrice,
				precioOferta: variantOfferPrice,
				enOferta: variantOfferEnabled,
			}
		})
		: [{
			sizeId: Number(payload.sizeId),
			color: null,
			relleno: false,
			stock: normalizeStockValue(payload.stock, 0),
			precio: Number(payload.precio),
			precioOferta: Number(payload.precioOferta) || null,
			enOferta: Boolean(payload.enOferta) || false,
		}]

	const expandedByColor = []
	baseVariantPayloads.forEach((variantPayload) => {
		if (variantPayload.color) {
			expandedByColor.push(variantPayload)
			return
		}

		if (selectedColors.length === 0) {
			expandedByColor.push(variantPayload)
			return
		}

		selectedColors.forEach((color) => {
			expandedByColor.push({
				...variantPayload,
				color,
			})
		})
	})

	return expandedByColor.filter((variantPayload) => Number.isInteger(Number(variantPayload.sizeId)) && Number(variantPayload.sizeId) > 0)
}

function buildVariantKey(sizeId, relleno, color) {
	const normalizedColor = normalizeColor(color)
	return `${Number(sizeId)}-${Boolean(relleno)}-${normalizedColor || ''}`
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
			color: filters.color,
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
			const variantPayloads = buildVariantPayloads(payload, normalizedVariantStocks)
			if (variantPayloads.length === 0) {
				throw new Error('Debe existir al menos una variante valida para guardar el producto')
			}
			const commonVariantPayload = {
				productoId: created.producto_id,
				telaId: Number(payload.telaId),
			}

			let uploadVariantId = null

			for (const variantPayload of variantPayloads) {
				const createdVariant = await request('/api/variantes', {
					method: 'POST',
					body: JSON.stringify({
						...commonVariantPayload,
						sizeId: variantPayload.sizeId,
						color: variantPayload.color,
						relleno: variantPayload.relleno,
						stock: variantPayload.stock,
						precio: variantPayload.precio,
						precioOferta: variantPayload.precioOferta,
						enOferta: variantPayload.enOferta,
					}),
				})

				if (!uploadVariantId || variantPayload.stock > 0) {
					uploadVariantId = createdVariant.variante_id
				}
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
		const variantPayloads = buildVariantPayloads(payload, normalizedVariantStocks)
		if (variantPayloads.length === 0) {
			throw new Error('Debe existir al menos una variante valida para guardar el producto')
		}
		const commonVariantUpdate = {
			telaId: Number(payload.telaId),
		}

		let uploadVariantId = payload.variantId || null

		const existingVariants = await request('/api/variantes', {}, { productoId: payload.productId })
		const existingByKey = new Map(
			(Array.isArray(existingVariants) ? existingVariants : []).map((variant) => [
				buildVariantKey(variant.size_id, variant.relleno, variant.color),
				variant,
			])
		)
		const usedVariantIds = new Set()

		for (const variantPayload of variantPayloads) {
			const variantKey = buildVariantKey(variantPayload.sizeId, variantPayload.relleno, variantPayload.color)
			const existingVariant = existingByKey.get(variantKey)

			if (existingVariant?.variante_id) {
				await request(`/api/variantes/${existingVariant.variante_id}`, {
					method: 'PUT',
					body: JSON.stringify({
						...commonVariantUpdate,
						sizeId: variantPayload.sizeId,
						color: variantPayload.color,
						relleno: variantPayload.relleno,
						precio: variantPayload.precio,
						precioOferta: variantPayload.precioOferta,
						enOferta: variantPayload.enOferta,
						stock: variantPayload.stock,
						activo: true,
					}),
				})

				usedVariantIds.add(Number(existingVariant.variante_id))
				if (!uploadVariantId || variantPayload.stock > 0) {
					uploadVariantId = existingVariant.variante_id
				}
				continue
			}

			const createdVariant = await request('/api/variantes', {
				method: 'POST',
				body: JSON.stringify({
					productoId: Number(payload.productId),
					sizeId: variantPayload.sizeId,
					color: variantPayload.color,
					relleno: variantPayload.relleno,
					stock: variantPayload.stock,
					telaId: Number(payload.telaId),
					precio: variantPayload.precio,
					precioOferta: variantPayload.precioOferta,
					enOferta: variantPayload.enOferta,
				}),
			})

			usedVariantIds.add(Number(createdVariant.variante_id))
			if (!uploadVariantId || variantPayload.stock > 0) {
				uploadVariantId = createdVariant.variante_id
			}
		}

		if (Array.isArray(existingVariants)) {
			for (const existingVariant of existingVariants) {
				const existingVariantId = Number(existingVariant?.variante_id)
				if (!Number.isInteger(existingVariantId) || usedVariantIds.has(existingVariantId)) continue

				await request(`/api/variantes/${existingVariantId}`, {
					method: 'PUT',
					body: JSON.stringify({ activo: false }),
				})
			}
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
