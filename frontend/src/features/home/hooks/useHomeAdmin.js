import { useCallback, useEffect, useState } from 'react'
import { homeAdminService } from '../services/homeAdminService'

const EMPTY_BANNER_FORM = {
  desktopFile: null,
  mobileFile: null,
  orden: '0',
  productoId: '',
  categoriaId: '',
}

const EMPTY_FEATURED_FORM = {
  productoId: '',
  orden: '0',
}

export function useHomeAdmin() {
  const [banners, setBanners] = useState([])
  const [productosDestacados, setProductosDestacados] = useState([])
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [bannerForm, setBannerForm] = useState(EMPTY_BANNER_FORM)
  const [featuredForm, setFeaturedForm] = useState(EMPTY_FEATURED_FORM)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [homeData, productosData, categoriasData] = await Promise.all([
        homeAdminService.getHomeData(),
        homeAdminService.listProducts(),
        homeAdminService.listCategories(),
      ])

      setBanners(Array.isArray(homeData?.banners) ? homeData.banners : [])
      setProductosDestacados(Array.isArray(homeData?.productosDestacados) ? homeData.productosDestacados : [])
      setProductos(Array.isArray(productosData) ? productosData : [])
      setCategorias(Array.isArray(categoriasData) ? categoriasData : [])
    } catch (err) {
      setError(err?.message || 'No se pudieron cargar los datos del home')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  function updateBannerForm(name, value) {
    setBannerForm((prev) => ({ ...prev, [name]: value }))
  }

  function updateFeaturedForm(name, value) {
    setFeaturedForm((prev) => ({ ...prev, [name]: value }))
  }

  async function submitBanner() {
    setSaving(true)
    setError('')
    setMessage('')

    try {
      await homeAdminService.addBanner(bannerForm)
      setBannerForm(EMPTY_BANNER_FORM)
      setMessage('Banner agregado correctamente')
      await loadData()
    } catch (err) {
      setError(err?.message || 'No se pudo agregar el banner')
    } finally {
      setSaving(false)
    }
  }

  async function removeBanner(carouselId) {
    if (!window.confirm('¿Eliminar este banner?')) return

    setSaving(true)
    setError('')
    setMessage('')

    try {
      await homeAdminService.removeBanner(carouselId)
      setMessage('Banner eliminado correctamente')
      setBanners((prev) => prev.filter((item) => Number(item.carousel_id) !== Number(carouselId)))
    } catch (err) {
      setError(err?.message || 'No se pudo eliminar el banner')
    } finally {
      setSaving(false)
    }
  }

  async function toggleBannerActivo(item) {
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const updated = await homeAdminService.updateBanner(item.carousel_id, {
        activo: !item.activo,
      })
      setBanners((prev) =>
        prev.map((banner) =>
          Number(banner.carousel_id) === Number(item.carousel_id)
            ? { ...banner, ...updated, activo: Boolean(updated?.activo) }
            : banner
        )
      )
      setMessage('Estado del banner actualizado')
    } catch (err) {
      setError(err?.message || 'No se pudo actualizar el estado del banner')
    } finally {
      setSaving(false)
    }
  }

  async function submitFeaturedProduct() {
    setSaving(true)
    setError('')
    setMessage('')

    try {
      if (!featuredForm.productoId) {
        throw new Error('Debes seleccionar un producto destacado')
      }

      await homeAdminService.addFeaturedProduct(featuredForm)
      setFeaturedForm(EMPTY_FEATURED_FORM)
      setMessage('Producto destacado agregado correctamente')
      await loadData()
    } catch (err) {
      setError(err?.message || 'No se pudo agregar el producto destacado')
    } finally {
      setSaving(false)
    }
  }

  async function removeFeaturedProduct(homeId) {
    if (!window.confirm('¿Eliminar este producto destacado?')) return

    setSaving(true)
    setError('')
    setMessage('')

    try {
      await homeAdminService.removeFeaturedProduct(homeId)
      setMessage('Producto destacado eliminado correctamente')
      setProductosDestacados((prev) => prev.filter((item) => Number(item.home_id) !== Number(homeId)))
    } catch (err) {
      setError(err?.message || 'No se pudo eliminar el producto destacado')
    } finally {
      setSaving(false)
    }
  }

  async function toggleFeaturedActivo(item) {
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const updated = await homeAdminService.updateFeaturedProduct(item.home_id, {
        activo: !item.activo,
      })
      setProductosDestacados((prev) =>
        prev.map((prod) =>
          Number(prod.home_id) === Number(item.home_id)
            ? { ...prod, ...updated, activo: Boolean(updated?.activo) }
            : prod
        )
      )
      setMessage('Estado del destacado actualizado')
    } catch (err) {
      setError(err?.message || 'No se pudo actualizar el estado del destacado')
    } finally {
      setSaving(false)
    }
  }

  return {
    banners,
    productosDestacados,
    productos,
    categorias,
    bannerForm,
    featuredForm,
    loading,
    saving,
    message,
    error,
    updateBannerForm,
    updateFeaturedForm,
    submitBanner,
    removeBanner,
    toggleBannerActivo,
    submitFeaturedProduct,
    removeFeaturedProduct,
    toggleFeaturedActivo,
    loadData,
  }
}
