import { Helmet } from 'react-helmet-async'
import { useLocation } from 'react-router-dom'

const DEFAULT_SITE_NAME = 'DECOECLAT'
const DEFAULT_DESCRIPTION = 'Textiles, fundas y deco para transformar tu hogar con estilo. Comprá online con envíos a todo el país.'
const DEFAULT_IMAGE_PATH = '/d.jpg'

function buildAbsoluteUrl(value) {
  if (typeof window === 'undefined') return String(value || '')

  const trimmedValue = String(value || '').trim()
  if (!trimmedValue) return `${window.location.origin}/`

  if (/^https?:\/\//i.test(trimmedValue)) return trimmedValue

  const safePath = trimmedValue.startsWith('/') ? trimmedValue : `/${trimmedValue}`
  return `${window.location.origin}${safePath}`
}

export function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords,
  image = DEFAULT_IMAGE_PATH,
  canonicalUrl,
  noIndex = false,
  siteName = DEFAULT_SITE_NAME,
  locale = 'es_AR',
  type = 'website',
  twitterCard = 'summary_large_image',
}) {
  const location = useLocation()
  const resolvedTitle = String(title || '').trim()
  const resolvedDescription = String(description || '').trim() || DEFAULT_DESCRIPTION
  const resolvedImage = buildAbsoluteUrl(image)
  const resolvedCanonicalUrl = canonicalUrl || `${window.location.origin}${location.pathname}${location.search}`
  const robotsContent = noIndex
    ? 'noindex,nofollow,noarchive'
    : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'

  // Mantener los metadatos en un solo lugar evita duplicados entre páginas y layouts.
  return (
    <Helmet titleTemplate={`${siteName} | %s`} defaultTitle={siteName}>
      {resolvedTitle ? <title>{resolvedTitle}</title> : null}
      <meta name="description" content={resolvedDescription} />
      {keywords ? <meta name="keywords" content={keywords} /> : null}
      <meta name="robots" content={robotsContent} />
      <link rel="canonical" href={resolvedCanonicalUrl} />

      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={resolvedTitle || siteName} />
      <meta property="og:description" content={resolvedDescription} />
      <meta property="og:url" content={resolvedCanonicalUrl} />
      <meta property="og:image" content={resolvedImage} />
      <meta property="og:image:alt" content={`${siteName} - ${resolvedTitle || 'textiles y deco para el hogar'}`} />

      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={resolvedTitle || siteName} />
      <meta name="twitter:description" content={resolvedDescription} />
      <meta name="twitter:image" content={resolvedImage} />
      <meta name="twitter:image:alt" content={`${siteName} - ${resolvedTitle || 'textiles y deco para el hogar'}`} />
    </Helmet>
  )
}