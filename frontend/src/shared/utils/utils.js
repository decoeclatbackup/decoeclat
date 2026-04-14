export function formatCurrency(value) {
	const amount = Number(value) || 0

	return new Intl.NumberFormat('es-AR', {
		style: 'currency',
		currency: 'ARS',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(amount)
}

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/pjpeg', 'image/png', 'image/x-png', 'image/webp']
export const MAX_IMAGE_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024
export const MAX_IMAGE_UPLOAD_SIZE_LABEL = '20MB'

export function getImageUploadError(file) {
	if (!file) return ''
	const normalizedType = String(file.type || '').toLowerCase()
	const hasAllowedExtension = /\.(jpe?g|png|webp)$/i.test(String(file.name || ''))
	if (normalizedType && !ALLOWED_IMAGE_TYPES.includes(normalizedType)) {
		return 'Solo se permiten imágenes JPG, PNG o WEBP'
	}
	if (!normalizedType && !hasAllowedExtension) {
		return 'Solo se permiten imágenes JPG, PNG o WEBP'
	}

	if (file.size > MAX_IMAGE_UPLOAD_SIZE_BYTES) {
		return `Solo se permiten imágenes JPG, PNG o WEBP de hasta ${MAX_IMAGE_UPLOAD_SIZE_LABEL}`
	}

	return ''
}
