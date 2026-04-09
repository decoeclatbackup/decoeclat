import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { authService } from '../features/auth/services/authService'

const HomePublicPage = lazy(() => import('../features/home/pages/HomePublicPage').then((module) => ({ default: module.HomePublicPage })))
const ProductCatalogPage = lazy(() => import('../features/products/pages/ProductCatalogPage').then((module) => ({ default: module.ProductCatalogPage })))
const ProductDetailPage = lazy(() => import('../features/products/pages/ProductDetailPage').then((module) => ({ default: module.ProductDetailPage })))
const CartPage = lazy(() => import('../features/carrito/pages/CartPage').then((module) => ({ default: module.CartPage })))
const ContactPage = lazy(() => import('../features/home/pages/ContactPage').then((module) => ({ default: module.ContactPage })))
const AdminLoginPage = lazy(() => import('../features/auth/pages/AdminLoginPage').then((module) => ({ default: module.AdminLoginPage })))
const ResetPasswordPage = lazy(() => import('../features/auth/pages/ResetPasswordPage').then((module) => ({ default: module.ResetPasswordPage })))
const HomeAdminPage = lazy(() => import('../features/home/pages/HomeAdminPage').then((module) => ({ default: module.HomeAdminPage })))
const ProductAdminPage = lazy(() => import('../features/products/pages/ProductAdminPage').then((module) => ({ default: module.ProductAdminPage })))
const VentasAdminPage = lazy(() => import('../features/ventas/pages/VentasAdminPage').then((module) => ({ default: module.VentasAdminPage })))

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
    <Suspense fallback={<div className="app-route-loading">Cargando...</div>}>
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
    </Suspense>
  )
}