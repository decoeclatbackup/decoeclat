const CLOUDINARY_UPLOAD_MARKER = '/upload/'

function isCloudinaryUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value) && value.includes(CLOUDINARY_UPLOAD_MARKER)
}

function buildTransformationSegment({ width, height, crop = 'limit', quality = 'auto', format = 'auto', dpr = 'auto' } = {}) {
  const parts = []

  if (format) parts.push(`f_${format}`)
  if (quality) parts.push(`q_${quality}`)
  parts.push('fl_strip_profile')
  if (dpr) parts.push(`dpr_${dpr}`)
  if (width) parts.push(`w_${Math.round(width)}`)
  if (height) parts.push(`h_${Math.round(height)}`)
  if (width || height) parts.push(`c_${crop}`)

  return parts.join(',')
}

export function optimizeCloudinaryImageUrl(url, options = {}) {
  if (!isCloudinaryUrl(url)) return url || null

  const [baseUrl, queryString = ''] = String(url).split('?')
  const uploadIndex = baseUrl.indexOf(CLOUDINARY_UPLOAD_MARKER)
  if (uploadIndex < 0) return url

  const prefix = baseUrl.slice(0, uploadIndex + CLOUDINARY_UPLOAD_MARKER.length)
  const suffix = baseUrl.slice(uploadIndex + CLOUDINARY_UPLOAD_MARKER.length)
  const transformation = buildTransformationSegment(options)

  const optimizedUrl = `${prefix}${transformation}/${suffix}`
  return queryString ? `${optimizedUrl}?${queryString}` : optimizedUrl
}

export function buildCloudinarySrcSet(url, widths = [], baseOptions = {}) {
  if (!isCloudinaryUrl(url)) return ''

  const uniqueWidths = [...new Set(widths.map((width) => Number(width)).filter((width) => Number.isFinite(width) && width > 0))]
  if (uniqueWidths.length === 0) return ''

  return uniqueWidths
    .map((width) => `${optimizeCloudinaryImageUrl(url, { ...baseOptions, width })} ${Math.round(width)}w`)
    .join(', ')
}
