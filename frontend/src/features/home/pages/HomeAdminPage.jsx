import { MainLayout } from '../../../layouts/layouts'
import AdminNavbar from '../../../shared/components/AdminNavbar'
import { useHomeAdmin } from '../hooks/useHomeAdmin'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

function resolveImageUrl(url) {
  if (!url) return null
  if (/^https?:\/\//i.test(url)) return url
  if (API_BASE_URL) return `${API_BASE_URL}${url}`
  if (url.startsWith('/uploads')) return `http://localhost:4000${url}`
  return url
}

export function HomeAdminPage() {
  const {
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
  } = useHomeAdmin()

  return (
    <MainLayout navbar={<AdminNavbar />}>
      {message ? <p className="alert">{message}</p> : null}
      {error ? <p className="alert">{error}</p> : null}

      <section className="card section-toolbar">
        <div className="actions">
          <button type="button" className="btn" onClick={loadData} disabled={loading || saving}>
            Actualizar home
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Carousel</h2>

        <div className="grid two home-admin-grid">
          <label className="field">
            <span>Imagen desktop</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => updateBannerForm('desktopFile', event.target.files?.[0] || null)}
            />
          </label>

          <label className="field">
            <span>Imagen mobile</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => updateBannerForm('mobileFile', event.target.files?.[0] || null)}
            />
          </label>

          <label className="field">
            <span>Orden</span>
            <input
              type="number"
              min="0"
              value={bannerForm.orden}
              onChange={(event) => updateBannerForm('orden', event.target.value)}
            />
          </label>

          <label className="field">
            <span>Producto vinculado (opcional)</span>
            <select
              value={bannerForm.productoId}
              onChange={(event) => updateBannerForm('productoId', event.target.value)}
            >
              <option value="">Sin producto</option>
              {productos.map((producto) => (
                <option key={producto.producto_id} value={producto.producto_id}>
                  {producto.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="field full-width">
            <span>Categoria vinculada (opcional)</span>
            <select
              value={bannerForm.categoriaId}
              onChange={(event) => updateBannerForm('categoriaId', event.target.value)}
            >
              <option value="">Sin categoria</option>
              {categorias.map((categoria) => (
                <option key={categoria.categoria_id} value={categoria.categoria_id}>
                  {categoria.nombre}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="actions">
          <button type="button" className="btn" onClick={submitBanner} disabled={saving}>
            Agregar banner
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Imagenes actuales</h2>

        {banners.length === 0 ? <p>No hay banners cargados.</p> : null}

        {banners.length > 0 ? (
          <div className="home-admin-media-grid">
            {banners.map((banner) => (
              <article key={banner.carousel_id} className="home-admin-media-card">
                <div className="home-admin-banner-preview-grid">
                  <div>
                    <small>Desktop</small>
                    {resolveImageUrl(banner.img_desktop_url) ? (
                      <img src={resolveImageUrl(banner.img_desktop_url)} alt="Banner desktop" className="home-admin-banner-image" />
                    ) : (
                      <p>Sin imagen desktop</p>
                    )}
                  </div>
                  <div>
                    <small>Mobile</small>
                    {resolveImageUrl(banner.img_mobile_url) ? (
                      <img src={resolveImageUrl(banner.img_mobile_url)} alt="Banner mobile" className="home-admin-banner-image" />
                    ) : (
                      <p>Sin imagen mobile</p>
                    )}
                  </div>
                </div>

                <p>Orden: {Number(banner.orden || 0)}</p>
                <p>Producto: {banner.producto_nombre || '-'}</p>
                <p>Categoria: {banner.categoria_nombre || '-'}</p>

                <div className="actions compact">
                  <button
                    type="button"
                    className={`btn tiny ${banner.activo ? 'success' : 'danger'}`}
                    onClick={() => toggleBannerActivo(banner)}
                    disabled={saving}
                  >
                    {banner.activo ? 'Activo' : 'Inactivo'}
                  </button>
                  <button
                    type="button"
                    className="btn danger tiny"
                    onClick={() => removeBanner(banner.carousel_id)}
                    disabled={saving}
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <section className="card">
        <h2>Productos destacados</h2>

        <div className="grid two home-admin-grid">
          <label className="field">
            <span>Producto</span>
            <select
              value={featuredForm.productoId}
              onChange={(event) => updateFeaturedForm('productoId', event.target.value)}
            >
              <option value="">Seleccionar producto</option>
              {productos.map((producto) => (
                <option key={producto.producto_id} value={producto.producto_id}>
                  {producto.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Orden</span>
            <input
              type="number"
              min="0"
              value={featuredForm.orden}
              onChange={(event) => updateFeaturedForm('orden', event.target.value)}
            />
          </label>
        </div>

        <div className="actions">
          <button type="button" className="btn" onClick={submitFeaturedProduct} disabled={saving}>
            Agregar destacado
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Destacados cargados ({productosDestacados.length})</h2>

        {productosDestacados.length === 0 ? <p>No hay productos destacados cargados.</p> : null}

        {productosDestacados.length > 0 ? (
          <div className="home-admin-featured-grid">
            {productosDestacados.map((item) => (
              <article key={item.home_id} className="home-admin-featured-card">
                {resolveImageUrl(item.imagen_principal) ? (
                  <img
                    src={resolveImageUrl(item.imagen_principal)}
                    alt={item.nombre}
                    className="home-admin-featured-thumb"
                  />
                ) : null}
                <h3>{item.nombre}</h3>
                <p>Orden: {Number(item.orden || 0)}</p>
                <p>{item.descripcion || 'Sin descripcion'}</p>
                <div className="actions compact">
                  <button
                    type="button"
                    className={`btn tiny ${item.activo ? 'success' : 'danger'}`}
                    onClick={() => toggleFeaturedActivo(item)}
                    disabled={saving}
                  >
                    {item.activo ? 'Activo' : 'Inactivo'}
                  </button>
                  <button
                    type="button"
                    className="btn danger tiny"
                    onClick={() => removeFeaturedProduct(item.home_id)}
                    disabled={saving}
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </MainLayout>
  )
}
