import { useEffect, useMemo, useState } from 'react'
import { homePublicService } from '../services/homePublicService'
import { resolveAssetUrl } from '../../../shared/utils/apiBaseUrl'

function resolveImageUrl(url) {
  return resolveAssetUrl(url)
}

export function useHomePublic() {
  const [banners, setBanners] = useState([])
  const [productosDestacados, setProductosDestacados] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(max-width: 768px)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const mediaQuery = window.matchMedia('(max-width: 768px)')
    const handleChange = (event) => {
      setIsMobileViewport(event.matches)
    }

    setIsMobileViewport(mediaQuery.matches)

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }

    mediaQuery.addListener(handleChange)
    return () => mediaQuery.removeListener(handleChange)
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      setLoading(true)
      setError('')

      const categoriesPromise = homePublicService
        .listCategories()
        .then((categoriesData) => {
          if (!isMounted) return
          setCategories(Array.isArray(categoriesData) ? categoriesData : [])
        })
        .catch(() => {
          if (!isMounted) return
          setCategories([])
        })

      try {
        const homeData = await homePublicService.getHomeData()

        if (!isMounted) return

        setBanners(Array.isArray(homeData?.banners) ? homeData.banners : [])
        setProductosDestacados(
          Array.isArray(homeData?.productosDestacados) ? homeData.productosDestacados : []
        )
      } catch (err) {
        if (!isMounted) return
        setError(err?.message || 'No se pudo cargar el home')
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }

      await categoriesPromise
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [])

  const bannersWithImage = useMemo(
    () =>
      banners
        .map((banner) => {
          const mobileImage = resolveImageUrl(banner?.img_mobile_url)
          const desktopImage = resolveImageUrl(banner?.img_desktop_url)

          return {
            ...banner,
            imageUrl: isMobileViewport ? mobileImage : desktopImage,
          }
        })
        .filter((banner) => Boolean(banner.imageUrl)),
    [banners, isMobileViewport]
  )

  const featuredProducts = useMemo(
    () =>
      productosDestacados.map((item) => ({
        ...item,
        imagen_principal: resolveImageUrl(item?.imagen_principal),
        imagen_secundaria: resolveImageUrl(item?.imagen_secundaria),
        imagenPrincipal: resolveImageUrl(item?.imagen_principal),
        imagenSecundaria: resolveImageUrl(item?.imagen_secundaria),
      })),
    [productosDestacados]
  )

  return {
    banners: bannersWithImage,
    featuredProducts,
    categories,
    loading,
    error,
  }
}
