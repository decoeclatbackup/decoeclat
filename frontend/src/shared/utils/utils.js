export function formatCurrency(value) {
	const amount = Number(value) || 0

	return new Intl.NumberFormat('es-AR', {
		style: 'currency',
		currency: 'ARS',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(amount)
}
