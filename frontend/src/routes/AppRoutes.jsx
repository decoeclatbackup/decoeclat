import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ProductAdminPage, ProductCatalogPage, ProductDetailPage } from '../features/products/pages/pages'
import { CartPage } from '../features/carrito/pages/pages'
import { VentasAdminPage } from '../features/ventas/pages/pages'
import { ContactPage, HomeAdminPage, HomePublicPage } from '../features/home/pages/pages'
import { AdminLoginPage, ResetPasswordPage } from '../features/auth/pages/pages'
import { authService } from '../features/auth/services/authService'

function RequireAdminAuth({ children }) {
  const location = useLocation()

  if (!authService.isAdminAuthenticated()) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />
  }

  return children
}

function AdminGuestOnly({ children }) {
  if (authService.isAdminAuthenticated()) {
    return <Navigate to="/admin/home" replace />
  }

  return children
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePublicPage />} />

      <Route
        path="/admin/login"
        element={(
          <AdminGuestOnly>
            <AdminLoginPage />
          </AdminGuestOnly>
        )}
      />

      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route path="/admin" element={<Navigate replace to="/admin/home" />} />

      {/* 1. La vista del Admin */}
      <Route path="/admin/home" element={<RequireAdminAuth><HomeAdminPage /></RequireAdminAuth>} />
      <Route path="/admin/productos" element={<RequireAdminAuth><ProductAdminPage /></RequireAdminAuth>} />
      <Route path="/admin/ventas" element={<RequireAdminAuth><VentasAdminPage /></RequireAdminAuth>} />

      {/* 2. La vista del Cliente (Catálogo General) */}
      <Route path="/catalogo" element={<ProductCatalogPage />} />
      
      {/* 3. Las 7 categorías (Ruta dinámica) */}
      <Route path="/categoria/:categoryId" element={<ProductCatalogPage />} />

      {/* 4. Detalle individual de producto */}
      <Route path="/producto/:productId" element={<ProductDetailPage />} />

      {/* 5. Carrito */}
      <Route path="/carrito" element={<CartPage />} />

      {/* 6. Contacto */}
      <Route path="/contacto" element={<ContactPage />} />

      {/* Redirección por defecto */}
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  )
}